import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                AI Research Paper Summarizer + Chat
              </h1>
              <p className="text-sm text-slate-300">
                Upload a PDF or paste a paper URL, then summarize and chat using RAG.
              </p>
            </div>
            <div className="text-xs text-slate-400">
              Backend:{" "}
              <span className="rounded bg-slate-900 px-2 py-1">
                {import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}
              </span>
            </div>
          </div>
        </header>
        <Dashboard />
      </div>
    </div>
  );
}

