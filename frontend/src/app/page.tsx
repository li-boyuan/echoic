"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type JobStatus = "idle" | "uploading" | "pending" | "directing" | "narrating" | "completed" | "failed";
type Voice = { id: string; name: string; description: string };

export default function Home() {
  const [status, setStatus] = useState<JobStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("Kore");
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/voices")
      .then((r) => r.json())
      .then(setVoices)
      .catch(() => {});
  }, []);

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

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
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
      formData.append("voice", selectedVoice);

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

  const reset = () => {
    setStatus("idle");
    setFile(null);
    setJobId(null);
    setAudioUrl(null);
    setProgress(0);
    setError(null);
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              Echoic
            </h1>
            <p className="text-xl text-zinc-400">
              Turn any manuscript into a professional audiobook in minutes
            </p>
            <p className="text-sm text-zinc-600">
              AI reads your text, adds natural emotion and pacing, then narrates it
            </p>
          </div>

          {status === "idle" && (
            <div className="space-y-6">
              {/* Voice Selector */}
              {voices.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400 block">Narrator voice</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {voices.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVoice(v.id)}
                        className={`px-4 py-3 rounded-xl text-left transition-all ${
                          selectedVoice === v.id
                            ? "bg-blue-600/20 border-2 border-blue-500 text-blue-300"
                            : "bg-zinc-900 border-2 border-zinc-800 hover:border-zinc-600 text-zinc-300"
                        }`}
                      >
                        <div className="font-medium text-sm">{v.name}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{v.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Zone */}
              <div
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${
                  dragOver
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-700 hover:border-zinc-500"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
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
                    <div className="text-4xl">📄</div>
                    <p className="text-lg font-medium">{file.name}</p>
                    <p className="text-sm text-zinc-500">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpload();
                      }}
                      className="mt-4 px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors text-lg"
                    >
                      Generate Audiobook
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-4xl">📁</div>
                    <p className="text-zinc-400">
                      Drop your manuscript here, or click to browse
                    </p>
                    <p className="text-sm text-zinc-600">.txt, .pdf, .epub, .docx</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {status === "uploading" && (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <p className="mt-4 text-zinc-400">Uploading...</p>
            </div>
          )}

          {(status === "pending" ||
            status === "directing" ||
            status === "narrating") && (
            <div className="text-center py-12 space-y-4">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-zinc-300 font-medium">
                {status === "pending" && "Queued..."}
                {status === "directing" && "Reading & adding emotion cues..."}
                {status === "narrating" && "Generating audio narration..."}
              </p>
              <div className="w-full bg-zinc-800 rounded-full h-2 max-w-xs mx-auto">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <p className="text-xs text-zinc-600">
                {Math.round(progress * 100)}%
              </p>
            </div>
          )}

          {status === "completed" && (
            <div className="text-center py-12 space-y-6">
              <div className="text-4xl">🎧</div>
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
                  onClick={reset}
                  className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
                >
                  Convert another
                </button>
              </div>
            </div>
          )}

          {status === "failed" && (
            <div className="text-center py-12 space-y-4">
              <p className="text-red-400">Something went wrong</p>
              {error && <p className="text-sm text-red-400/70">{error}</p>}
              <button
                onClick={reset}
                className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {error && status === "idle" && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="border-t border-zinc-800 py-16 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-200">AI-Directed</h3>
            <p className="text-sm text-zinc-500">
              An AI reads your text first and adds emotion, pacing, and dramatic
              beats — so the narration sounds natural, not robotic.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-200">Multiple Voices</h3>
            <p className="text-sm text-zinc-500">
              Choose from a range of natural-sounding voices. Each brings a
              different tone and personality to your text.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-200">Any Format</h3>
            <p className="text-sm text-zinc-500">
              Upload TXT, PDF, EPUB, or DOCX. Echoic extracts the text and
              handles the rest.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-6 px-4 text-center text-xs text-zinc-600">
        Echoic — AI-powered audiobook generation
      </footer>
    </main>
  );
}
