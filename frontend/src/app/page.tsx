"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type JobStatus = "idle" | "uploading" | "pending" | "directing" | "narrating" | "completed" | "failed";

export default function Home() {
  const [status, setStatus] = useState<JobStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!jobId || status === "idle" || status === "completed" || status === "failed") {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) return;
        const job = await res.json();
        setProgress(job.progress);

        if (job.status === "directing") setStatus("directing");
        else if (job.status === "narrating") setStatus("narrating");
        else if (job.status === "completed") {
          setStatus("completed");
          setAudioUrl(job.audio_url);
        } else if (job.status === "failed") {
          setStatus("failed");
          setError(job.error || "Processing failed");
        }
      } catch {}
    }, 2000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [jobId, status]);

  const handleFile = useCallback((f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["txt", "pdf", "epub", "docx"].includes(ext ?? "")) {
      setError("Unsupported file type. Please upload .txt, .pdf, .epub, or .docx");
      return;
    }
    setFile(f);
    setError(null);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Upload failed");
      }

      const job = await res.json();
      setJobId(job.id);
      setStatus("pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("idle");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Echoic</h1>
          <p className="text-zinc-400">Upload a manuscript. Get an audiobook.</p>
        </div>

        {status === "idle" && (
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${
              dragOver ? "border-blue-500 bg-blue-500/10" : "border-zinc-700 hover:border-zinc-500"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".txt,.pdf,.epub,.docx";
              input.onchange = (e) => {
                const f = (e.target as HTMLInputElement).files?.[0];
                if (f) handleFile(f);
              };
              input.click();
            }}
          >
            {file ? (
              <div className="space-y-3">
                <p className="text-lg font-medium">{file.name}</p>
                <p className="text-sm text-zinc-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                  className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
                >
                  Generate Audiobook
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-zinc-400">Drop your manuscript here, or click to browse</p>
                <p className="text-sm text-zinc-600">.txt, .pdf, .epub, .docx</p>
              </div>
            )}
          </div>
        )}

        {status === "uploading" && (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-zinc-400">Uploading...</p>
          </div>
        )}

        {(status === "pending" || status === "directing" || status === "narrating") && (
          <div className="text-center py-12 space-y-4">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-zinc-400">
              {status === "pending" && "Queued..."}
              {status === "directing" && "Analyzing text & adding direction..."}
              {status === "narrating" && "Generating audio..."}
            </p>
            <div className="w-full bg-zinc-800 rounded-full h-2 max-w-xs mx-auto">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p className="text-xs text-zinc-600">{Math.round(progress * 100)}%</p>
          </div>
        )}

        {status === "completed" && (
          <div className="text-center py-12 space-y-6">
            <p className="text-2xl font-semibold">Your audiobook is ready</p>
            {audioUrl && (
              <audio controls className="mx-auto" src={audioUrl}>
                Your browser does not support the audio element.
              </audio>
            )}
            <div className="flex gap-3 justify-center">
              {audioUrl && (
                <a
                  href={audioUrl}
                  download
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
                >
                  Download
                </a>
              )}
              <button
                onClick={() => { setStatus("idle"); setFile(null); setJobId(null); setAudioUrl(null); setProgress(0); }}
                className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
              >
                Convert another
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </div>
    </main>
  );
}
