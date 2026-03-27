import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";

function prettyError(err) {
  return (
    err?.response?.data?.detail ||
    err?.message ||
    "Something went wrong. Please try again."
  );
}

export default function Summary({ docId }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const canRun = useMemo(() => Boolean(docId), [docId]);

  useEffect(() => {
    setData(null);
    setError("");
    setBusy(false);
  }, [docId]);

  async function run() {
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/summarize", { doc_id: docId });
      setData(res.data);
    } catch (err) {
      setError(prettyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Summaries</h2>
        <button
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-400 disabled:opacity-60"
          disabled={!canRun || busy}
          onClick={run}
        >
          {busy ? "Generating..." : "Generate summary"}
        </button>
      </div>

      {!canRun ? (
        <div className="mt-3 text-sm text-slate-400">
          Upload a paper to enable summarization.
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {data ? (
        <div className="mt-4 grid grid-cols-1 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="mb-2 text-xs font-medium text-slate-300">
              Short summary
            </div>
            <div className="whitespace-pre-wrap text-sm text-slate-100">
              {data.short_summary}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="mb-2 text-xs font-medium text-slate-300">
              Detailed summary
            </div>
            <div className="whitespace-pre-wrap text-sm text-slate-100">
              {data.detailed_summary}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="mb-2 text-xs font-medium text-slate-300">
              Key concepts
            </div>
            {Array.isArray(data.key_concepts) && data.key_concepts.length ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-100">
                {data.key_concepts.map((k, idx) => (
                  <li key={idx}>{k}</li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-400">No concepts returned.</div>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="mb-2 text-xs font-medium text-slate-300">
              Equation explanations
            </div>
            {Array.isArray(data.equations) && data.equations.length ? (
              <div className="space-y-3">
                {data.equations.map((e, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <div className="whitespace-pre-wrap rounded bg-slate-900 px-2 py-1 text-xs text-slate-200">
                      {e.equation}
                    </div>
                    <div className="mt-2 whitespace-pre-wrap text-sm text-slate-100">
                      {e.explanation}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400">
                No equations detected or explained.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

