from __future__ import annotations

import os
import sys
import tempfile
import subprocess
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, File, UploadFile, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import storage
from .cv import read_image_bytes_to_bgr, canny_edges, detect_hands, detect_faces, encode_png


app = FastAPI(title="DevCollab: AI/ML & CV Collaboration Hub")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------- Models ---------
class SnippetCreate(BaseModel):
    title: str
    language: str = "python"
    code: str
    tags: Optional[List[str]] = None


# --------- Routes ---------
@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/snippets")
async def list_snippets():
    return storage.list_snippets()


@app.post("/api/snippets")
async def create_snippet(payload: SnippetCreate):
    item = storage.create_snippet(
        title=payload.title,
        language=payload.language,
        code=payload.code,
        tags=payload.tags or [],
    )
    return item


@app.post("/api/run/cv/canny")
async def run_canny(
    file: UploadFile = File(...),
    low: int = Form(100),
    high: int = Form(200),
):
    content = await file.read()
    image_bgr = read_image_bytes_to_bgr(content)
    edges_bgr = canny_edges(image_bgr, low_threshold=low, high_threshold=high)
    png_bytes = encode_png(edges_bgr)
    return Response(content=png_bytes, media_type="image/png")


@app.post("/api/run/cv/hands")
async def run_hand_detection(file: UploadFile = File(...)):
    content = await file.read()
    image_bgr = read_image_bytes_to_bgr(content)
    result_bgr = detect_hands(image_bgr)
    png_bytes = encode_png(result_bgr)
    return Response(content=png_bytes, media_type="image/png")


@app.post("/api/run/cv/faces")
async def run_face_detection(file: UploadFile = File(...)):
    content = await file.read()
    image_bgr = read_image_bytes_to_bgr(content)
    result_bgr = detect_faces(image_bgr)
    png_bytes = encode_png(result_bgr)
    return Response(content=png_bytes, media_type="image/png")


@app.post("/api/run/code")
async def run_code(code: str = Form(...)):
    # Create a temp script file
    with tempfile.TemporaryDirectory() as tmp_dir:
        script_path = Path(tmp_dir) / "snippet.py"
        script_path.write_text(code, encoding="utf-8")

        # Use isolated Python (-I) and our sandbox runner
        env = os.environ.copy()
        cmd = [
            sys.executable,
            "-I",
            "-m",
            "app.sandbox_runner",
            str(script_path),
        ]
        try:
            proc = subprocess.run(
                cmd,
                cwd=str(Path(__file__).parent),
                capture_output=True,
                text=True,
                timeout=3,
                env=env,
            )
            return JSONResponse(
                {
                    "returncode": proc.returncode,
                    "stdout": proc.stdout,
                    "stderr": proc.stderr,
                }
            )
        except subprocess.TimeoutExpired as e:
            return JSONResponse(
                {
                    "returncode": 124,
                    "stdout": e.stdout or "",
                    "stderr": (e.stderr or "") + "\nTimeout",
                },
                status_code=200,
            )


# --------- WebSocket Chat ---------
class ConnectionManager:
    def __init__(self) -> None:
        self.active: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active:
            self.active.remove(websocket)

    async def broadcast(self, message: str):
        for ws in list(self.active):
            try:
                await ws.send_text(message)
            except Exception:
                self.disconnect(ws)


manager = ConnectionManager()


@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# --------- Static Files ---------
static_dir = Path(__file__).parent / "static"
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")