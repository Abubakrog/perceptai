import json
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
SNIPPETS_PATH = DATA_DIR / "snippets.json"


def _read_all() -> Dict[str, dict]:
    if not SNIPPETS_PATH.exists():
        return {}
    try:
        with SNIPPETS_PATH.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _write_all(all_items: Dict[str, dict]) -> None:
    with SNIPPETS_PATH.open("w", encoding="utf-8") as f:
        json.dump(all_items, f, indent=2, ensure_ascii=False)


def list_snippets() -> List[dict]:
    items = _read_all()
    # newest first
    return sorted(items.values(), key=lambda x: x.get("createdAt", ""), reverse=True)


def get_snippet(snippet_id: str) -> Optional[dict]:
    return _read_all().get(snippet_id)


def create_snippet(title: str, language: str, code: str, tags: Optional[List[str]] = None) -> dict:
    items = _read_all()
    snippet_id = f"s_{int(datetime.utcnow().timestamp()*1000)}"
    item = {
        "id": snippet_id,
        "title": title.strip() or "Untitled",
        "language": language.strip() or "python",
        "code": code,
        "tags": tags or [],
        "createdAt": datetime.utcnow().isoformat() + "Z",
    }
    items[snippet_id] = item
    _write_all(items)
    return item