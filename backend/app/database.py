import urllib.parse
from pymongo import MongoClient
from bson import ObjectId
from typing import Any, Dict, List, Optional
from backend.app.config import settings

def get_escaped_mongo_uri(uri: str) -> str:
    """
    Auto-escapes special characters (like '@' or ':') in the password part of the MongoDB URI
    to comply with RFC 3986 as required by PyMongo.
    """
    if not uri.startswith("mongodb://") and not uri.startswith("mongodb+srv://"):
        return uri
    try:
        prefix = "mongodb+srv://" if uri.startswith("mongodb+srv://") else "mongodb://"
        connection_part = uri[len(prefix):]
        if "@" in connection_part:
            credentials, host_part = connection_part.rsplit("@", 1)
            if ":" in credentials:
                user, password = credentials.split(":", 1)
                escaped_user = urllib.parse.quote_plus(user)
                escaped_password = urllib.parse.quote_plus(password)
                return f"{prefix}{escaped_user}:{escaped_password}@{host_part}"
    except Exception:
        pass
    return uri

# Escape URI credentials automatically
escaped_uri = get_escaped_mongo_uri(settings.MONGO_URI)

# Initialize PyMongo client
client = MongoClient(escaped_uri)
db = client[settings.MONGO_DB]

def get_db():
    """
    FastAPI dependency yielding the MongoDB database instance.
    MongoClient handles connection pooling internally.
    """
    yield db

def serialize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Converts MongoDB '_id' ObjectId to a string 'id' for JSON serialization.
    Works recursively if nested documents exist.
    """
    if doc is None:
        return None
        
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        
    # Check for other ObjectIds in the document fields
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            doc[k] = str(v)
        elif isinstance(v, dict):
            doc[k] = serialize_doc(v)
        elif isinstance(v, list):
            doc[k] = [serialize_doc(item) if isinstance(item, dict) else (str(item) if isinstance(item, ObjectId) else item) for item in v]
            
    return doc

def serialize_list(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Converts a cursor/list of MongoDB documents to a JSON-serializable list."""
    return [serialize_doc(doc) for doc in docs if doc]
