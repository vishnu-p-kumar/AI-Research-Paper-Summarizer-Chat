import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORAGE_DIR = os.getenv("STORAGE_DIR", os.path.join(BASE_DIR, "storage"))

# LLM (Ollama / LLaMA)
# NOTE: GEMINI_API_KEY intentionally no longer used (project uses LLaMA via Ollama).
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # kept for backward compatibility; unused
MODEL_NAME = os.getenv("MODEL_NAME", "llama3.2:3b")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_NUM_CTX = int(os.getenv("OLLAMA_NUM_CTX", 2048))
OLLAMA_NUM_PREDICT = int(os.getenv("OLLAMA_NUM_PREDICT", 512))
OLLAMA_TEMPERATURE = float(os.getenv("OLLAMA_TEMPERATURE", 0.2))

ENABLE_WEB_FALLBACK = os.getenv("ENABLE_WEB_FALLBACK", "1").strip() not in ("0", "false", "False")
WEB_MAX_RESULTS = int(os.getenv("WEB_MAX_RESULTS", 5))
WEB_TIMEOUT_S = int(os.getenv("WEB_TIMEOUT_S", 12))

CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", 1000))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", 200))

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", 25))

