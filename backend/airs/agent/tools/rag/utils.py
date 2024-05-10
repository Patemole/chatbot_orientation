from airs.agent.models import CitationDocument

def convert_retrieved_document_to_document_citation(doc):
    metadata = doc.metadata
    return CitationDocument(
        document_id="",
        document_name=metadata['resource_name'], 
        source_type="course_resource",
        link=metadata['resource_link'],
    )