from langchain_openai import OpenAIEmbeddings
import os
from openai import OpenAI

class OpenAIApiClient:
    """
    A singleton class representing OpenAI third-party API client.

    This class is designed to provide a single instance of the OpenAI's API client
    to avoid unnecessary reinitialization.

    Example:
        Usage of the OpenAIApiClient:

        ```python
        api_client = OpenAIApiClient()
        ```
    """
    _instance = None
 
    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(OpenAIApiClient, cls).__new__(cls)
            cls.text_embeddings = OpenAIEmbeddings(
                #openai_api_key="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",
                openai_api_key ="sk-proj-caW5AbDBLBwwTmIF81v3T3BlbkFJoyA1d3tBYjoR55QBlEhh",
                model="text-embedding-ada-002"
            )
            cls.open_ai_client = OpenAI(api_key="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")
            

        return cls._instance