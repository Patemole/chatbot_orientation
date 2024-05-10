from datetime import datetime
from pydantic import BaseModel
from typing import Optional

# BASE MODELS TO STREAM TO CLIENT

class AnswerPiece(BaseModel):
    # A small piece of a complete answer. Used for streaming back answers.
    answer_piece: str

class StreamingError(BaseModel):
    error: str

'''

class CitationDocument(BaseModel):
    """This contains the minimal set information for the LLM portion including citations"""
    document_id: str
    document_name: str
    # content: str
    # blurb: str
    # semantic_identifier: str
    source_type: str
    # metadata: dict[str, str | list[str]]
    # updated_at: datetime | None
    link: str | None

    def __eq__(self, other):
        if not isinstance(other, CitationDocument):
            return False
        return (self.document_id == other.document_id and
                self.document_name == other.document_name and
                self.source_type == other.source_type and
                self.link == other.link)

    def __hash__(self):
        return hash((self.document_id, self.document_name, self.source_type, self.link))
''' 

class CitationDocument(BaseModel):
    """This contains the minimal set information for the LLM portion including citations"""
    document_id: str
    document_name: str
    source_type: str
    link: Optional[str] = None

    def __eq__(self, other):
        if not isinstance(other, CitationDocument):
            return False
        return (self.document_id == other.document_id and
                self.document_name == other.document_name and
                self.source_type == other.source_type and
                self.link == other.link)

    def __hash__(self):
        return hash((self.document_id, self.document_name, self.source_type, self.link))

    def model_dump(self):
        """Returns a dictionary representation of the document, suitable for serialization."""
        return {
            "document_id": self.document_id,
            "document_name": self.document_name,
            "source_type": self.source_type,
            "link": self.link
        }