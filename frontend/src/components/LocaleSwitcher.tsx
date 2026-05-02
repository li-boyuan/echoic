"use client";

import { useI18n, Locale } from "@/lib/i18n";

const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
];

export default function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 cursor-pointer"
    >
      {LOCALES.map((l) => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  );
}
