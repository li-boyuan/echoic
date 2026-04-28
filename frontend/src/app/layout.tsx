import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Echoic — AI Audiobook Studio",
  description: "Turn manuscripts into audiobooks with AI-powered narration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
