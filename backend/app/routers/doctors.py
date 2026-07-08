from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from bson import ObjectId
from backend.app.database import get_db, serialize_doc
from backend.app import schemas
from backend.app.dsa.trie import Trie
from backend.app.dsa.graph import DoctorGraph

router = APIRouter(prefix="/doctors", tags=["doctors"])

# Singletons for memory structures
search_trie = Trie()
referral_graph = DoctorGraph()
structures_initialized = False

def init_dsa_structures(db: Any):
    """
    Populates Trie and Graph structures with MongoDB contents for
    efficient searches and network recommendations.
    """
    global search_trie, referral_graph, structures_initialized
    if structures_initialized:
        return
        
    doctors = list(db.doctor_profiles.find({}))
    
    # Reset structures
    search_trie = Trie()
    referral_graph = DoctorGraph()
    
    for doc in doctors:
        doc_id = str(doc["_id"])
        
        # Resolve doctor user details
        user = db.users.find_one({"_id": ObjectId(doc["user_id"])})
        if not user:
            continue
            
        doc_info = {
            "id": doc_id,
            "name": user["name"],
            "specialization": doc["specialization"],
            "hospital_name": doc["hospital_name"],
            "rating": doc.get("rating", 4.5),
            "experience_years": doc.get("experience_years", 1),
            "consultation_fee": doc.get("consultation_fee", 500.0),
            "available_slots": doc.get("available_slots", [])
        }
        
        # Populate Trie
        search_trie.insert(user["name"], doc_id)
        search_trie.insert(doc["specialization"], doc_id)
        
        # Populate Graph Node
        referral_graph.add_doctor(doc_id, doc_info)
        
    # Build referral edges based on hospital sharing
    for i in range(len(doctors)):
        for j in range(i + 1, len(doctors)):
            doc_a = doctors[i]
            doc_b = doctors[j]
            doc_a_id = str(doc_a["_id"])
            doc_b_id = str(doc_b["_id"])
            
            if doc_a["hospital_name"] == doc_b["hospital_name"]:
                # High-weight link: same hospital
                referral_graph.add_referral(doc_a_id, doc_b_id, weight=2.0)
            elif doc_a["specialization"] != doc_b["specialization"]:
                # Lower-weight cross-referral link: different specialty
                referral_graph.add_referral(doc_a_id, doc_b_id, weight=1.0)
                
    structures_initialized = True


@router.post("/reindex", status_code=status.HTTP_200_OK)
def trigger_reindex(db: Any = Depends(get_db)):
    """Force reindexing of Trie and Graph structures from MongoDB."""
    global structures_initialized
    structures_initialized = False
    init_dsa_structures(db)
    return {"status": "success", "message": "DSA structures successfully reindexed."}


@router.get("", response_model=List[Dict[str, Any]])
def get_doctors(
    specialization: Optional[str] = None,
    min_rating: Optional[float] = None,
    min_experience: Optional[int] = None,
    hospital: Optional[str] = None,
    query: Optional[str] = None,
    db: Any = Depends(get_db)
):
    """
    Search and filter doctors from MongoDB.
    """
    init_dsa_structures(db)
    
    filter_query = {}
    
    # Trie search filter
    if query:
        matched_ids = search_trie.search_prefix(query)
        if not matched_ids:
            return []
        
        matched_obj_ids = []
        for m_id in matched_ids:
            try:
                matched_obj_ids.append(ObjectId(m_id))
            except Exception:
                pass
        filter_query["_id"] = {"$in": matched_obj_ids}
        
    if specialization:
        filter_query["specialization"] = {"$regex": specialization, "$options": "i"}
    if min_rating:
        filter_query["rating"] = {"$gte": min_rating}
    if min_experience:
        filter_query["experience_years"] = {"$gte": min_experience}
    if hospital:
        filter_query["hospital_name"] = {"$regex": hospital, "$options": "i"}
        
    results = list(db.doctor_profiles.find(filter_query))
    
    # Format response by mapping names/emails from users collection
    doctors_list = []
    for doc in results:
        user = db.users.find_one({"_id": ObjectId(doc["user_id"])})
        if not user:
            continue
            
        doc_serialized = serialize_doc(doc)
        doc_serialized["name"] = user["name"]
        doc_serialized["email"] = user["email"]
        doctors_list.append(doc_serialized)
        
    return doctors_list


@router.get("/autocomplete", response_model=List[Dict[str, Any]])
def autocomplete_doctors(q: str, db: Any = Depends(get_db)):
    """
    Autocomplete prefix search using the Trie.
    """
    init_dsa_structures(db)
    matched_ids = search_trie.search_prefix(q)
    if not matched_ids:
        return []
        
    matched_obj_ids = []
    for m_id in matched_ids:
        try:
            matched_obj_ids.append(ObjectId(m_id))
        except Exception:
            pass
            
    docs = list(db.doctor_profiles.find({"_id": {"$in": matched_obj_ids}}).limit(5))
    
    suggestions = []
    for doc in docs:
        user = db.users.find_one({"_id": ObjectId(doc["user_id"])})
        if not user:
            continue
            
        suggestions.append({
            "id": str(doc["_id"]),
            "name": user["name"],
            "specialization": doc["specialization"],
            "hospital": doc["hospital_name"]
        })
    return suggestions


@router.get("/{id}", response_model=Dict[str, Any])
def get_doctor_by_id(id: str, db: Any = Depends(get_db)):
    """Returns details of a specific doctor from MongoDB."""
    try:
        doc = db.doctor_profiles.find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid doctor ID format")
        
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    user = db.users.find_one({"_id": ObjectId(doc["user_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="Doctor user record not found")
        
    doc_serialized = serialize_doc(doc)
    doc_serialized["name"] = user["name"]
    doc_serialized["email"] = user["email"]
    return doc_serialized


@router.get("/{id}/recommendations", response_model=List[Dict[str, Any]])
def get_doctor_recommendations(id: str, db: Any = Depends(get_db)):
    """
    Recommends related doctors using Graph BFS network traversal.
    """
    init_dsa_structures(db)
    recommendations = referral_graph.recommend_related_doctors(id, limit=5)
    return recommendations
export_trie_and_graph = {"init": init_dsa_structures}
