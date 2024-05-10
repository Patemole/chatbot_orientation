from typing import Any, Optional, Type, List
from pydantic import BaseModel
from langchain.tools import BaseTool
from langchain_core.documents import Document
from langchain.callbacks.manager import (
    AsyncCallbackManagerForToolRun,
    CallbackManagerForToolRun,
)

from airs.agent.models import CitationDocument
from airs.agent.tools.rag.utils import convert_retrieved_document_to_document_citation
from third_party_api_clients.pinecone.pinecone_api_client import PineconeApiClient
import cohere
import copy
import os

class SearchKnowledgeBaseInput(BaseModel):
    query: str

class SearchKnowledgeBaseTool(BaseTool):
    args_schema: Type[BaseModel] = SearchKnowledgeBaseInput
    course_name: str 
    course_id: str
    session_documents: list

    def _run(
        self, query: str, run_manager: Optional[CallbackManagerForToolRun] = None
    ) -> str:
        """Use the tool asynchronously."""
        raise NotImplementedError("SearchKnowledgeBase does not support sync")


    async def _arun(
        self, query: str, run_manager: Optional[AsyncCallbackManagerForToolRun] = None
    ) -> str:
        """Use the tool."""
        # TODO: Small-to-Big Retrieval

        # Filter based on course id 
        #k is for the number of documents to give back 
        #retrieved_docs : List[Document] = PineconeApiClient().vectorstore.similarity_search(query=query, k = 5, filter={'course_id' : self.course_id})
        retrieved_docs : List[Document] = PineconeApiClient().vectorstore.similarity_search(query=query,  k=5)

        #Logger les documents récupérés pour vérification
        print("Nombre de documents récupérés : %d", len(retrieved_docs))
        for doc in retrieved_docs:
            print("Document : %s", doc)  # ou spécifiez les attributs à afficher, ex. : logging.info("Document content: %s", doc.page_content)


        # Obtain re-ranked documents
        reranked_documents: List[Document] = []

        print("\n")
        print("This is the reranked documents")
        print(reranked_documents)
        print("\n")
        print("\n")

        
        # Only perform re-ranking if retrieved_docs is a non empty list of Document objects
        if (len(retrieved_docs) > 0):
            print("Peforming re-ranking!")
            print("\n")
            print("\n")
            # Re-rank to obtain top-N documents
            N = 3
            # Obtain page_content attributes to re-rank over
            # This is needed given Cohere's inability to process raw Document objects
            retrieved_page_contents = [doc.page_content for doc in retrieved_docs]
            co = cohere.Client("OolPaHUMJwZeI2nGjlE1tKJ4f2GFdFVSUVrDxtkO")
            response = co.rerank(
                model="rerank-english-v3.0",
                query=query,
                documents=retrieved_page_contents,
                top_n=N
            )
            for idx, r in enumerate(response.results):
                print(f"Added Document Rank: {idx + 1}, Original Index: {r.index}")
                print("\n")
                # Deep copy is needed to maintain metadata for citations

                print("this is the retrived document with re-ranking performed")
                print(retrieved_docs[r.index])
                print("\n")
                print("\n")

                reranked_documents.append(retrieved_docs[r.index])

                print("This is now the reranked_documents")
                print(reranked_documents)
                print("\n")
                print("\n")

        else:
            print("Skipped re-ranking... filtering removed all documents test greg !")
            reranked_documents = retrieved_docs
            print("\n")
            print("reranked documents")
            print(reranked_documents)
         
            
            
        print("Session documents before extension")
        print(self.session_documents)
        print("\n")

        self.session_documents.extend(
            list(
                set(
                    map(
                        lambda doc: convert_retrieved_document_to_document_citation(doc),
                        reranked_documents
                    )
                )
            )
        )

        print("Session documents after extension")
        print(self.session_documents)
        print("\n")



        # Construct tool response
        tool_response_body = '\n\n'.join(list(map( lambda doc: doc.page_content, retrieved_docs)))
        tool_response = f'{self.name} Response:\n\n' + tool_response_body
        return tool_response
    


def create_search_knowledge_base_tool(
        course_id: str,
        course_name: str,
        session_documents: List[CitationDocument]
    ):

    '''
    tool_description = f'The {course_name} Search Knowledge Base Tool is able to search through course materials\
        and obtain context relevant to the input query.\
        The provided context is exclusively grounded based on course documents. \
        Use the tool if there is an unknown term or question related to {course_name}.'
    '''

    tool_description = 'The Search Knowledge Base Tool is able to search through course materials\
        and obtain context relevant to the input query.\
        The provided context is exclusively grounded based on course documents. \
        Use the tool if there is an unknown term or question related to.'
    
    print("\n")
    print("Course_id")
    print(course_id)
    print("\n")
    print("Course_name")
    print(course_name)
    print("\n")
    print("\n")
    print("session_documents")
    print(session_documents)
    print("\n")

    return SearchKnowledgeBaseTool(
        course_id=course_id,
        course_name=course_name,
        name = course_name.replace(" ", "") + "-SearchKnowledgeBase",
        description = tool_description,
        session_documents=session_documents
    )