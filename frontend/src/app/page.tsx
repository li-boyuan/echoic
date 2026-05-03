"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { useI18n } from "@/lib/i18n";

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

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              {t("hero.title")}
            </h1>
            <p className="text-2xl text-zinc-300">
              {t("hero.subtitle")}
            </p>
            <p className="text-lg text-zinc-500 max-w-lg mx-auto">
              {t("hero.description")}
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/studio"
              className="inline-block px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-lg transition-colors"
            >
              {t("hero.cta")}
            </Link>
          </div>
        </div>
      </div>

      {/* Audio Demo */}
      <div className="border-t border-zinc-800 py-16 px-4">
        <div className="max-w-xl mx-auto text-center space-y-4">
          <h2 className="text-xl font-semibold text-zinc-200">{t("demo.title")}</h2>
          <p className="text-sm text-zinc-500">{t("demo.desc")}</p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
            <p className="text-xs text-zinc-600 text-left leading-relaxed italic">
              {t("demo.text")}
            </p>
            <audio controls className="w-full" src="/demo.wav" />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="border-t border-zinc-800 py-16 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-200">{t("features.directed.title")}</h3>
            <p className="text-sm text-zinc-500">{t("features.directed.desc")}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-200">{t("features.casting.title")}</h3>
            <p className="text-sm text-zinc-500">{t("features.casting.desc")}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-200">{t("features.languages.title")}</h3>
            <p className="text-sm text-zinc-500">{t("features.languages.desc")}</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="border-t border-zinc-800 py-16 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <h2 className="text-xl font-semibold text-zinc-200 text-center">{t("faq.title")}</h2>
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
      <div className="border-t border-zinc-800 py-8 px-4">
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
