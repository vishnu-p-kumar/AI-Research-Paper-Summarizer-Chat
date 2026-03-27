from __future__ import annotations

from typing import Any, Dict, Optional

import requests

from app.config import (
    MODEL_NAME,
    OLLAMA_BASE_URL,
    OLLAMA_NUM_CTX,
    OLLAMA_NUM_PREDICT,
    OLLAMA_TEMPERATURE,
)


class LlamaService:
    """
    Uses Ollama (local) for running LLaMA-family models for free.

    Requirements:
    - Install Ollama
    - Pull a model, e.g.: `ollama pull llama3.1:8b` (or another model you have)
    - Ensure Ollama is running at OLLAMA_BASE_URL (default http://localhost:11434)
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout_s: int = 120,
    ) -> None:
        self.base_url = (base_url or OLLAMA_BASE_URL).rstrip("/")
        # Default to a sensible LLaMA model if user still has gemini in env.
        env_model = (model_name or MODEL_NAME or "").strip()
        if env_model.lower().startswith("gemini"):
            env_model = "llama3.1:8b"
        self.model_name = env_model or "llama3.1:8b"
        self.timeout_s = timeout_s

    def generate_response(self, prompt: str, system: Optional[str] = None) -> str:
        url = f"{self.base_url}/api/generate"
        payload: Dict[str, Any] = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                # Lower values keep laptops responsive; override in backend/.env if desired.
                "num_ctx": OLLAMA_NUM_CTX,
                "num_predict": OLLAMA_NUM_PREDICT,
                "temperature": OLLAMA_TEMPERATURE,
            },
        }
        if system:
            payload["system"] = system

        resp = requests.post(url, json=payload, timeout=self.timeout_s)
        resp.raise_for_status()
        data = resp.json()
        return (data.get("response") or "").strip()

    def list_models(self) -> list[dict]:
        url = f"{self.base_url}/api/tags"
        resp = requests.get(url, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        models = []
        for m in data.get("models", []) or []:
            models.append(
                {
                    "name": m.get("name"),
                    "modified_at": m.get("modified_at"),
                    "size": m.get("size"),
                }
            )
        return models

