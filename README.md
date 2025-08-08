# DevCollab: AI/ML & Computer Vision Collaboration Hub

DevCollab is a minimal MVP web app where programmers can collaborate, share code snippets, chat in real time, and run basic computer vision programs in-browser via a Python backend.

## Features
- Code snippets: create and browse shared code (stored in JSON for simplicity)
- Run code: execute small Python code snippets server-side with timeouts and isolation flags
- Computer Vision: upload an image and run Canny edge detection (OpenCV) on the server
- Real-time chat: simple WebSocket-based room
- Single-page UI: static HTML/JS served by the backend (no separate Node build required)

## Tech Stack
- Backend: FastAPI + Uvicorn
- CV: OpenCV (opencv-python-headless) + Pillow + NumPy
- Storage: JSON file (no external DB needed)
- Frontend: Static HTML/CSS/JS served by FastAPI

## Prerequisites
- Python 3.10+

## Getting Started

1) Create a virtual environment
```
python -m venv .venv
source .venv/bin/activate
```

2) Install backend dependencies
```
pip install -r backend/requirements.txt
```

3) Run the server (Docker recommended)

Option A: Docker
```
docker compose up --build
```

Option B: Local (requires Python 3.10+ and system libs for OpenCV)
```
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --app-dir backend
```

4) Open the site
- Visit `http://localhost:8000` in your browser

## How to Use
- Snippets: Use the Snippets tab to create and list snippets
- Run Code: Use the Run Code tab to execute small Python snippets (stdout/stderr returned)
- Computer Vision: Use the Computer Vision tab to upload an image and run Canny edge detection; the processed image is returned
- Chat: Use the Chat tab for a shared room (everyone connected sees messages)

## Notes
- The code runner is for demo purposes only. It uses Python isolated mode and a timeout, but is not a secure sandbox.
- For production: run code in containers or serverless sandboxes, add auth, RBAC, persistence (DB), rate limits, and resource quotas.

## License
MIT