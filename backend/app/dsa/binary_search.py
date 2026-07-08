from datetime import time, datetime
from typing import List, Dict, Any, Optional

def find_next_available_slot(sorted_slots: List[Dict[str, Any]], target_time: time) -> Optional[Dict[str, Any]]:
    """
    Finds the first available slot that starts at or after target_time.
    Uses binary search on a sorted list of slots.
    Expects sorted_slots to be sorted by start_time.
    """
    if not sorted_slots:
        return None

    low = 0
    high = len(sorted_slots) - 1
    result_idx = -1

    while low <= high:
        mid = (low + high) // 2
        mid_slot_time = sorted_slots[mid]["start_time"]
        
        # Check if mid_slot_time is a string or a time object; handle both
        if isinstance(mid_slot_time, str):
            # Parse time string "HH:MM:SS" or "HH:MM"
            parts = list(map(int, mid_slot_time.split(":")))
            mid_time = time(parts[0], parts[1])
        else:
            mid_time = mid_slot_time

        if mid_time >= target_time:
            result_idx = mid
            high = mid - 1  # Look for an even earlier slot that still matches
        else:
            low = mid + 1

    if result_idx != -1:
        return sorted_slots[result_idx]
    return None
