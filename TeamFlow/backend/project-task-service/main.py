import os
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime

app = FastAPI(title="TeamFlow Collaborative Engine")

# 🌐 Cross-Origin Resource Sharing (CORS) Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 💾 MongoDB Atlas Connection
MONGODB_URI = os.getenv("DB_CONNECTION_STRING")

if not MONGODB_URI:
    raise RuntimeError("CRITICAL: DB_CONNECTION_STRING is missing from environment variables!")
client = AsyncIOMotorClient(MONGO_URI)
db = client["teamflow_db"]
@app.get("/health")
async def health_check():
    return {"status": "operational", "database": "connected"}
# 🗃️ TeamFlow Collections
users_collection = db["users"]
tasks_collection = db["tasks"]
logs_collection = db["activity_logs"]
rca_collection = db["root_cause_analyses"]
comments_collection = db["task_comments"]

# 📊 Data Aggregates & Pydantic Schemas
class UserRegister(BaseModel):
    username: str
    password: str
    role: str = "Developer"

class UserLogin(BaseModel):
    username: str
    password: str
    role: Optional[str] = "Developer"

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    project_id: str = "project_alpha"

class ReviewVerdict(BaseModel):
    status: str  # "Approved" or "Rejected"
    comments: str

class CommentCreate(BaseModel):
    username: str
    text: str

# 🛠️ Helper Functions
def task_helper(task) -> dict:
    return {
        "id": str(task["_id"]),
        "title": task.get("title"),
        "description": task.get("description", ""),
        "status": task.get("status", "Todo"),
        "project_id": task.get("project_id", "project_alpha"),
        "assigned_to": task.get("assigned_to", "Unassigned Pool"),
        "review": task.get("review", {"status": "Pending", "comments": ""})
    }

def rca_helper(rca) -> dict:
    return {
        "id": str(rca["_id"]),
        "task_id": rca.get("task_id"),
        "severity": rca.get("severity", "High"),
        "status": rca.get("status", "Under Investigation"),
        "timeline": rca.get("timeline", [])
    }

# 🏁 System Initialization
@app.on_event("startup")
async def startup_event():
    await logs_collection.insert_one({"message": "System operational pipeline active with automated RCA lifecycle management."})

# 👥 Identity Management Endpoints
@app.post("/auth/register", status_code=201)
async def register(user: UserRegister):
    existing = await users_collection.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Identity profile already registered.")
    new_user = {"username": user.username, "password": user.password, "role": user.role}
    await users_collection.insert_one(new_user)
    return {"message": "Registration verified."}

@app.post("/auth/login")
async def login(user: UserLogin):
    account = await users_collection.find_one({"username": user.username, "password": user.password})
    if not account:
        raise HTTPException(status_code=401, detail="Invalid authorization parameters.")
    return {
        "token": f"mock-jwt-token-{account['username']}",
        "username": account["username"],
        "role": account.get("role", "Developer")
    }

# 📋 Task Lifecycle Endpoints
@app.get("/tasks", response_model=List[dict])
async def get_all_tasks():
    tasks = []
    async for task in tasks_collection.find():
        tasks.append(task_helper(task))
    return tasks

@app.post("/tasks", status_code=201)
async def create_task(task: TaskCreate):
    new_task = {
        "title": task.title,
        "description": task.description,
        "status": "Todo",
        "project_id": task.project_id,
        "assigned_to": "Unassigned Pool",
        "review": {"status": "Pending", "comments": ""}
    }
    result = await tasks_collection.insert_one(new_task)
    return {"id": str(result.inserted_id)}

@app.put("/tasks/{task_id}/status")
async def update_task_status(task_id: str, payload: dict):
    target_status = payload.get("status")
    if target_status not in ["Todo", "In Progress", "Review", "Done"]:
        raise HTTPException(status_code=400, detail="Invalid target state entry.")
    await tasks_collection.update_one({"_id": ObjectId(task_id)}, {"$set": {"status": target_status}})
    return {"message": "Status tracking updated."}

# 🟢 Quality Gate Control & Automated RCA Lifecycle
@app.post("/tasks/{task_id}/review")
async def commit_task_review(task_id: str, review: ReviewVerdict):
    next_status = "Done" if review.status == "Approved" else "In Progress"
    
    # Update main task status
    await tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": {"status": next_status, "review": {"status": review.status, "comments": review.comments}}}
    )
    
    # Case A: If Approved, resolve any active matching RCA
    if review.status == "Approved":
        await rca_collection.update_one(
            {"task_id": task_id, "status": "Under Investigation"},
            {"$set": {"status": "Resolved"}, "$push": {"timeline": f"[{datetime.now().strftime('%Y-%m-%d %H:%M')}] Closed via manager approval."}}
        )
        await logs_collection.insert_one({"message": f"✅ RCA for task {task_id} auto-resolved."})
    
    # Case B: If Rejected, open a new active RCA investigation
    if review.status == "Rejected":
        await rca_collection.insert_one({
            "task_id": task_id,
            "severity": "High",
            "status": "Under Investigation",
            "timeline": [f"[{datetime.now().strftime('%Y-%m-%d %H:%M')}] Rejected by manager. Reason: {review.comments}"]
        })
        await logs_collection.insert_one({"message": f"🚨 Automated RCA opened for task {task_id}."})
    
    return {"message": "Review decision processed successfully."}

# 🕵️‍♂️ Root Cause Analysis (RCA) Endpoints
@app.get("/rcas", response_model=List[dict])
async def get_all_rcas():
    rcas = []
    async for rca in rca_collection.find():
        rcas.append(rca_helper(rca))
    return rcas

# 💬 Threaded Discussion Endpoints
@app.get("/tasks/{task_id}/comments")
async def get_comments(task_id: str):
    comments = []
    async for comment in comments_collection.find({"task_id": task_id}).sort("_id", 1):
        comments.append({
            "id": str(comment["_id"]),
            "username": comment.get("username"),
            "text": comment.get("text"),
            "timestamp": comment.get("timestamp", "")
        })
    return comments

@app.post("/tasks/{task_id}/comments", status_code=201)
async def add_comment(task_id: str, comment: CommentCreate):
    await comments_collection.insert_one({
        "task_id": task_id,
        "username": comment.username,
        "text": comment.text,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })
    return {"message": "Comment posted."}

# 📋 Telemetry Logs Endpoint
@app.get("/logs")
async def get_system_logs():
    logs = []
    async for log in logs_collection.find().sort("_id", -1).limit(10):
        logs.append({"id": str(log["_id"]), "message": log["message"]})
    return logs