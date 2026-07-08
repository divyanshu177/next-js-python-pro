from datetime import time, datetime
from typing import List, Tuple

def has_overlap(proposed: Tuple[time, time], existing: List[Tuple[time, time]]) -> bool:
    """
    Checks if a proposed time slot [start, end] overlaps with any existing time slots.
    An overlap exists if: Proposed Start < Existing End AND Existing Start < Proposed End.
    """
    p_start, p_end = proposed
    if p_start >= p_end:
        raise ValueError("Start time must be before end time")

    for e_start, e_end in existing:
        if e_start >= e_end:
            continue
        # Overlap condition:
        if p_start < e_end and e_start < p_end:
            return True
    return False

def get_max_non_overlapping_slots(slots: List[Tuple[time, time]]) -> List[Tuple[time, time]]:
    """
    Applies the classic Greedy Interval Scheduling algorithm to find the maximum
    number of mutually compatible slots.
    Algorithm:
    1. Sort the slots by their end times.
    2. Iterate through sorted slots, selecting a slot if its start time is >= end time of last selected.
    """
    if not slots:
        return []

    # Sort slots based on end time (the greedy choice)
    sorted_slots = sorted(slots, key=lambda x: x[1])
    
    selected_slots = [sorted_slots[0]]
    last_end = sorted_slots[0][1]

    for i in range(1, len(sorted_slots)):
        current_start, current_end = sorted_slots[i]
        if current_start >= last_end:
            selected_slots.append(sorted_slots[i])
            last_end = current_end

    return selected_slots
