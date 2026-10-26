import os
import json
import math
from typing import List, Dict, Any, Optional
from backend.app.core.config import settings
from backend.app.services.embeddings.service import embedding_service

class AcademicVectorStore:
    """Vector database manager with ChromaDB support and isolated user metadata filtering."""

    def __init__(self):
        self.chroma_client = None
        self.collection = None
        self._fallback_store: Dict[str, List[Dict[str, Any]]] = {} # user_id -> chunks
        self._fallback_path = os.path.join(settings.CHROMADB_DIR, "local_vectors.json")
        self._init_store()

    def _init_store(self):
        try:
            import chromadb
            from chromadb.config import Settings as ChromaSettings
            os.makedirs(settings.CHROMADB_DIR, exist_ok=True)
            self.chroma_client = chromadb.PersistentClient(path=settings.CHROMADB_DIR)
            self.collection = self.chroma_client.get_or_create_collection("research_paper_chunks")
            print("ChromaDB vector store initialized successfully.")
        except Exception as e:
            print(f"ChromaDB persistent client notice ({e}), using local isolated vector index.")
            self.chroma_client = None
            self._load_fallback()

    def _load_fallback(self):
        if os.path.exists(self._fallback_path):
            try:
                with open(self._fallback_path, "r", encoding="utf-8") as f:
                    self._fallback_store = json.load(f)
            except Exception:
                self._fallback_store = {}

    def _save_fallback(self):
        try:
            with open(self._fallback_path, "w", encoding="utf-8") as f:
                json.dump(self._fallback_store, f)
        except Exception as e:
            print(f"Error saving vector store: {e}")

    def add_chunks(self, user_id: str, paper_id: str, paper_title: str, chunks: List[Dict[str, Any]], project_id: Optional[str] = None):
        """Index chunks with strict user_id and paper_id metadata."""
        if not chunks:
            return

        texts = [c["content"] for c in chunks]
        embeddings = embedding_service.get_embeddings(texts)
        ids = [f"{paper_id}_{c['chunk_index']}" for c in chunks]
        metadatas = [{
            "user_id": user_id,
            "paper_id": paper_id,
            "paper_title": paper_title,
            "project_id": project_id or "",
            "page_number": c["page_number"],
            "chunk_index": c["chunk_index"]
        } for c in chunks]

        if self.collection is not None:
            try:
                self.collection.upsert(
                    ids=ids,
                    embeddings=embeddings,
                    documents=texts,
                    metadatas=metadatas
                )
                return
            except Exception as e:
                print(f"ChromaDB upsert error: {e}, falling back to local index.")

        # Fallback local index
        if user_id not in self._fallback_store:
            self._fallback_store[user_id] = []

        # Remove existing chunks for this paper if re-indexing
        self._fallback_store[user_id] = [
            item for item in self._fallback_store[user_id] if item["paper_id"] != paper_id
        ]

        for i, c in enumerate(chunks):
            self._fallback_store[user_id].append({
                "id": ids[i],
                "paper_id": paper_id,
                "paper_title": paper_title,
                "project_id": project_id or "",
                "page_number": c["page_number"],
                "chunk_index": c["chunk_index"],
                "content": c["content"],
                "embedding": embeddings[i]
            })
        self._save_fallback()

    def search(
        self,
        user_id: str,
        query: str,
        paper_id: Optional[str] = None,
        selected_paper_ids: Optional[List[str]] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant grounded chunks with page numbers and metadata."""
        query_embedding = embedding_service.get_embedding(query)

        # ChromaDB search if available
        if self.collection is not None:
            try:
                where_filter: Dict[str, Any] = {"user_id": user_id}
                if paper_id:
                    where_filter = {"$and": [{"user_id": user_id}, {"paper_id": paper_id}]}
                elif selected_paper_ids and len(selected_paper_ids) > 0:
                    if len(selected_paper_ids) == 1:
                        where_filter = {"$and": [{"user_id": user_id}, {"paper_id": selected_paper_ids[0]}]}
                    else:
                        where_filter = {"$and": [{"user_id": user_id}, {"paper_id": {"$in": selected_paper_ids}}]}

                results = self.collection.query(
                    query_embeddings=[query_embedding],
                    n_results=top_k,
                    where=where_filter
                )

                retrieved = []
                if results and "documents" in results and results["documents"] and results["documents"][0]:
                    docs = results["documents"][0]
                    metas = results["metadatas"][0]
                    dists = results["distances"][0] if "distances" in results else [0.0]*len(docs)

                    for i, doc in enumerate(docs):
                        meta = metas[i]
                        retrieved.append({
                            "content": doc,
                            "paper_id": meta.get("paper_id"),
                            "paper_title": meta.get("paper_title", "Document"),
                            "page_number": meta.get("page_number", 1),
                            "chunk_index": meta.get("chunk_index", 0),
                            "score": 1.0 - (dists[i] if dists[i] is not None else 0.5)
                        })
                if retrieved:
                    return retrieved
            except Exception as e:
                print(f"ChromaDB search error: {e}. Falling back to local vector search.")

        # Local vector index search
        user_chunks = self._fallback_store.get(user_id, [])
        if not user_chunks:
            return []

        # Filter by paper_id or selected_paper_ids
        filtered = user_chunks
        if paper_id:
            filtered = [c for c in filtered if c["paper_id"] == paper_id]
        elif selected_paper_ids:
            filtered = [c for c in filtered if c["paper_id"] in selected_paper_ids]

        if not filtered:
            return []

        # Compute cosine similarity
        scored = []
        for c in filtered:
            emb = c["embedding"]
            # Cosine similarity
            dot = sum(a * b for a, b in zip(query_embedding, emb))
            norm1 = math.sqrt(sum(a * a for a in query_embedding))
            norm2 = math.sqrt(sum(b * b for b in emb))
            sim = dot / (norm1 * norm2) if norm1 > 0 and norm2 > 0 else 0.0
            scored.append((sim, c))

        scored.sort(key=lambda x: x[0], reverse=True)
        top_items = scored[:top_k]

        return [{
            "content": item[1]["content"],
            "paper_id": item[1]["paper_id"],
            "paper_title": item[1]["paper_title"],
            "page_number": item[1]["page_number"],
            "chunk_index": item[1]["chunk_index"],
            "score": round(item[0], 4)
        } for item in top_items]

    def delete_paper(self, user_id: str, paper_id: str):
        """Remove paper vectors from index."""
        if self.collection is not None:
            try:
                self.collection.delete(where={"$and": [{"user_id": user_id}, {"paper_id": paper_id}]})
            except Exception:
                pass
        if user_id in self._fallback_store:
            self._fallback_store[user_id] = [c for c in self._fallback_store[user_id] if c["paper_id"] != paper_id]
            self._save_fallback()

vector_store = AcademicVectorStore()
