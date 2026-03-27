import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api.js";

function prettyError(err) {
  return (
    err?.response?.data?.detail ||
    err?.message ||
    "Something went wrong. Please try again."
  );
}

export default function Chat({ docId }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);

  const canChat = useMemo(() => Boolean(docId), [docId]);

  useEffect(() => {
    setMessages([]);
    setError("");
    setBusy(false);
    setInput("");
  }, [docId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send() {
    const q = input.trim();
    if (!q || !canChat || busy) return;

    setError("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");

    try {
      const res = await api.post("/chat", { doc_id: docId, query: q, top_k: 5 });
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: res.data.answer,
          sources: res.data.sources || []
        }
      ]);
    } catch (err) {
      setError(prettyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Chat with the paper</h2>
        <button
          className="text-xs text-slate-300 underline decoration-slate-600 hover:text-slate-100 disabled:opacity-60"
          onClick={() => setMessages([])}
          disabled={!messages.length}
        >
          Clear chat
        </button>
      </div>

      {!canChat ? (
        <div className="text-sm text-slate-400">Upload a paper to start chatting.</div>
      ) : null}

      <div className="mt-3 h-[420px] overflow-auto rounded-xl border border-slate-800 bg-slate-950/40 p-3">
        {messages.length ? (
          <div className="space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl bg-indigo-500/20 px-3 py-2 text-sm text-slate-100 ring-1 ring-indigo-500/30"
                    : "mr-auto max-w-[85%] rounded-2xl bg-slate-900/60 px-3 py-2 text-sm text-slate-100 ring-1 ring-slate-800"
                }
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.role === "assistant" && Array.isArray(m.sources) && m.sources.length ? (
                  <div className="mt-2 text-xs text-slate-400">
                    Sources:{" "}
                    {m.sources
                      .slice(0, 5)
                      .map((s) => `#${s.chunk_id}`)
                      .join(", ")}
                  </div>
                ) : null}
              </div>
            ))}
            {busy ? (
              <div className="mr-auto max-w-[85%] rounded-2xl bg-slate-900/60 px-3 py-2 text-sm text-slate-300 ring-1 ring-slate-800">
                Thinking…
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-sm text-slate-500">
            Ask about methods, results, limitations, definitions, or equations.
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about the paper…"
          className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-600 focus:outline-none"
          disabled={!canChat || busy}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button
          className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
          disabled={!canChat || busy || !input.trim()}
          onClick={send}
        >
          Send
        </button>
      </div>
      <div className="mt-2 text-xs text-slate-400">
        Answers are constrained to retrieved chunks from the uploaded paper.
      </div>
    </div>
  );
}

