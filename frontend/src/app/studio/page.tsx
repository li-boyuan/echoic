"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

type JobStatus = "idle" | "uploading" | "pending" | "directing" | "narrating" | "completed" | "failed";
type Voice = { id: string; name: string; description: string };
type Cast = Record<string, string>;
type Chapter = { index: number; title: string; status: string; audio_url: string | null };
type Credits = { free_available: boolean; single_credits: number; pro_active: boolean; free_word_limit: number };

const VOICES: Voice[] = [
  { id: "Kore", name: "Kore", description: "Warm, clear female voice" },
  { id: "Charon", name: "Charon", description: "Deep, authoritative male voice" },
  { id: "Fenrir", name: "Fenrir", description: "Calm, steady male voice" },
  { id: "Aoede", name: "Aoede", description: "Bright, expressive female voice" },
  { id: "Puck", name: "Puck", description: "Energetic, youthful voice" },
  { id: "Leda", name: "Leda", description: "Soft, gentle female voice" },
];

export default function Studio() {
  const { user } = useUser();
  const [credits, setCredits] = useState<Credits | null>(null);
  const [status, setStatus] = useState<JobStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("Kore");
  const [cast, setCast] = useState<Cast>({});
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [playingChapter, setPlayingChapter] = useState<number | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const voiceName = (id: string) => VOICES.find((v) => v.id === id)?.name || id;

  useEffect(() => {
    if (!user) return;
    fetch(`/api/user/${user.id}/credits`)
      .then((r) => r.json())
      .then(setCredits)
      .catch(() => {});
  }, [user, status]);

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
        if (job.cast && Object.keys(job.cast).length > 0) setCast(job.cast);
        if (job.chapters?.length > 0) setChapters(job.chapters);

        if (job.status === "directing") setStatus("directing");
        else if (job.status === "narrating") setStatus("narrating");
        else if (job.status === "completed") {
          setStatus("completed");
          setAudioUrl(job.audio_url);
          if (job.cast) setCast(job.cast);
          if (job.chapters) setChapters(job.chapters);
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
      formData.append("user_id", user?.id || "anonymous");

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
    setCast({});
    setChapters([]);
    setPlayingChapter(null);
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <Link
          href="/"
          className="text-lg font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent"
        >
          Echoic
        </Link>
        <div className="flex items-center gap-4">
          {credits && (
            <div className="flex items-center gap-3 text-sm">
              {credits.pro_active ? (
                <span className="px-3 py-1.5 bg-violet-600/20 text-violet-300 border border-violet-500/30 rounded-full font-medium">Pro</span>
              ) : (
                <>
                  {credits.free_available && (
                    <span className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-full font-medium">
                      1 free conversion
                    </span>
                  )}
                  {credits.single_credits > 0 && (
                    <span className="px-3 py-1.5 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-full font-medium">
                      {credits.single_credits} credit{credits.single_credits !== 1 ? "s" : ""}
                    </span>
                  )}
                  {!credits.free_available && credits.single_credits === 0 && (
                    <Link
                      href="/pricing"
                      className="px-3 py-1.5 bg-amber-600/20 text-amber-300 border border-amber-500/30 rounded-full font-medium hover:bg-amber-600/30 transition-colors"
                    >
                      Get credits
                    </Link>
                  )}
                </>
              )}
            </div>
          )}
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      {/* Studio Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full space-y-8">
          {status === "idle" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-center">Create an audiobook</h2>

              {credits && !credits.pro_active && !credits.free_available && credits.single_credits === 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center space-y-3">
                  <p className="text-zinc-300">You've used your free conversion</p>
                  <p className="text-sm text-zinc-500">Purchase credits or subscribe to Pro to continue</p>
                  <Link
                    href="/pricing"
                    className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-sm transition-colors"
                  >
                    View Pricing
                  </Link>
                </div>
              )}

              {/* Narrator Voice Selector */}
              <div className="space-y-2">
                <label className="text-sm text-zinc-400 block">Narrator voice</label>
                <p className="text-xs text-zinc-600">Character voices are automatically cast by AI</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {VOICES.map((v) => (
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

          {(status === "pending" || status === "directing" || status === "narrating") && (
            <div className="text-center py-12 space-y-4">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-zinc-300 font-medium">
                {status === "pending" && "Queued..."}
                {status === "directing" && "Reading text & casting characters..."}
                {status === "narrating" && "Generating audio narration..."}
              </p>
              <div className="w-full bg-zinc-800 rounded-full h-2 max-w-xs mx-auto">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <p className="text-xs text-zinc-600">{Math.round(progress * 100)}%</p>

              {Object.keys(cast).length > 0 && (
                <div className="mt-6 max-w-sm mx-auto">
                  <p className="text-xs text-zinc-500 mb-2">Cast</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {Object.entries(cast).map(([char, voice]) => (
                      <span
                        key={char}
                        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs"
                      >
                        <span className="text-zinc-300">{char}</span>
                        <span className="text-zinc-600"> — {voiceName(voice)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {chapters.length > 1 && (
                <div className="mt-6 max-w-sm mx-auto">
                  <p className="text-xs text-zinc-500 mb-2">Chapters</p>
                  <div className="space-y-1">
                    {chapters.map((ch) => (
                      <div
                        key={ch.index}
                        className="flex items-center justify-between px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs"
                      >
                        <span className="text-zinc-300">{ch.title}</span>
                        <span className={
                          ch.status === "completed" ? "text-green-400" :
                          ch.status === "directed" ? "text-blue-400" :
                          "text-zinc-600"
                        }>
                          {ch.status === "completed" ? "done" : ch.status === "directed" ? "narrating..." : "pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {status === "completed" && (
            <div className="text-center py-12 space-y-6">
              <div className="text-4xl">🎧</div>
              <p className="text-2xl font-semibold">Your audiobook is ready</p>

              {Object.keys(cast).length > 0 && (
                <div className="max-w-sm mx-auto">
                  <p className="text-xs text-zinc-500 mb-2">Voice Cast</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {Object.entries(cast).map(([char, voice]) => (
                      <span
                        key={char}
                        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs"
                      >
                        <span className="text-zinc-300">{char}</span>
                        <span className="text-zinc-600"> — {voiceName(voice)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Full audiobook player */}
              {audioUrl && chapters.length <= 1 && (
                <audio controls className="mx-auto" src={audioUrl}>
                  Your browser does not support the audio element.
                </audio>
              )}

              {/* Chapter list with individual players */}
              {chapters.length > 1 && (
                <div className="max-w-md mx-auto space-y-2 text-left">
                  <p className="text-xs text-zinc-500 mb-2 text-center">Chapters</p>
                  {chapters.map((ch) => (
                    <div
                      key={ch.index}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-200">{ch.title}</span>
                        <div className="flex items-center gap-2">
                          {ch.audio_url && (
                            <>
                              <button
                                onClick={() => setPlayingChapter(playingChapter === ch.index ? null : ch.index)}
                                className="text-xs px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
                              >
                                {playingChapter === ch.index ? "Hide" : "Play"}
                              </button>
                              <a
                                href={ch.audio_url}
                                download
                                className="text-xs px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
                              >
                                Download
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                      {playingChapter === ch.index && ch.audio_url && (
                        <audio controls className="w-full" src={ch.audio_url} autoPlay>
                          Your browser does not support the audio element.
                        </audio>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 justify-center">
                {audioUrl && (
                  <a
                    href={audioUrl}
                    download
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
                  >
                    {chapters.length > 1 ? "Download Full Audiobook" : "Download"}
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
    </main>
  );
}
