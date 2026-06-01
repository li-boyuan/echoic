"use client";

import { useState, useRef } from "react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { useI18n } from "@/lib/i18n";

const DEMO_VOICES = [
  { id: "Kore", label: "Kore (F)" },
  { id: "Charon", label: "Charon (M)" },
  { id: "Leda", label: "Leda (F)" },
  { id: "Puck", label: "Puck (M)" },
];

function TryItNow() {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("Kore");
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generate = async () => {
    if (text.trim().length < 10) return;
    setLoading(true);
    setError(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);

    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), voice }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to generate");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-20 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-zinc-100">{t("tryit.title")}</h2>
          <p className="text-zinc-400">{t("tryit.desc")}</p>
        </div>
        <div className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("tryit.placeholder")}
            className="w-full h-28 bg-zinc-900 border-2 border-zinc-700 rounded-xl p-4 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:border-blue-500 focus:outline-none"
            maxLength={500}
          />
          <div className="flex items-center gap-3">
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 cursor-pointer"
            >
              {DEMO_VOICES.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
            <button
              onClick={generate}
              disabled={loading || text.trim().length < 10}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
            >
              {loading ? t("tryit.generating") : t("tryit.listen")}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          {audioUrl && (
            <audio ref={audioRef} controls className="w-full" src={audioUrl} autoPlay />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
          Echoic
        </span>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Link href="/pricing" className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            {t("nav.pricing")}
          </Link>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
                {t("nav.signIn")}
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-3">
              <Link
                href="/studio"
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                {t("nav.studio")}
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>
      </nav>

      {/* Hero — tight, single CTA */}
      <div className="flex flex-col items-center justify-center px-4 pt-12 pb-8">
        <div className="max-w-3xl w-full space-y-6 text-center">
          <p className="text-sm font-medium text-blue-400 tracking-wide uppercase">
            {t("hero.badge")}
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-zinc-100 leading-tight">
            {t("hero.title")}
          </h1>
          <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
            {t("hero.subtitle")}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignedOut>
              <Link
                href="/studio"
                className="inline-block px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-lg transition-colors"
              >
                {t("hero.cta")}
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/studio"
                className="inline-block px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-lg transition-colors"
              >
                {t("hero.ctaSignedIn")}
              </Link>
            </SignedIn>
          </div>
          <p className="text-sm text-zinc-500">{t("hero.ctaSub")}</p>
        </div>
      </div>

      {/* Real Chapter Demo — first thing after hero, the proof point */}
      <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">{t("demo.title")}</h2>
          <p className="text-zinc-400">{t("demo.desc")}</p>
          <div className="bg-gradient-to-b from-zinc-900 to-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <audio controls className="w-full" src="/demo.mp3" />
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <p className="text-xs uppercase tracking-wide text-zinc-500">{t("demo.cast.label")}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-xs">
                  <span className="text-zinc-300">{t("demo.cast.narrator")}</span>
                  <span className="text-zinc-500"> — Kore</span>
                </span>
                <span className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-xs">
                  <span className="text-zinc-300">{t("demo.cast.oldman")}</span>
                  <span className="text-zinc-500"> — Charon</span>
                </span>
                <span className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-xs">
                  <span className="text-zinc-300">{t("demo.cast.granddaughter")}</span>
                  <span className="text-zinc-500"> — Leda</span>
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 text-left leading-relaxed italic pt-2">
              {t("demo.text")}
            </p>
          </div>
          <p className="text-xs text-zinc-600">{t("demo.note")}</p>
        </div>
      </div>

      {/* Where you can publish — addresses #1 objection */}
      <div className="py-14 px-4 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-bold text-zinc-100">{t("publish.title")}</h2>
          <p className="text-zinc-400 max-w-xl mx-auto">{t("publish.desc")}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            {[
              "publish.platform.google",
              "publish.platform.apple",
              "publish.platform.kobo",
              "publish.platform.spotify",
              "publish.platform.gumroad",
              "publish.platform.direct",
            ].map((k) => (
              <div
                key={k}
                className="px-3 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-medium text-zinc-300"
              >
                {t(k)}
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 max-w-xl mx-auto pt-2">{t("publish.note")}</p>
        </div>
      </div>

      {/* Try It Now — moved up to capture intent */}
      <TryItNow />

      {/* How it Works */}
      <div className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto space-y-12">
          <h2 className="text-2xl font-bold text-zinc-100 text-center">{t("how.title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 mx-auto bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-2xl">
                1
              </div>
              <h3 className="font-semibold text-zinc-200">{t("how.step1.title")}</h3>
              <p className="text-sm text-zinc-500">{t("how.step1.desc")}</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-14 h-14 mx-auto bg-violet-600/20 border border-violet-500/30 rounded-2xl flex items-center justify-center text-2xl">
                2
              </div>
              <h3 className="font-semibold text-zinc-200">{t("how.step2.title")}</h3>
              <p className="text-sm text-zinc-500">{t("how.step2.desc")}</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-14 h-14 mx-auto bg-emerald-600/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-2xl">
                3
              </div>
              <h3 className="font-semibold text-zinc-200">{t("how.step3.title")}</h3>
              <p className="text-sm text-zinc-500">{t("how.step3.desc")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cost anchor + at-a-glance stats — replaces the bare stats wall */}
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10">
            <div className="flex items-center gap-2">
              <span className="text-zinc-600 line-through text-lg">{t("hero.oldCost")}</span>
              <span className="text-zinc-500 text-sm">{t("hero.oldCostLabel")}</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-zinc-700" />
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-emerald-400">{t("hero.newCost")}</span>
              <span className="text-zinc-400">{t("hero.newCostLabel")}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center pt-4 border-t border-zinc-800">
            <div>
              <p className="text-2xl font-bold text-zinc-100">{t("proof.stat1.value")}</p>
              <p className="text-xs text-zinc-500">{t("proof.stat1.label")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">{t("proof.stat2.value")}</p>
              <p className="text-xs text-zinc-500">{t("proof.stat2.label")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">{t("proof.stat3.value")}</p>
              <p className="text-xs text-zinc-500">{t("proof.stat3.label")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">{t("proof.stat4.value")}</p>
              <p className="text-xs text-zinc-500">{t("proof.stat4.label")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto space-y-12">
          <h2 className="text-2xl font-bold text-zinc-100 text-center">{t("features.title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center text-lg">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-200">{t("features.directed.title")}</h3>
              <p className="text-sm text-zinc-500">{t("features.directed.desc")}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 bg-violet-600/20 border border-violet-500/30 rounded-xl flex items-center justify-center text-lg">
                <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-200">{t("features.casting.title")}</h3>
              <p className="text-sm text-zinc-500">{t("features.casting.desc")}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 bg-emerald-600/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-lg">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-200">{t("features.languages.title")}</h3>
              <p className="text-sm text-zinc-500">{t("features.languages.desc")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Founder Note — replaces fake social proof; builds personal trust */}
      <div className="py-14 px-4 bg-zinc-900/40">
        <div className="max-w-xl mx-auto text-center space-y-4">
          <p className="text-zinc-200 leading-relaxed">{t("founder.message")}</p>
          <p className="text-sm text-zinc-500">
            {t("founder.byline")} ·{" "}
            <a
              href="mailto:hello@echoic.studio"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              hello@echoic.studio
            </a>
          </p>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-zinc-100">{t("cta.title")}</h2>
          <p className="text-zinc-400">{t("cta.desc")}</p>
          <SignedOut>
            <Link
              href="/studio"
              className="inline-block px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-lg transition-colors"
            >
              {t("hero.cta")}
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/studio"
              className="inline-block px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-lg transition-colors"
            >
              {t("hero.ctaSignedIn")}
            </Link>
          </SignedIn>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-16 px-4 bg-zinc-900/50">
        <div className="max-w-2xl mx-auto space-y-8">
          <h2 className="text-2xl font-bold text-zinc-100 text-center">{t("faq.title")}</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-medium text-zinc-200">{t("faq.publish.q")}</h3>
              <p className="text-sm text-zinc-500">{t("faq.publish.a")}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-zinc-200">{t("faq.own.q")}</h3>
              <p className="text-sm text-zinc-500">{t("faq.own.a")}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-zinc-200">{t("faq.languages.q")}</h3>
              <p className="text-sm text-zinc-500">{t("faq.languages.a")}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-zinc-200">{t("faq.copyright.q")}</h3>
              <p className="text-sm text-zinc-500">{t("faq.copyright.a")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="py-8 px-4">
        <p className="max-w-2xl mx-auto text-xs text-zinc-600 text-center leading-relaxed">
          {t("disclaimer")}
        </p>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-6 px-4 text-center text-xs text-zinc-600 space-x-3">
        <span>{t("footer.tagline")}</span>
        <Link href="/privacy" className="hover:text-zinc-400 transition-colors">{t("footer.privacy")}</Link>
      </footer>
    </main>
  );
}
