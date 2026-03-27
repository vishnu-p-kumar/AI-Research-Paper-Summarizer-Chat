# AI Research Paper Summarizer + Chat

Full-stack application for uploading a research paper, generating structured summaries, and chatting with the paper through retrieval-augmented generation (RAG). The backend uses FastAPI, FAISS, sentence-transformers, and a local Ollama model. The frontend uses React, Vite, and Tailwind CSS.

## What it does

- Upload a research paper as a PDF
- Paste a paper/article URL and extract readable text from it
- Generate:
  - a short summary
  - a detailed summary
  - key concepts
  - equation explanations
- Ask questions about the uploaded paper using chunk retrieval from the indexed document
- Fall back to web snippets when the paper does not contain the answer and web fallback is enabled
- Persist indexed documents to disk so `doc_id` values still work after backend restarts

## Project structure

```text
project/
  backend/
    app/
      routes/
      services/
      utils/
    storage/
    requirements.txt
  frontend/
    src/
    package.json
  README.md
```

## Tech stack

### Backend

- FastAPI
- Ollama for local LLM inference
- FAISS for vector search
- sentence-transformers (`all-MiniLM-L6-v2`) for embeddings
- PyMuPDF for PDF parsing
- BeautifulSoup + requests for URL extraction and web fallback search

### Frontend

- React 18
- Vite 5
- Tailwind CSS
- Axios

## How the app works

1. A PDF or URL is uploaded through the frontend.
2. The backend extracts plain text from the source.
3. The text is chunked and embedded with `all-MiniLM-L6-v2`.
4. A FAISS index plus the raw text/chunks are saved in `backend/storage/`.
5. Summarization uses a hierarchical approach:
   - summarize every chunk
   - combine chunk summaries
   - ask the LLM for one final structured JSON response
6. Chat first tries paper-grounded RAG.
7. If the paper likely does not contain the answer, or the RAG answer says the context is insufficient, the backend can fall back to DuckDuckGo snippets and answer in `web` mode.

## Prerequisites

Install these before running the project:

- Python 3.10 or newer
- Node.js 18 or newer
- Ollama

You also need at least one Ollama model pulled locally.

Recommended lightweight options:

```bash
ollama pull llama3.2:3b
```

```bash
ollama pull qwen2.5:1.5b
```

Make sure Ollama is running at:

```text
http://localhost:11434
```

## Backend setup

From `project/backend`:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```text
GET http://localhost:8000/health
```

### Backend environment variables

Create `project/backend/.env` if you want to override defaults.

```env
MODEL_NAME=llama3.2:3b
OLLAMA_BASE_URL=http://localhost:11434

OLLAMA_NUM_CTX=2048
OLLAMA_NUM_PREDICT=512
OLLAMA_TEMPERATURE=0.2

ENABLE_WEB_FALLBACK=1
WEB_MAX_RESULTS=5
WEB_TIMEOUT_S=12

CHUNK_SIZE=1000
CHUNK_OVERLAP=200

HOST=0.0.0.0
PORT=8000
MAX_UPLOAD_MB=25
```

### Backend notes

- The first embedding request may download the `sentence-transformers/all-MiniLM-L6-v2` model.
- Indexed documents are stored in `project/backend/storage/`.
- For each document, the backend writes:
  - `<doc_id>.json` for raw text and chunks
  - `<doc_id>.faiss` for the vector index

## Frontend setup

From `project/frontend`:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

### Frontend environment variable

Create `project/frontend/.env` if the API is not running on the default backend URL:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Frontend notes

- The UI stores the latest `doc_id` and preview text in browser local storage.
- Refreshing the page does not immediately lose the current paper reference.

## Usage flow

1. Start Ollama.
2. Start the backend on port `8000`.
3. Start the frontend on port `5173`.
4. Upload a PDF or submit a URL.
5. Generate the summary.
6. Ask questions in the chat panel.

## API endpoints

### `GET /health`

Simple health endpoint.

Response:

```json
{ "ok": true }
```

### `GET /models`

Lists models available in the local Ollama instance.

### `POST /upload/pdf`

Upload a PDF with `multipart/form-data`.

Field:

- `file`

Returns:

- `doc_id`
- `characters`
- `preview`

### `POST /upload/url`

Upload a paper/article URL as JSON.

Request body:

```json
{ "url": "https://example.com/paper" }
```

### `POST /summarize`

Request body:

```json
{ "doc_id": "your-doc-id" }
```

Returns:

- `short_summary`
- `detailed_summary`
- `key_concepts`
- `equations`

### `POST /chat`

Request body:

```json
{
  "doc_id": "your-doc-id",
  "query": "What is the main contribution of this paper?",
  "top_k": 5
}
```

Returns:

- `answer`
- `sources`
- `mode`

Possible `mode` values:

- `rag`: answer came from retrieved paper chunks
- `web`: answer used DuckDuckGo snippets plus the local model
- `general`: answer used the local model without paper context or web snippets

## Retrieval and fallback behavior

- The backend checks whether meaningful query terms appear in the paper text.
- If they do, it retrieves relevant chunks from FAISS and asks the model to answer only from that context.
- If the answer appears insufficient and web fallback is enabled, it searches the web and answers using the snippets.
- If web fallback is disabled, it falls back to a general local-model response.

## Limitations

- URL extraction is best-effort and may fail on heavily scripted or protected pages.
- Equation detection is heuristic and may miss some formulas or capture noisy lines.
- Web fallback uses DuckDuckGo HTML scraping, so result quality can vary.
- Large papers can be slow on lightweight local models.
- Answer quality depends heavily on the Ollama model installed on your system.

## Troubleshooting

- If uploads fail, check that the file is a real text-based PDF and is under `MAX_UPLOAD_MB`.
- If summarization is slow, switch to a smaller model such as `qwen2.5:1.5b`.
- If Ollama calls fail, verify the Ollama server is running at `http://localhost:11434`.
- If chat answers are weak, try a stronger local model or reduce system load.
- If URL upload returns too little text, upload the PDF directly instead.

## Suggested low-resource settings

For slower laptops, these backend settings are a good starting point:

```env
MODEL_NAME=qwen2.5:1.5b
OLLAMA_NUM_CTX=1024
OLLAMA_NUM_PREDICT=256
OLLAMA_TEMPERATURE=0.2
```
