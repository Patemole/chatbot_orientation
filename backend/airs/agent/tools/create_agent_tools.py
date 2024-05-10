
#from airs.agent.tools.rag.knowledge_base_tool import create_search_knowledge_base_tool
#for chat orientation tool
from airs.agent.tools.rag.knowledge_base_tool import create_search_knowledge_base_tool


def create_agent_tools(
        user_id: str,
        course_id: str,
        course_name: str,
        session_documents
):
    return [
        create_search_knowledge_base_tool(course_id, course_name, session_documents)
    ]