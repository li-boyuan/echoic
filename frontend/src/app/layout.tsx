import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
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
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#3b82f6",
          colorBackground: "#18181b",
          colorText: "#f4f4f5",
          colorTextOnPrimaryBackground: "#ffffff",
          colorTextSecondary: "#a1a1aa",
          colorInputBackground: "#27272a",
          colorInputText: "#f4f4f5",
          colorNeutral: "#f4f4f5",
          colorDanger: "#ef4444",
        },
        elements: {
          card: { backgroundColor: "#18181b", borderColor: "#27272a" },
          headerTitle: { color: "#f4f4f5" },
          headerSubtitle: { color: "#a1a1aa" },
          socialButtonsBlockButton: { backgroundColor: "#27272a", color: "#f4f4f5", borderColor: "#3f3f46" },
          socialButtonsBlockButtonText: { color: "#f4f4f5" },
          formFieldLabel: { color: "#a1a1aa" },
          formFieldInput: { backgroundColor: "#27272a", color: "#f4f4f5", borderColor: "#3f3f46" },
          footerActionLink: { color: "#3b82f6" },
          footerActionText: { color: "#a1a1aa" },
          dividerLine: { backgroundColor: "#3f3f46" },
          dividerText: { color: "#71717a" },
          userButtonPopoverCard: { backgroundColor: "#18181b", borderColor: "#27272a" },
          userButtonPopoverActionButton: { color: "#f4f4f5" },
          userButtonPopoverActionButtonText: { color: "#f4f4f5" },
          userButtonPopoverFooter: { display: "none" },
        },
      }}
    >
      <html lang="en">
        <body className="bg-zinc-950 text-zinc-100 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
