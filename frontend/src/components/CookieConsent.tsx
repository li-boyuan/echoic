"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

export default function CookieConsent() {
  const [consent, setConsent] = useState<"yes" | "no" | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("cookie_consent");
    if (stored === "yes" || stored === "no") {
      setConsent(stored);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "yes");
    setConsent("yes");
  };

  const decline = () => {
    localStorage.setItem("cookie_consent", "no");
    setConsent("no");
  };

  return (
    <>
      {consent === "yes" && FB_PIXEL_ID && (
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

      {consent === null && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
          <div className="max-w-2xl mx-auto bg-zinc-900 border border-zinc-700 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-lg">
            <p className="text-sm text-zinc-300 flex-1">
              We use cookies for analytics and to improve your experience.{" "}
              <Link href="/privacy" className="text-blue-400 hover:underline">
                Privacy Policy
              </Link>
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={decline}
                className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                Decline
              </button>
              <button
                onClick={accept}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
