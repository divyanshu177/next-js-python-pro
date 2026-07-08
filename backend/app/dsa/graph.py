from collections import deque
from typing import Dict, List, Set, Tuple, Any

class DoctorGraph:
    def __init__(self):
        # Adjacency list: doctor_id -> list of tuples (neighbor_doctor_id, weight/strength of relationship)
        self.adj_list: Dict[str, List[Tuple[str, float]]] = {}
        # Doctor metadata lookup: doctor_id -> doctor details (name, specialization, hospital, rating)
        self.nodes_data: Dict[str, Dict[str, Any]] = {}

    def add_doctor(self, doctor_id: str, data: Dict[str, Any]) -> None:
        """Adds a doctor node with metadata to the graph."""
        self.nodes_data[doctor_id] = data
        if doctor_id not in self.adj_list:
            self.adj_list[doctor_id] = []

    def add_referral(self, from_doc: str, to_doc: str, weight: float = 1.0) -> None:
        """Adds a referral/collaboration edge between two doctors (directed/undirected)."""
        if from_doc not in self.adj_list:
            self.adj_list[from_doc] = []
        if to_doc not in self.adj_list:
            self.adj_list[to_doc] = []
        
        # Avoid duplicate edges
        if not any(neighbor == to_doc for neighbor, _ in self.adj_list[from_doc]):
            self.adj_list[from_doc].append((to_doc, weight))
        if not any(neighbor == from_doc for neighbor, _ in self.adj_list[to_doc]):
            self.adj_list[to_doc].append((from_doc, weight))

    def recommend_related_doctors(self, doctor_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Uses BFS to traverse the referral network starting from a doctor_id,
        finding connected doctors who work at the same hospital or share referrals,
        excluding the starting doctor.
        """
        if doctor_id not in self.adj_list:
            return []

        visited: Set[str] = {doctor_id}
        queue = deque([(doctor_id, 0)])  # (doctor_id, depth)
        recommendations = []

        while queue and len(recommendations) < limit:
            current_id, depth = queue.popleft()

            # Process neighbors
            for neighbor_id, _ in self.adj_list.get(current_id, []):
                if neighbor_id not in visited:
                    visited.add(neighbor_id)
                    queue.append((neighbor_id, depth + 1))
                    
                    # Gather neighbor's details
                    if neighbor_id in self.nodes_data:
                        recommendations.append(self.nodes_data[neighbor_id])
                        if len(recommendations) >= limit:
                            break

        return recommendations

    def recommend_specialists_bfs(self, doctor_id: str, specialty: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Uses BFS to traverse the network starting from doctor_id to locate doctors
        who specialize in 'specialty'. This represents a referral chain.
        """
        if doctor_id not in self.adj_list:
            return []

        visited: Set[str] = {doctor_id}
        queue = deque([doctor_id])
        results = []

        while queue and len(results) < limit:
            current_id = queue.popleft()

            for neighbor_id, _ in self.adj_list.get(current_id, []):
                if neighbor_id not in visited:
                    visited.add(neighbor_id)
                    queue.append(neighbor_id)

                    if neighbor_id in self.nodes_data:
                        neighbor_data = self.nodes_data[neighbor_id]
                        if neighbor_data.get("specialization", "").lower() == specialty.lower():
                            results.append(neighbor_data)
                            if len(results) >= limit:
                                break

        return results
