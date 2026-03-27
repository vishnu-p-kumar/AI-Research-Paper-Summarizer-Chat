from __future__ import annotations

import json
import os
import threading
import uuid
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional

import faiss
from sentence_transformers import SentenceTransformer

from app.config import CHUNK_OVERLAP, CHUNK_SIZE, STORAGE_DIR


def _chunk_text(text: str, chunk_size: int, chunk_overlap: int) -> List[str]:
    if not text:
        return []
    chunk_size = max(200, int(chunk_size))
    chunk_overlap = max(0, min(int(chunk_overlap), chunk_size - 1))

    chunks: List[str] = []
    start = 0
    n = len(text)
    while start < n:
        end = min(n, start + chunk_size)
        chunks.append(text[start:end].strip())
        if end == n:
            break
        start = max(0, end - chunk_overlap)
    return [c for c in chunks if c]


@dataclass
class RagIndex:
    doc_id: str
    text: str
    chunks: List[str]
    index: faiss.Index


class RagStore:
    """
    Lightweight persistence to disk so doc_id remains valid across backend restarts.
    Stores:
    - {doc_id}.json (text + chunks)
    - {doc_id}.faiss (FAISS index)
    """

    def __init__(self, embedding_model_name: str = "all-MiniLM-L6-v2"):
        self._lock = threading.RLock()
        self._embedding_model_name = embedding_model_name
        self._embedder: Optional[SentenceTransformer] = None
        self._indices: Dict[str, RagIndex] = {}
        os.makedirs(STORAGE_DIR, exist_ok=True)

    def _get_embedder(self) -> SentenceTransformer:
        # Lazy-load to keep API server startup fast; first indexing/query will download weights.
        if self._embedder is None:
            self._embedder = SentenceTransformer(self._embedding_model_name)
        return self._embedder

    def _paths(self, doc_id: str) -> Tuple[str, str]:
        meta_path = os.path.join(STORAGE_DIR, f"{doc_id}.json")
        index_path = os.path.join(STORAGE_DIR, f"{doc_id}.faiss")
        return meta_path, index_path

    def _save(self, rag: RagIndex) -> None:
        meta_path, index_path = self._paths(rag.doc_id)
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump({"doc_id": rag.doc_id, "text": rag.text, "chunks": rag.chunks}, f)
        faiss.write_index(rag.index, index_path)

    def _load(self, doc_id: str) -> RagIndex:
        meta_path, index_path = self._paths(doc_id)
        if not (os.path.exists(meta_path) and os.path.exists(index_path)):
            raise KeyError("Unknown doc_id")
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
        index = faiss.read_index(index_path)
        rag = RagIndex(
            doc_id=doc_id,
            text=meta.get("text", ""),
            chunks=meta.get("chunks", []) or [],
            index=index,
        )
        return rag

    def _get_rag(self, doc_id: str) -> RagIndex:
        with self._lock:
            rag = self._indices.get(doc_id)
            if rag is not None:
                return rag
        # Not in memory; try loading from disk.
        rag = self._load(doc_id)
        with self._lock:
            self._indices[doc_id] = rag
        return rag

    def create_doc(self, text: str) -> str:
        doc_id = str(uuid.uuid4())
        chunks = _chunk_text(text, CHUNK_SIZE, CHUNK_OVERLAP)
        if not chunks:
            raise ValueError("No text content found to index.")

        embedder = self._get_embedder()
        vecs = embedder.encode(chunks, convert_to_numpy=True, normalize_embeddings=True)
        dim = int(vecs.shape[1])
        index = faiss.IndexFlatIP(dim)
        index.add(vecs)

        rag = RagIndex(doc_id=doc_id, text=text, chunks=chunks, index=index)
        with self._lock:
            self._indices[doc_id] = rag
        self._save(rag)
        return doc_id

    def get_text(self, doc_id: str) -> str:
        rag = self._get_rag(doc_id)
        return rag.text

    def retrieve(self, doc_id: str, query: str, k: int = 5) -> List[Tuple[int, float, str]]:
        rag = self._get_rag(doc_id)

        embedder = self._get_embedder()
        q = embedder.encode([query], convert_to_numpy=True, normalize_embeddings=True)
        k = max(1, min(int(k), len(rag.chunks)))
        scores, idxs = rag.index.search(q, k)
        results: List[Tuple[int, float, str]] = []
        for i, score in zip(idxs[0].tolist(), scores[0].tolist()):
            if i < 0:
                continue
            results.append((int(i), float(score), rag.chunks[i]))

        # If scores are IP over normalized embeddings, they are cosine similarity in [-1, 1].
        return results


rag_store = RagStore()

