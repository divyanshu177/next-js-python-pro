import pytest
from datetime import time
from backend.app.dsa.trie import Trie
from backend.app.dsa.priority_queue import AppointmentPriorityQueue
from backend.app.dsa.interval_scheduling import has_overlap, get_max_non_overlapping_slots
from backend.app.dsa.binary_search import find_next_available_slot
from backend.app.dsa.graph import DoctorGraph

# 1. Test Trie Autocomplete
def test_trie_search():
    trie = Trie()
    trie.insert("Dr. Rajesh Sharma", "doc-1")
    trie.insert("General Physician", "doc-1")
    trie.insert("Dr. Anjali Gupta", "doc-2")
    trie.insert("Cardiologist", "doc-2")

    # Match exact name token
    assert "doc-1" in trie.search_prefix("Rajesh")
    assert "doc-1" in trie.search_prefix("raj")
    
    # Match specialization token
    assert "doc-2" in trie.search_prefix("cardio")
    assert "doc-2" in trie.search_prefix("Cardiologist")

    # Empty match
    assert len(trie.search_prefix("Neurologist")) == 0


# 2. Test Priority Queue
def test_priority_queue():
    pq = AppointmentPriorityQueue()
    
    # Push different urgency levels
    # 1 = Normal, 2 = Urgent, 3 = Emergency
    pq.push("appt-normal-1000", urgency_level=1, appointment_time=time(10, 0), data={"id": 1, "name": "Normal 10:00"})
    pq.push("appt-emergency-1100", urgency_level=3, appointment_time=time(11, 0), data={"id": 2, "name": "Emergency 11:00"})
    pq.push("appt-urgent-0900", urgency_level=2, appointment_time=time(9, 0), data={"id": 3, "name": "Urgent 09:00"})
    pq.push("appt-emergency-1000", urgency_level=3, appointment_time=time(10, 0), data={"id": 4, "name": "Emergency 10:00"})
    
    # Sorting order check:
    # 1. Emergency 10:00 (Level 3, earlier time)
    # 2. Emergency 11:00 (Level 3, later time)
    # 3. Urgent 09:00 (Level 2)
    # 4. Normal 10:00 (Level 1)
    
    sorted_items = pq.get_sorted_list()
    assert len(sorted_items) == 4
    assert sorted_items[0]["id"] == 4
    assert sorted_items[1]["id"] == 2
    assert sorted_items[2]["id"] == 3
    assert sorted_items[3]["id"] == 1


# 3. Test Interval Scheduling
def test_interval_scheduling():
    existing_slots = [
        (time(9, 0), time(9, 30)),
        (time(10, 0), time(10, 30)),
    ]

    # Test overlaps
    assert has_overlap((time(9, 15), time(9, 45)), existing_slots) is True
    assert has_overlap((time(8, 30), time(9, 15)), existing_slots) is True
    assert has_overlap((time(9, 30), time(10, 0)), existing_slots) is False
    assert has_overlap((time(10, 30), time(11, 0)), existing_slots) is False

    # Test get maximum non-overlapping slots
    all_slots = [
        (time(9, 0), time(10, 0)),
        (time(9, 30), time(10, 30)),
        (time(10, 0), time(11, 0)),
        (time(10, 45), time(11, 30)),
    ]
    max_slots = get_max_non_overlapping_slots(all_slots)
    
    # Max should be:
    # (9:00 - 10:00), (10:00 - 11:00), (10:45 - 11:30 is not compatible since it starts before 11:00)
    # Actually:
    # Sort by end times:
    # 1. (9:00 - 10:00) - end = 10:00
    # 2. (9:30 - 10:30) - end = 10:30
    # 3. (10:00 - 11:00) - end = 11:00
    # 4. (10:45 - 11:30) - end = 11:30
    # Steps:
    # Add (9:00 - 10:00) -> end = 10:00
    # Next (9:30 - 10:30) overlaps (start 9:30 < 10:00). Skip.
    # Next (10:00 - 11:00) compatible (start 10:00 >= 10:00). Add -> end = 11:00.
    # Next (10:45 - 11:30) overlaps (start 10:45 < 11:00). Skip.
    # Total selected should be 2: (9:00 - 10:00) and (10:00 - 11:00)
    assert len(max_slots) == 2
    assert max_slots[0] == (time(9, 0), time(10, 0))
    assert max_slots[1] == (time(10, 0), time(11, 0))


# 4. Test Binary Search for Slot
def test_binary_search_slot():
    sorted_slots = [
        {"start_time": time(9, 0), "label": "Slot 1"},
        {"start_time": time(9, 30), "label": "Slot 2"},
        {"start_time": time(10, 0), "label": "Slot 3"},
        {"start_time": time(11, 0), "label": "Slot 4"},
    ]

    # Target: 09:15
    result = find_next_available_slot(sorted_slots, time(9, 15))
    assert result is not None
    assert result["start_time"] == time(9, 30)

    # Target: 10:00
    result = find_next_available_slot(sorted_slots, time(10, 0))
    assert result is not None
    assert result["start_time"] == time(10, 0)

    # Target: 11:30 (none available)
    result = find_next_available_slot(sorted_slots, time(11, 30))
    assert result is None


# 5. Test Graph Recommendations
def test_graph_bfs():
    graph = DoctorGraph()
    doc_1 = {"id": "doc-1", "name": "Dr. A", "specialization": "Cardiologist"}
    doc_2 = {"id": "doc-2", "name": "Dr. B", "specialization": "Cardiologist"}
    doc_3 = {"id": "doc-3", "name": "Dr. C", "specialization": "General Physician"}
    doc_4 = {"id": "doc-4", "name": "Dr. D", "specialization": "Pediatrician"}

    graph.add_doctor("doc-1", doc_1)
    graph.add_doctor("doc-2", doc_2)
    graph.add_doctor("doc-3", doc_3)
    graph.add_doctor("doc-4", doc_4)

    # doc-1 collaborates with doc-3, doc-3 collaborates with doc-2, doc-1 collaborates with doc-4
    graph.add_referral("doc-1", "doc-3")
    graph.add_referral("doc-1", "doc-4")
    graph.add_referral("doc-3", "doc-2")

    # Recommendations from Dr. A (doc-1):
    # Neighbors of doc-1 are doc-3 and doc-4 (depth 1)
    # Neighbor of neighbor is doc-2 (depth 2)
    recs = graph.recommend_related_doctors("doc-1")
    assert len(recs) == 3
    # doc-3 and doc-4 should be before doc-2 due to BFS level traversal
    rec_ids = [r["id"] for r in recs]
    assert rec_ids[0] in ["doc-3", "doc-4"]
    assert rec_ids[1] in ["doc-3", "doc-4"]
    assert rec_ids[2] == "doc-2"

    # Search for specialist (Cardiologist) starting referral network path from Dr. A (doc-1)
    # The only other cardiologist is doc-2
    specs = graph.recommend_specialists_bfs("doc-1", "Cardiologist")
    assert len(specs) == 1
    assert specs[0]["id"] == "doc-2"
