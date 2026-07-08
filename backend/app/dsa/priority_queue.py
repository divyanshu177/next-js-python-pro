import heapq
from datetime import time
from typing import List, Dict, Any, Tuple

class PrioritizedAppointment:
    def __init__(self, appointment_id: str, urgency_level: int, appointment_time: time, data: Dict[str, Any]):
        self.appointment_id = appointment_id
        self.urgency_level = urgency_level  # 3 = Emergency, 2 = Urgent, 1 = Normal
        self.appointment_time = appointment_time
        self.data = data

    def __lt__(self, other: 'PrioritizedAppointment') -> bool:
        # In a min-heap, we want higher urgency (larger number) first, so we invert it (-urgency)
        if self.urgency_level != other.urgency_level:
            return self.urgency_level > other.urgency_level  # True means self has higher priority (greater urgency)
        # If urgency is equal, prioritize by appointment time (earlier time has higher priority)
        return self.appointment_time < other.appointment_time


class AppointmentPriorityQueue:
    def __init__(self):
        self.heap: List[PrioritizedAppointment] = []

    def push(self, appointment_id: str, urgency_level: int, appointment_time: time, data: Dict[str, Any]) -> None:
        """
        Pushes an appointment onto the priority queue.
        """
        item = PrioritizedAppointment(appointment_id, urgency_level, appointment_time, data)
        # Use python heapq, which will call the __lt__ operator on PrioritizedAppointment
        heapq.heappush(self.heap, item)

    def pop(self) -> Dict[str, Any]:
        """
        Pops the highest priority appointment.
        """
        if not self.heap:
            raise IndexError("pop from an empty priority queue")
        item = heapq.heappop(self.heap)
        return item.data

    def is_empty(self) -> bool:
        return len(self.heap) == 0

    def size(self) -> int:
        return len(self.heap)

    def get_sorted_list(self) -> List[Dict[str, Any]]:
        """
        Returns a sorted list of all appointments from highest priority to lowest,
        without clearing the queue permanently.
        """
        # Create a copy and pop everything to maintain correct priority queue sorting order
        temp_heap = list(self.heap)
        sorted_list = []
        while temp_heap:
            item = heapq.heappop(temp_heap)
            sorted_list.append(item.data)
        return sorted_list
