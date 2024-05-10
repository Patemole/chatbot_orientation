import json
from langchain.agents.openai_functions_agent.agent_token_buffer_memory import AgentTokenBufferMemory
from langchain.agents.openai_functions_agent.base import OpenAIFunctionsAgent
from langchain.prompts import MessagesPlaceholder
from langchain.schema.messages import SystemMessage
from langchain.agents import AgentExecutor
from langchain.chat_models import ChatOpenAI
from airs.database.dynamo_db.chat import store_message_async
from airs.agent.callback_handler import CustomAsyncIteratorCallbackHandler
from langchain_groq import ChatGroq

from airs.agent.config_agent import MEMORY_KEY

from langchain.callbacks.streaming_stdout_final_only import (
    FinalStreamingStdOutCallbackHandler,
)

from typing import AsyncIterable, Awaitable, List
import asyncio
import os

from airs.agent.tools.create_agent_tools import create_agent_tools
from airs.agent.models import CitationDocument


os.environ['GROQ_API_KEY'] = "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"
# Récupération de la clé API à partir des variables d'environnement
groq_api_key = os.environ.get('GROQ_API_KEY')

# Socratic Chat enabler
SOCRATIC_ENABLED = True
def get_model_from_config():
    try:
        config_path = os.path.join(os.path.dirname(__file__), 'config_file.txt')
        with open(config_path, "r") as config_file:
            return config_file.read().strip()
    except FileNotFoundError:
        return 'gpt-3.5-turbo'

class RAGAgent:
    def __init__(
            self,
            chat_id,
            course_id : str,
            course_name : str = ""
        ):
        # Course Name
        self.course_name = course_name
        # Course ID
        self.course_id = course_id
        # Chat ID
        self.chat_id = chat_id


        
        # System message before prompt
        self.system_message = SystemMessage(
            content=(
                "Lucy is an academic adviser chatbot that helps you select your courses for next semester. You must be very pleasant in your answers but concise. You have to give the information right away.You must give only the information requested. You should also ask the student questions. For example, you can ask if he wants more informations. "
                 + (f" Lucy is assisting for the course {course_name}" if course_name else "") 
            )
        )

        
        
        # Mise à jour du prompt pour le chatbot d'orientation, Lucy
        #self.system_message = SystemMessage(
            #content=(
                #'''Hi there! I'm Lucy, your educational assistant. I'm here to help you navigate
                #and find the best learning paths tailored to your interests. I can provide informations and advice about any courses at Penn of your choice.
                #You have also to understand the need of the student and do not hesitate to ask questions to be sure to give the best answer. 
                #Feel free to ask me anything about your courses or if you need suggestions on what to study next!
                #If you don't know tell you don't know.'''
            #)
       # )
        


        # Prompt Template
        self.prompt = OpenAIFunctionsAgent.create_prompt(
                    system_message=self.system_message,
                    extra_prompt_messages=[MessagesPlaceholder(variable_name=MEMORY_KEY)],
                )
        # Tools available to agent
        self.cited_documents : List[CitationDocument]= []
        self.tools =create_agent_tools(user_id="", course_id=course_id, course_name=course_name, session_documents=self.cited_documents)
        self.callback = CustomAsyncIteratorCallbackHandler()

        # LLM 
        '''
        chosen_model = get_model_from_config() if SOCRATIC_ENABLED else 'gpt-3.5-turbo'
        #chosen_model = 'gpt-4-turbo'
        self.llm = ChatOpenAI(
                streaming=True, 
                callbacks=[self.callback, FinalStreamingStdOutCallbackHandler()],
                model_name=chosen_model,
                temperature=0.0,
                #openai_api_key= "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"
                openai_api_key="sk-proj-caW5AbDBLBwwTmIF81v3T3BlbkFJoyA1d3tBYjoR55QBlEhh"
            )
        '''
        
        #TEST WOTH GROQAPI MODEL AND LLAMA3
        self.llm = ChatGroq(
                streaming=True, 
                callbacks=[self.callback, FinalStreamingStdOutCallbackHandler()],
                model_name="llama3-8b-8192",
                temperature=0.0,
                groq_api_key= groq_api_key
            )
        print(self.llm)
        

        # Memory to store past inputs, actions taken, and responses
        self.memory = AgentTokenBufferMemory(
                memory_key=MEMORY_KEY, 
                llm=self.llm
            )
        # Agent
        self.agent = OpenAIFunctionsAgent(
            llm=self.llm, 
            tools=self.tools, 
            prompt=self.prompt
        )
        
        # Agent Executor
        self.executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            memory=self.memory,
            verbose=True,
            return_intermediate_steps=True,
        )
    
    def add_messages_to_agent_memory(self, messages):
         for message in messages: 
            print(message)
            if message['username'] == "TAI":
                self.memory.chat_memory.add_ai_message(message['body'])
            else:
                self.memory.chat_memory.add_user_message(message['body'])

    async def run(self, input_query: str):
        return await self.executor({"input" : input_query}, include_run_info=True)

    async def get_stream(self, input: str) -> AsyncIterable[str]:
        # Clear citations
        self.cited_documents.clear()
        async def wrap_request(fn: Awaitable, event: asyncio.Event):
            """Wrap API request."""
            try:
                await fn
            except Exception as e:
                # TODO: handle exception
                print(f"Caught exception test: {e}")
                # Optionally, log the input data or other details
                print(f"Input data causing issue: {input}")

            finally:
                # Signal the termination of the request
                event.set()

        # Begin a task that runs in the background.
        print("this is the input")
        print(input)

        task = asyncio.create_task(
            wrap_request(
                self.executor.ainvoke({"input" : input}),
                self.callback.terminate
            )
        )
        # Wait for input or termination
        await asyncio.wait(
            [
                asyncio.ensure_future(self.callback.received_input.wait()), 
                asyncio.ensure_future(self.callback.terminate.wait())
            ], 
            return_when=asyncio.FIRST_COMPLETED
            )
        response = []
        async for token in self.callback.aiter():
            response.append(token)
            yield json.dumps({'answer_piece': token}) + "\n"
        # Yield Document Citations
        for doc in self.cited_documents:
            packet = {'answer_document': doc.model_dump()}
            yield json.dumps(packet) + "\n"
        # Store AI Response
        documents = list(map(lambda doc: doc.model_dump(), self.cited_documents))
        asyncio.ensure_future(store_message_async(chat_id=self.chat_id, course_id = self.course_id, message_body=''.join(response), documents=documents))        
        await task
        