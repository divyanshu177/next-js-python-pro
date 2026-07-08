from typing import List, Set, Dict, Any

class TrieNode:
    def __init__(self):
        self.children: Dict[str, 'TrieNode'] = {}
        self.is_end_of_word: bool = False
        self.doctor_ids: Set[str] = set()  # Doctor IDs matching this prefix for instant lookup

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str, doctor_id: str) -> None:
        """
        Inserts a word into the Trie and associates it with a doctor ID.
        Converts the word to lowercase to ensure case-insensitivity.
        """
        if not word:
            return
        
        # Insert each token/word separately as well as the full string
        tokens = word.lower().split()
        for token in tokens:
            self._insert_token(token, doctor_id)
        # Also insert the full normalized string
        normalized_full = "".join(c for c in word.lower() if c.isalnum() or c.isspace()).strip()
        if normalized_full:
            self._insert_token(normalized_full, doctor_id)

    def _insert_token(self, token: str, doctor_id: str) -> None:
        current = self.root
        for char in token:
            if char not in current.children:
                current.children[char] = TrieNode()
            current = current.children[char]
            current.doctor_ids.add(doctor_id)  # Add doctor ID at this prefix node for O(L) autocomplete
        current.is_end_of_word = True

    def search_prefix(self, prefix: str) -> Set[str]:
        """
        Returns a set of doctor IDs that match the prefix.
        """
        if not prefix:
            return set()
        
        prefix = prefix.lower().strip()
        current = self.root
        for char in prefix:
            if char not in current.children:
                return set()
            current = current.children[char]
        
        return current.doctor_ids
