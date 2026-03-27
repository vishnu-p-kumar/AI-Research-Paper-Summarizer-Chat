import { useEffect, useMemo, useState } from "react";
import Upload from "../components/Upload.jsx";
import Summary from "../components/Summary.jsx";
import Chat from "../components/Chat.jsx";

const LS_DOC_ID = "ai_paper_doc_id";
const LS_PREVIEW = "ai_paper_preview";

export default function Dashboard() {
  const [docId, setDocId] = useState(() => localStorage.getItem(LS_DOC_ID) || "");
  const [preview, setPreview] = useState(() => localStorage.getItem(LS_PREVIEW) || "");
  const [uploadError, setUploadError] = useState("");

  const hasDoc = useMemo(() => Boolean(docId), [docId]);

  useEffect(() => {
    if (docId) localStorage.setItem(LS_DOC_ID, docId);
    else localStorage.removeItem(LS_DOC_ID);
  }, [docId]);

  useEffect(() => {
    if (preview) localStorage.setItem(LS_PREVIEW, preview);
    else localStorage.removeItem(LS_PREVIEW);
  }, [preview]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Upload</h2>
          <Upload
            onUploaded={({ doc_id, preview: p }) => {
              setDocId(doc_id);
              setPreview(p || "");
              setUploadError("");
            }}
            onError={(msg) => setUploadError(msg)}
          />
          {uploadError ? (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {uploadError}
            </div>
          ) : null}

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-300">doc_id</div>
              <button
                className="text-xs text-slate-300 underline decoration-slate-600 hover:text-slate-100"
                onClick={() => {
                  setDocId("");
                  setPreview("");
                }}
                disabled={!hasDoc}
              >
                Clear
              </button>
            </div>
            <div className="mt-2 break-all rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-200">
              {docId || "Upload a paper to generate a doc_id."}
            </div>
          </div>

          {preview ? (
            <div className="mt-4">
              <div className="mb-2 text-xs font-medium text-slate-300">
                Text preview
              </div>
              <div className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-200">
                {preview}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="grid grid-cols-1 gap-6">
          <Summary docId={docId} />
          <Chat docId={docId} />
        </div>
      </div>
    </div>
  );
}

