"use client";

import Link from "next/link";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { useI18n } from "@/lib/i18n";

export default function Privacy() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <Link
          href="/"
          className="text-lg font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent"
        >
          Echoic
        </Link>
        <LocaleSwitcher />
      </nav>

      <div className="flex-1 px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8 text-zinc-300 text-sm leading-relaxed">
          <h1 className="text-2xl font-semibold text-zinc-100">{t("privacy.title")}</h1>
          <p className="text-xs text-zinc-500">{t("privacy.updated")}</p>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-zinc-100">{t("privacy.collect.title")}</h2>
            <p>{t("privacy.collect.intro")}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-zinc-200">Account info</strong> — {t("privacy.collect.account")}
              </li>
              <li>
                <strong className="text-zinc-200">Uploaded files</strong> — {t("privacy.collect.files")}
              </li>
              <li>
                <strong className="text-zinc-200">Payment info</strong> — {t("privacy.collect.payment")}
              </li>
              <li>
                <strong className="text-zinc-200">Usage data</strong> — {t("privacy.collect.usage")}
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-zinc-100">{t("privacy.cookies.title")}</h2>
            <p>{t("privacy.cookies.pixel")}</p>
            <p>{t("privacy.cookies.control")}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-zinc-100">{t("privacy.thirdparty.title")}</h2>
            <p>{t("privacy.thirdparty.intro")}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-zinc-200">Clerk</strong> — Authentication</li>
              <li><strong className="text-zinc-200">Stripe</strong> — Payment processing</li>
              <li><strong className="text-zinc-200">Anthropic (Claude)</strong> — AI text analysis</li>
              <li><strong className="text-zinc-200">Google (Gemini)</strong> — AI text-to-speech</li>
              <li><strong className="text-zinc-200">Vercel</strong> — Hosting and analytics</li>
              <li><strong className="text-zinc-200">Meta</strong> — Advertising pixel</li>
            </ul>
            <p>{t("privacy.thirdparty.each")}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-zinc-100">{t("privacy.retention.title")}</h2>
            <p>{t("privacy.retention.text")}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-zinc-100">{t("privacy.contact.title")}</h2>
            <p>
              {t("privacy.contact.text")}{" "}
              <a href="mailto:support@echoic.studio" className="text-blue-400 hover:underline">
                support@echoic.studio
              </a>
              .
            </p>
          </section>
        </div>
      </div>

      <footer className="border-t border-zinc-800 py-6 px-4 text-center text-xs text-zinc-600">
        {t("footer.tagline")}
      </footer>
    </main>
  );
}
