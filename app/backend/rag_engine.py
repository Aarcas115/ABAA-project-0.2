"""
In-memory keyword/TF-IDF retrieval over a small static corpus.

This module provides a simple RAG (Retrieval-Augmented Generation) engine
using TF-IDF scoring for keyword-based document retrieval. It has no
external dependencies beyond the Python standard library.

Task 16 (gap analysis) and Task 18 (classification and confidence)
will call search() to retrieve relevant BA best practices from the corpus.
"""

import re
import math
import logging
from pathlib import Path
from collections import Counter
from typing import Optional

# Module-level logger
logger = logging.getLogger(__name__)

# Constants
CORPUS_DIR = Path(__file__).parent / "knowledge"
CORPUS_FILES = ("ba-sources.txt", "ba-standards.md")

# Built-in stopword set
STOPWORDS = {
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from',
    'has', 'have', 'if', 'in', 'into', 'is', 'it', 'its', 'of', 'on', 'or',
    'that', 'the', 'their', 'then', 'there', 'these', 'they', 'this', 'to',
    'was', 'were', 'will', 'with', 'must', 'can'
}


def tokenize(text: str) -> list[str]:
    """
    Tokenize text by lowercasing and extracting alphanumeric tokens.
    
    Removes stopwords from the result.
    
    Args:
        text: Input text to tokenize
        
    Returns:
        List of lowercase alphanumeric tokens, with stopwords removed
    """
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    return [t for t in tokens if t not in STOPWORDS]


def chunk_file(text: str, source: str) -> list[dict]:
    """
    Split file text into chunks based on heading markers.
    
    Chunks are delimited by lines starting with 1-3 '#' characters
    followed by a space. Lines inside triple-backtick fenced blocks
    are not treated as headings.
    
    Args:
        text: Raw file content
        source: Source file name
        
    Returns:
        List of chunk dictionaries with 'source', 'heading', and 'text' keys
    """
    chunks = []
    lines = text.splitlines()
    
    in_fence = False
    current_heading = None
    current_text_lines = []
    
    for line in lines:
        # Toggle fence state
        if line.strip().startswith('```'):
            in_fence = not in_fence
            continue
        
        # Check for heading (only outside fences)
        if not in_fence and re.match(r'^#{1,3}\s', line):
            # Save previous chunk if exists
            if current_heading is not None:
                chunk_text = '\n'.join(current_text_lines).strip()
                if chunk_text:  # Only add non-empty chunks
                    chunks.append({
                        'source': source,
                        'heading': current_heading,
                        'text': chunk_text
                    })
            
            # Start new chunk
            current_heading = line.lstrip('#').strip()
            current_text_lines = []
        else:
            # Add to current chunk's text
            if current_heading is not None:
                current_text_lines.append(line)
    
    # Don't forget the last chunk
    if current_heading is not None:
        chunk_text = '\n'.join(current_text_lines).strip()
        if chunk_text:  # Only add non-empty chunks
            chunks.append({
                'source': source,
                'heading': current_heading,
                'text': chunk_text
            })
    
    return chunks


class RagEngine:
    """
    RAG engine using TF-IDF for keyword-based document retrieval.
    
    Loads documents from specified file paths and builds an in-memory
    TF-IDF index for efficient keyword search.
    """
    
    def __init__(self, file_paths: list[Path]) -> None:
        """
        Initialize the RAG engine with the given file paths.
        
        Args:
            file_paths: List of Path objects pointing to corpus files
        """
        self.chunks: list[dict] = []
        
        # Load and chunk all files
        for path in file_paths:
            try:
                text = path.read_text(encoding='utf-8')
                file_chunks = chunk_file(text, path.name)
                self.chunks.extend(file_chunks)
            except (OSError, UnicodeDecodeError) as e:
                logger.warning(f"Could not load corpus file {path}: {e}")
                continue
        
        self.chunk_count = len(self.chunks)
        
        # Build TF-IDF index
        self._build_index()
    
    def _build_index(self) -> None:
        """Build the TF-IDF index from loaded chunks."""
        N = self.chunk_count
        
        if N == 0:
            self._df: dict[str, int] = {}
            self._idf: dict[str, float] = {}
            self._chunk_tokens: list[set] = []
            self._chunk_tf: list[Counter] = []
            self._chunk_token_counts: list[int] = []
            return
        
        # Tokenize each chunk
        self._chunk_tokens = []
        self._chunk_tf = []
        self._chunk_token_counts = []
        
        for chunk in self.chunks:
            combined = chunk['heading'] + ' ' + chunk['text']
            tokens = tokenize(combined)
            token_set = set(tokens)
            self._chunk_tokens.append(token_set)
            self._chunk_tf.append(Counter(tokens))
            self._chunk_token_counts.append(len(tokens))
        
        # Compute document frequencies
        self._df = {}
        for token_set in self._chunk_tokens:
            for term in token_set:
                self._df[term] = self._df.get(term, 0) + 1
        
        # Compute IDF values
        self._idf = {}
        for term, df in self._df.items():
            self._idf[term] = math.log((N + 1) / (df + 1)) + 1
    
    def search(self, query: str, top_k: int = 3, source: Optional[str] = None) -> list[dict]:
        """
        Search for relevant chunks using TF-IDF scoring.
        
        Args:
            query: Search query string
            top_k: Maximum number of results to return
            source: Optional source file name to filter by
            
        Returns:
            List of result dictionaries with 'source', 'heading', 'text', and 'score' keys
        """
        # Tokenize query
        query_tokens = tokenize(query)
        
        # Return empty list for empty queries
        if not query_tokens:
            return []
        
        query_token_set = set(query_tokens)
        
        # Filter chunks by source if specified
        candidate_chunks = []
        for i, chunk in enumerate(self.chunks):
            if source is None or chunk['source'] == source:
                candidate_chunks.append(i)
        
        # Score each chunk
        results = []
        for i in candidate_chunks:
            chunk = self.chunks[i]
            chunk_token_set = self._chunk_tokens[i]
            
            # Find query tokens present in this chunk
            present_tokens = query_token_set & chunk_token_set
            
            if not present_tokens:
                continue
            
            # Compute score
            score_sum = 0.0
            for term in present_tokens:
                tf = self._chunk_tf[i][term]
                if tf > 0:
                    score_sum += (1 + math.log(tf)) * self._idf.get(term, 0)
            
            # Normalize by sqrt of total token count
            total_tokens = self._chunk_token_counts[i]
            if total_tokens > 0:
                score = score_sum / math.sqrt(total_tokens)
            else:
                score = 0.0
            
            # Exclude zero-score chunks
            if score > 0:
                results.append({
                    'source': chunk['source'],
                    'heading': chunk['heading'],
                    'text': chunk['text'],
                    'score': round(score, 4)
                })
        
        # Sort by score descending (stable sort preserves corpus order for ties)
        results.sort(key=lambda x: x['score'], reverse=True)
        
        # Return top_k results
        return results[:top_k]


# Module-level singleton
_engine: Optional[RagEngine] = None


def get_engine() -> RagEngine:
    """
    Get the RAG engine singleton, building it on first call.
    
    Returns:
        The RagEngine instance
    """
    global _engine
    
    if _engine is None:
        file_paths = [CORPUS_DIR / name for name in CORPUS_FILES]
        _engine = RagEngine(file_paths)
    
    return _engine
