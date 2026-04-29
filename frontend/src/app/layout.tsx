import type { Metadata } from "next";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

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
        <head>
          {FB_PIXEL_ID && (
            <>
              <Script id="fb-pixel" strategy="afterInteractive">
                {`
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${FB_PIXEL_ID}');
                  fbq('track', 'PageView');
                `}
              </Script>
              <noscript>
                <img
                  height="1"
                  width="1"
                  style={{ display: "none" }}
                  src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
                  alt=""
                />
              </noscript>
            </>
          )}
        </head>
        <body className="bg-zinc-950 text-zinc-100 antialiased">
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
