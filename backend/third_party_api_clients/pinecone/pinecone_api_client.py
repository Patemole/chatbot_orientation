import os
import sys
import logging
from dotenv import load_dotenv

from langchain_openai import OpenAIEmbeddings
from openai import OpenAI

# Assurez-vous que le chemin vers votre fichier .env est correct
# Si votre fichier .env est au même niveau que le dossier backend, vous devrez peut-être ajuster le chemin
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)

# Ajouter le dossier parent à sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from third_party_api_clients.openai.openai_api_client import OpenAIApiClient
#from third_party_api_clients.pinecone.config import PINECONE_POOL_THREADS
import langchain_pinecone

from pinecone import Pinecone, Index



logging.basicConfig(level=logging.INFO)

class PineconeApiClient:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            logging.info("Creating new instance of PineconeApiClient...")
            cls._instance = super(PineconeApiClient, cls).__new__(cls)
        try:
            if not hasattr(cls._instance, 'vectorstore'):
                pinecone = Pinecone(api_key="5a6353bd-2e4a-436a-b6f4-8a18187884e1")
                cls._instance.index = pinecone.Index("orientation-chat-lucy", pool_threads=4)
                text_embeddings = OpenAIApiClient().text_embeddings
                cls._instance.vectorstore = langchain_pinecone.Pinecone(cls._instance.index, text_embeddings, "text")
                logging.info("PineconeApiClient was successfully initialized.")
        except Exception as e:
            logging.error(f"Error initializing PineconeApiClient: {e}")
            raise e
        return cls._instance







