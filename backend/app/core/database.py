import os
import json
import asyncio
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
from backend.app.core.config import settings

class LocalCollection:
    """Lightweight async document collection with MongoDB-like API for standalone execution."""
    def __init__(self, name: str, filepath: str):
        self.name = name
        self.filepath = filepath
        self._lock = asyncio.Lock()
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._loaded = False

    async def _ensure_loaded(self):
        if not self._loaded:
            async with self._lock:
                if not self._loaded:
                    if os.path.exists(self.filepath):
                        try:
                            with open(self.filepath, "r", encoding="utf-8") as f:
                                data = json.load(f)
                                self._cache = {doc["_id"]: doc for doc in data if "_id" in doc}
                        except Exception:
                            self._cache = {}
                    else:
                        self._cache = {}
                    self._loaded = True

    async def _persist(self):
        try:
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(list(self._cache.values()), f, default=str, indent=2)
        except Exception as e:
            print(f"Error persisting collection {self.name}: {e}")

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        if not query:
            return True
        for k, v in query.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._matches(doc, cond) for cond in v):
                    return False
                continue
            if k == "$and" and isinstance(v, list):
                if not all(self._matches(doc, cond) for cond in v):
                    return False
                continue

            doc_val = doc.get(k)
            if isinstance(v, dict):
                # Operators like $in, $ne, $regex, etc.
                if "$in" in v and doc_val not in v["$in"]:
                    return False
                if "$ne" in v and doc_val == v["$ne"]:
                    return False
                if "$regex" in v:
                    import re
                    pattern = v["$regex"]
                    ignore_case = v.get("$options", "") == "i"
                    if not re.search(pattern, str(doc_val or ""), re.IGNORECASE if ignore_case else 0):
                        return False
            else:
                if doc_val != v:
                    return False
        return True

    async def find_one(self, query: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        await self._ensure_loaded()
        query = query or {}
        for doc in self._cache.values():
            if self._matches(doc, query):
                return doc.copy()
        return None

    class Cursor:
        def __init__(self, docs: List[Dict[str, Any]]):
            self.docs = docs
            self._sort_key = None
            self._sort_reverse = False
            self._limit_val = None
            self._skip_val = 0

        def sort(self, key_or_list, direction=1):
            if isinstance(key_or_list, list) and len(key_or_list) > 0:
                self._sort_key = key_or_list[0][0]
                self._sort_reverse = key_or_list[0][1] == -1
            elif isinstance(key_or_list, str):
                self._sort_key = key_or_list
                self._sort_reverse = direction == -1
            return self

        def limit(self, count: int):
            self._limit_val = count
            return self

        def skip(self, count: int):
            self._skip_val = count
            return self

        async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
            res = list(self.docs)
            if self._sort_key:
                res.sort(key=lambda d: str(d.get(self._sort_key, "")), reverse=self._sort_reverse)
            if self._skip_val:
                res = res[self._skip_val:]
            limit = length if length is not None else self._limit_val
            if limit is not None:
                res = res[:limit]
            return [d.copy() for d in res]

        def __aiter__(self):
            self._iter_idx = 0
            res = list(self.docs)
            if self._sort_key:
                res.sort(key=lambda d: str(d.get(self._sort_key, "")), reverse=self._sort_reverse)
            if self._skip_val:
                res = res[self._skip_val:]
            if self._limit_val is not None:
                res = res[:self._limit_val]
            self._iter_list = [d.copy() for d in res]
            return self

        async def __anext__(self):
            if self._iter_idx < len(self._iter_list):
                val = self._iter_list[self._iter_idx]
                self._iter_idx += 1
                return val
            raise StopAsyncIteration

    def find(self, query: Dict[str, Any] = None) -> Cursor:
        query = query or {}
        # Since find() is synchronous returning a cursor, docs will be resolved
        matched = [d for d in self._cache.values() if self._matches(d, query)]
        return self.Cursor(matched)

    async def insert_one(self, doc: Dict[str, Any]):
        await self._ensure_loaded()
        doc_copy = dict(doc)
        if "_id" not in doc_copy:
            doc_copy["_id"] = str(uuid.uuid4())
        if "created_at" not in doc_copy:
            doc_copy["created_at"] = datetime.utcnow().isoformat()
        if "updated_at" not in doc_copy:
            doc_copy["updated_at"] = datetime.utcnow().isoformat()

        async with self._lock:
            self._cache[doc_copy["_id"]] = doc_copy
            await self._persist()

        class InsertResult:
            inserted_id = doc_copy["_id"]
        return InsertResult()

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        await self._ensure_loaded()
        target_doc = None
        for doc in self._cache.values():
            if self._matches(doc, query):
                target_doc = doc
                break

        if not target_doc:
            class MockUpdate:
                matched_count = 0
                modified_count = 0
            return MockUpdate()

        async with self._lock:
            if "$set" in update:
                for k, v in update["$set"].items():
                    target_doc[k] = v
            if "$inc" in update:
                for k, v in update["$inc"].items():
                    target_doc[k] = target_doc.get(k, 0) + v
            target_doc["updated_at"] = datetime.utcnow().isoformat()
            await self._persist()

        class MockUpdateResult:
            matched_count = 1
            modified_count = 1
        return MockUpdateResult()

    async def delete_one(self, query: Dict[str, Any]):
        await self._ensure_loaded()
        target_id = None
        for doc_id, doc in self._cache.items():
            if self._matches(doc, query):
                target_id = doc_id
                break

        deleted = 0
        if target_id:
            async with self._lock:
                if target_id in self._cache:
                    del self._cache[target_id]
                    deleted = 1
                    await self._persist()

        class MockDeleteResult:
            deleted_count = deleted
        return MockDeleteResult()

    async def delete_many(self, query: Dict[str, Any]):
        await self._ensure_loaded()
        to_delete = [doc_id for doc_id, doc in self._cache.items() if self._matches(doc, query)]
        deleted = 0
        if to_delete:
            async with self._lock:
                for doc_id in to_delete:
                    if doc_id in self._cache:
                        del self._cache[doc_id]
                        deleted += 1
                await self._persist()
        class MockDeleteResult:
            deleted_count = deleted
        return MockDeleteResult()

    async def count_documents(self, query: Dict[str, Any] = None) -> int:
        await self._ensure_loaded()
        query = query or {}
        return sum(1 for doc in self._cache.values() if self._matches(doc, query))


class DatabaseManager:
    """Manages connections to MongoDB or local async document DB fallback."""
    def __init__(self):
        self.db = None
        self._collections: Dict[str, Any] = {}
        self._is_mongo = False

    async def connect(self):
        # Try connecting to live MongoDB if available
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=1000)
            await client.server_info()
            self.db = client[settings.MONGODB_DB_NAME]
            self._is_mongo = True
            print(f"Connected to MongoDB at {settings.MONGODB_URL}")
        except Exception:
            self._is_mongo = False
            print("MongoDB not reachable, utilizing persistent local document database at ./data/db/")

    def get_collection(self, name: str):
        if self._is_mongo and self.db is not None:
            return self.db[name]
        
        if name not in self._collections:
            db_dir = settings.DB_DIR
            try:
                os.makedirs(db_dir, exist_ok=True)
            except Exception:
                pass
            path = os.path.join(db_dir, f"{name}.json")
            col = LocalCollection(name, path)
            # Preload synchronously in background
            asyncio.create_task(col._ensure_loaded())
            self._collections[name] = col
        return self._collections[name]

db_manager = DatabaseManager()

# Collections specified in Prompt Section 25
def get_users_col(): return db_manager.get_collection("users")
def get_projects_col(): return db_manager.get_collection("research_projects")
def get_papers_col(): return db_manager.get_collection("papers")
def get_paper_analysis_col(): return db_manager.get_collection("paper_analysis")
def get_conversations_col(): return db_manager.get_collection("conversations")
def get_messages_col(): return db_manager.get_collection("messages")
def get_notes_col(): return db_manager.get_collection("notes")
def get_highlights_col(): return db_manager.get_collection("highlights")
def get_roadmaps_col(): return db_manager.get_collection("roadmaps")
def get_saved_papers_col(): return db_manager.get_collection("saved_papers")
def get_processing_jobs_col(): return db_manager.get_collection("processing_jobs")
def get_exports_col(): return db_manager.get_collection("exports")
