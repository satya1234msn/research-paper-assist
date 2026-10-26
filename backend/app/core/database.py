import os
import json
import asyncio
import uuid
import re
from typing import Dict, Any, List, Optional
from datetime import datetime
from backend.app.core.config import settings

class LocalCollection:
    """Lightweight async document collection with MongoDB-like API for standalone execution."""
    def __init__(self, name: str, filepath: str):
        self.name = name
        self.filepath = filepath
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._loaded = False

    async def _ensure_loaded(self):
        if not self._loaded:
            if os.path.exists(self.filepath):
                try:
                    with open(self.filepath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        self._cache = {doc["_id"]: doc for doc in data if isinstance(doc, dict) and "_id" in doc}
                except Exception:
                    self._cache = {}
            else:
                self._cache = {}
            self._loaded = True

    async def _persist(self):
        try:
            os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
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
                if "$in" in v and doc_val not in v["$in"]:
                    return False
                if "$ne" in v and doc_val == v["$ne"]:
                    return False
                if "$regex" in v:
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
        if target_id and target_id in self._cache:
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


class ResilientCursor:
    """Cursor that wraps Motor cursor and gracefully fails over to LocalCollection cursor."""
    def __init__(self, motor_cursor, local_cursor_getter):
        self.motor_cursor = motor_cursor
        self.local_cursor_getter = local_cursor_getter
        self._sort_args = None
        self._skip_val = None
        self._limit_val = None

    def sort(self, *args, **kwargs):
        if self.motor_cursor is not None:
            try:
                self.motor_cursor = self.motor_cursor.sort(*args, **kwargs)
            except Exception:
                pass
        self._sort_args = (args, kwargs)
        return self

    def skip(self, count: int):
        if self.motor_cursor is not None:
            try:
                self.motor_cursor = self.motor_cursor.skip(count)
            except Exception:
                pass
        self._skip_val = count
        return self

    def limit(self, count: int):
        if self.motor_cursor is not None:
            try:
                self.motor_cursor = self.motor_cursor.limit(count)
            except Exception:
                pass
        self._limit_val = count
        return self

    def _get_fallback_cursor(self):
        cur = self.local_cursor_getter()
        if self._sort_args:
            cur.sort(*self._sort_args[0], **self._sort_args[1])
        if self._skip_val is not None:
            cur.skip(self._skip_val)
        if self._limit_val is not None:
            cur.limit(self._limit_val)
        return cur

    async def to_list(self, length: Optional[int] = None):
        if self.motor_cursor is not None:
            try:
                return await self.motor_cursor.to_list(length=length)
            except Exception as e:
                print(f"MongoDB cursor.to_list error: {e}. Falling back to local store.")
        return await self._get_fallback_cursor().to_list(length=length)

    def __aiter__(self):
        return self._iterate()

    async def _iterate(self):
        if self.motor_cursor is not None:
            try:
                async for doc in self.motor_cursor:
                    yield doc
                return
            except Exception as e:
                print(f"MongoDB cursor iteration error: {e}. Falling back to local store.")
        fallback = self._get_fallback_cursor()
        async for doc in fallback:
            yield doc


class ResilientCollectionProxy:
    """Smart collection proxy that seamlessly executes on Motor (MongoDB) or falls back to LocalCollection on errors."""
    def __init__(self, name: str, db_manager: 'DatabaseManager'):
        self.name = name
        self.mgr = db_manager

    def _get_local(self) -> LocalCollection:
        if self.name not in self.mgr._local_collections:
            path = os.path.join(settings.DB_DIR, f"{self.name}.json")
            self.mgr._local_collections[self.name] = LocalCollection(self.name, path)
        return self.mgr._local_collections[self.name]

    async def find_one(self, *args, **kwargs):
        if self.mgr.is_mongo_active():
            try:
                res = await self.mgr.db[self.name].find_one(*args, **kwargs)
                if res is not None:
                    return res
            except Exception as e:
                print(f"MongoDB find_one notice on '{self.name}': {e}. Checking local store.")
        return await self._get_local().find_one(*args, **kwargs)

    def find(self, *args, **kwargs):
        motor_cur = None
        if self.mgr.is_mongo_active():
            try:
                motor_cur = self.mgr.db[self.name].find(*args, **kwargs)
            except Exception as e:
                print(f"MongoDB find notice on '{self.name}': {e}. Using local store.")
        return ResilientCursor(motor_cur, lambda: self._get_local().find(*args, **kwargs))

    async def insert_one(self, *args, **kwargs):
        # Always insert into local fallback first so data is guaranteed saved locally
        local_res = await self._get_local().insert_one(*args, **kwargs)
        if self.mgr.is_mongo_active():
            try:
                mongo_res = await self.mgr.db[self.name].insert_one(*args, **kwargs)
                return mongo_res
            except Exception as e:
                print(f"MongoDB insert_one notice on '{self.name}': {e}. Saved to local store.")
        return local_res

    async def update_one(self, *args, **kwargs):
        local_res = await self._get_local().update_one(*args, **kwargs)
        if self.mgr.is_mongo_active():
            try:
                mongo_res = await self.mgr.db[self.name].update_one(*args, **kwargs)
                return mongo_res
            except Exception as e:
                print(f"MongoDB update_one notice on '{self.name}': {e}. Updated local store.")
        return local_res

    async def delete_one(self, *args, **kwargs):
        local_res = await self._get_local().delete_one(*args, **kwargs)
        if self.mgr.is_mongo_active():
            try:
                mongo_res = await self.mgr.db[self.name].delete_one(*args, **kwargs)
                return mongo_res
            except Exception as e:
                print(f"MongoDB delete_one notice on '{self.name}': {e}. Deleted from local store.")
        return local_res

    async def delete_many(self, *args, **kwargs):
        local_res = await self._get_local().delete_many(*args, **kwargs)
        if self.mgr.is_mongo_active():
            try:
                mongo_res = await self.mgr.db[self.name].delete_many(*args, **kwargs)
                return mongo_res
            except Exception as e:
                print(f"MongoDB delete_many notice on '{self.name}': {e}. Deleted from local store.")
        return local_res

    async def count_documents(self, *args, **kwargs):
        if self.mgr.is_mongo_active():
            try:
                return await self.mgr.db[self.name].count_documents(*args, **kwargs)
            except Exception as e:
                print(f"MongoDB count notice on '{self.name}': {e}. Using local store.")
        return await self._get_local().count_documents(*args, **kwargs)


class DatabaseManager:
    """Manages connections to MongoDB Atlas with lazy initialization and zero-crash local document fallback."""
    def __init__(self):
        self.db = None
        self._is_mongo = False
        self._attempted = False
        self._local_collections: Dict[str, LocalCollection] = {}
        self.last_error = None

    def is_mongo_active(self) -> bool:
        if not self._attempted:
            self._init_mongo()
        return self._is_mongo and self.db is not None

    def _init_mongo(self):
        self._attempted = True
        url = settings.MONGODB_URL
        if not url:
            self._is_mongo = False
            return

        # Check for unreplaced password placeholder
        if "<" in url and ">" in url:
            self.last_error = "MONGODB_URL contains placeholder '<...>'. Set your actual MongoDB password in environment variables."
            print(f"NOTICE: {self.last_error}")
            self._is_mongo = False
            return

        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            client = AsyncIOMotorClient(
                url,
                serverSelectionTimeoutMS=10000,
                connectTimeoutMS=10000,
                socketTimeoutMS=20000
            )
            self.db = client[settings.MONGODB_DB_NAME]
            self._is_mongo = True
            print(f"Configured MongoDB Atlas client for database: {settings.MONGODB_DB_NAME}")
        except Exception as e:
            self._is_mongo = False
            self.last_error = str(e)
            print(f"MongoDB initialization notice ({e}). Using persistent local document database.")

    async def connect(self):
        self._init_mongo()
        if self.db is not None:
            try:
                await self.db.command("ping")
                self._is_mongo = True
                self.last_error = None
                print("MongoDB Atlas connection verified successfully.")
            except Exception as e:
                self.last_error = str(e)
                print(f"MongoDB Atlas ping notice ({e}). Live operations will continue retrying.")

    def get_collection(self, name: str) -> ResilientCollectionProxy:
        return ResilientCollectionProxy(name, self)

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
