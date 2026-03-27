import { useRef, useState } from "react";
import { api } from "../api.js";

function prettyError(err) {
  return (
    err?.response?.data?.detail ||
    err?.message ||
    "Something went wrong. Please try again."
  );
}

export default function Upload({ onUploaded, onError }) {
  const fileRef = useRef(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function uploadPdf(file) {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post("/upload/pdf", form, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    onUploaded?.(res.data);
  }

  async function uploadUrl(paperUrl) {
    const res = await api.post("/upload/url", { url: paperUrl });
    onUploaded?.(res.data);
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-xs font-medium text-slate-300">PDF</div>
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/30 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-200">
              Drag & drop not required — just pick a PDF.
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="text-sm text-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:text-slate-100 hover:file:bg-slate-700"
              disabled={busy}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                try {
                  await uploadPdf(file);
                } catch (err) {
                  onError?.(prettyError(err));
                } finally {
                  setBusy(false);
                  e.target.value = "";
                }
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-medium text-slate-300">Paper URL</div>
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://arxiv.org/abs/..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-600 focus:outline-none"
            disabled={busy}
          />
          <button
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
            disabled={busy || !url.trim()}
            onClick={async () => {
              setBusy(true);
              try {
                await uploadUrl(url.trim());
              } catch (err) {
                onError?.(prettyError(err));
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Uploading..." : "Upload"}
          </button>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          Tip: if the URL is a PDF, upload the PDF directly for best extraction.
        </div>
      </div>
    </div>
  );
}

