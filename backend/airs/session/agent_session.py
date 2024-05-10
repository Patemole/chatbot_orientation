from airs.session.session_config import SESSION_TTL
from airs.agent.rag_agent import RAGAgent
from datetime import datetime, timedelta
from typing import List

from airs.agent.models import CitationDocument

class AgentSession:
     def __init__(self, id: str, user_name: str, course_name: str, agent: RAGAgent):
        self.id = id
        self.TTL = SESSION_TTL
        self.expiration = datetime.now() + timedelta(seconds=self.TTL)
        self.user_name = user_name
        self.course_name = course_name
        self.agent = agent
        self.session_documents: List[CitationDocument] = []