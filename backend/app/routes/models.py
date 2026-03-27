from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.services.llama_service import LlamaService


router = APIRouter(prefix="", tags=["models"])


@router.get("/models")
async def list_models():
    try:
        return {"models": LlamaService().list_models()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list models: {e}")

