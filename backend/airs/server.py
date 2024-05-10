import sys
# Ajouter le dossier backend au chemin d'accès Python
sys.path.append('/Users/gregoryhissiger/Desktop/CHATBOT_ORIENTATION_COURSES/backend')


# Load environment variables from the Data Ingestion Service root directory
import asyncio
import threading
from fastapi import APIRouter, FastAPI, Request, Response
import logging
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from uuid import uuid4
from datetime import datetime

#from airs.model.chat_history_query import ChatHistoryQuery
from airs.session.cleanup_sessions import cleanup_sessions
from airs.session.agent_session import AgentSession


#from airs.agent.rag_agent import RAGAgent
#for chat orientation
from airs.agent.rag_agent import RAGAgent


from airs.model.input_query import InputQuery
from third_party_api_clients.pinecone.pinecone_api_client import PineconeApiClient
from airs.database.dynamo_db.chat import get_chat_history
from airs.database.dynamo_db.chat import store_message_async


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s]: %(message)s", 
    datefmt="%Y-%m-%d %H:%M:%S", 
    handlers=[
        logging.StreamHandler(),  
        logging.FileHandler("airs.log")
    ] 
)

app = FastAPI(
    title="AI Retrieval Service",
    version="0.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory Storage for sessions
sessions = {}

# Clean up Thread
background_thread = threading.Thread(target=cleanup_sessions, args=(sessions,))
# Start the thread
background_thread.start()

airs_router = APIRouter(prefix='/chat', tags=['chat'])

# @airs_router.post("/preload_agent_memory")
# async def preload_agent_memory(request: Request, response: Response, input_query: InputQuery) -> StreamingResponse:
#     chat_id = input_query.chat_id
#     course_name = "Intro to Economics" # TODO: replace with pre-fetch
#     session_id = request.cookies.get("session_id")  

@airs_router.post("/send_message")
async def chat(
    request: Request, 
    response: Response, 
    input_query : InputQuery
    ) -> StreamingResponse:
    chat_id = input_query.chat_id
    course_name = "Orientation" # TODO: replace with pre-fetch
    session_id = request.cookies.get("session_id")
    # Check if a session exists for the given session id or if the session expired
    set_session_cookie = False
    if session_id not in sessions or sessions[session_id].expiration < datetime.now():
        if session_id in sessions and sessions[session_id].expiration < datetime.now(): logging.info(f"Session expired: {session_id}")
        # If not, create a new session and set some initial data, including an object
        session_id = str(uuid4())
        agent_session = AgentSession(
            id = session_id,
            user_name=input_query.username,
            course_name= course_name,
            agent=RAGAgent(course_name=course_name, course_id=input_query.course_id, chat_id=chat_id)
        )
        sessions[session_id] = agent_session
        set_session_cookie = True
        logging.info(f"Created session: {session_id} for client: {request.client.host}")
        # Attempt to get chat history from DynamoDB
        chat_history = await get_chat_history(chat_id)
        print(chat_history)
        agent_session.agent.add_messages_to_agent_memory(chat_history)
    else:
        agent_session = sessions[session_id]
    # Add message to dynamo db
    asyncio.ensure_future(store_message_async(chat_id, username=input_query.username, course_id=input_query.course_id, message_body = input_query.message))
    # Respond to query
    response = StreamingResponse(
        agent_session.agent.get_stream(input = input_query.message), 
        media_type="text/event-stream"
        )
    if set_session_cookie:
        response.set_cookie(key="session_id",  value=session_id)
    # Add response to dynamo db
    return response

@airs_router.get("/get_chat_history/{chat_id}")
async def get_chat_history_route(chat_id : str):
    return await get_chat_history(chat_id)

@airs_router.get("/")
async def default():
    return {"host": "AI Retrieval Service","Version": 0.0, "Vector Embeddings Index": PineconeApiClient().index.describe_index_stats().to_dict()}

# Inclure le routeur dans l'application principale
app.include_router(airs_router)