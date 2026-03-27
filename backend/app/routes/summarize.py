from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.rag_pipeline import rag_store
from app.services.summarizer import Summarizer


router = APIRouter(prefix="", tags=["summarize"])


class SummarizeRequest(BaseModel):
    doc_id: str


@router.post("/summarize")
async def summarize(payload: SummarizeRequest):
    try:
        text = rag_store.get_text(payload.doc_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Unknown doc_id. Upload a paper first.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        s = Summarizer()
        data = s.summarize(text)
        equation_explanations = s.explain_equations(data.get("equations_detected", []))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {e}")

    return {
        "short_summary": data.get("short_summary", ""),
        "detailed_summary": data.get("detailed_summary", ""),
        "key_concepts": data.get("key_concepts", []),
        "equations": equation_explanations,
    }

