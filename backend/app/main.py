from datetime import datetime, timezone
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="CrisisMesh API", version="1.0.0", description="Resilient emergency response coordination API")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

INCIDENTS = [
    {"id":"INC-1042","type":"Structural collapse","severity":"CRITICAL","lat":22.2437,"lng":84.8050,"people":7,"status":"RESCUE_REQUIRED","age":"2m"},
    {"id":"INC-1041","type":"Medical emergency","severity":"HIGH","lat":22.2520,"lng":84.8180,"people":2,"status":"TEAM_ASSIGNED","age":"5m"},
    {"id":"INC-1040","type":"Flooded road","severity":"MEDIUM","lat":22.2300,"lng":84.7900,"people":0,"status":"MONITORING","age":"8m"},
]
NODES = [
    {"id":"NODE-01","kind":"COMMAND","lat":22.2480,"lng":84.8070,"status":"ONLINE"},
    {"id":"NODE-17","kind":"RELAY","lat":22.2450,"lng":84.8010,"status":"ONLINE"},
    {"id":"NODE-23","kind":"VOLUNTEER","lat":22.2500,"lng":84.8130,"status":"ONLINE"},
    {"id":"NODE-31","kind":"RESCUE","lat":22.2410,"lng":84.8170,"status":"ONLINE"},
]

class SOSRequest(BaseModel):
    emergency_type: str = Field(min_length=2, max_length=80)
    people: int = Field(default=1, ge=1, le=500)
    message: str = Field(default="Immediate assistance required", max_length=500)
    lat: float
    lng: float

class ConnectionManager:
    def __init__(self): self.connections: List[WebSocket] = []
    async def connect(self, ws): await ws.accept(); self.connections.append(ws)
    def disconnect(self, ws):
        if ws in self.connections: self.connections.remove(ws)
    async def broadcast(self, payload):
        for ws in list(self.connections):
            try: await ws.send_json(payload)
            except Exception: self.disconnect(ws)

manager = ConnectionManager()

@app.get("/")
def root(): return {"name":"CrisisMesh","status":"operational","version":"1.0.0"}

@app.get("/api/health")
def health(): return {"status":"healthy","timestamp":datetime.now(timezone.utc).isoformat(),"connected_nodes":247}

@app.get("/api/incidents")
def incidents(): return INCIDENTS

@app.get("/api/nodes")
def nodes(): return NODES

@app.post("/api/sos")
async def create_sos(request: SOSRequest):
    incident = {"id":f"SOS-{1043+len(INCIDENTS)}","type":request.emergency_type,"severity":"CRITICAL" if request.people >= 5 else "HIGH","lat":request.lat,"lng":request.lng,"people":request.people,"status":"TRIAGE_PENDING","age":"now","message":request.message}
    INCIDENTS.insert(0, incident)
    await manager.broadcast({"event":"sos_created","incident":incident})
    return incident

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_json({"event":"connected","message":"CrisisMesh realtime channel established"})
        while True:
            message = await websocket.receive_json()
            if message.get("type") == "ping": await websocket.send_json({"event":"pong"})
    except (WebSocketDisconnect, Exception): manager.disconnect(websocket)
