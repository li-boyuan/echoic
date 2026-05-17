"use client";

import { useUser, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { useState, useEffect } from "react";
import { trackInitiateCheckout, trackPricingView } from "@/lib/tracking";

const PLANS = [
  {
    id: "free",
    name: "Free Sample",
    price: "$0",
    period: "",
    description: "Test your book's voice",
    features: ["1 short sample", "Up to 500 words", "All voices included", "Auto character casting", "No credit card required"],
    cta: "Create Sample",
  },
  {
    id: "single",
    name: "Single Book",
    price: "$9.99",
    period: "",
    description: "Best for one finished audiobook",
    features: ["1 full audiobook", "Unlimited words", "All voices included", "Auto character casting", "Chapter splitting", "Commercial use for content you own", "Email notification when done", "Conversion history"],
    cta: "Convert One Book",
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$14.99",
    originalPrice: "$29.99",
    period: "/first month",
    description: "For authors with a catalog",
    features: ["Unlimited full audiobooks", "Unlimited words", "Most powerful AI model", "Auto character casting", "Chapter splitting", "Commercial use for content you own", "Email notification when done", "Priority processing"],
    cta: "Go Pro - 50% Off",
    promo: true,
  },
];

const CHECKOUT_VALUES: Record<string, number> = {
  single: 9.99,
  pro: 14.99,
};

export default function Pricing() {
  const { user } = useUser();
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => { trackPricingView(); }, []);

  const handlePurchase = async (productId: string) => {
    if (!user) return;
    setLoading(productId);
    trackInitiateCheckout(productId, CHECKOUT_VALUES[productId] ?? 0);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: productId, user_id: user.id }),
      });

      if (!res.ok) throw new Error("Failed to create checkout");

      const { checkout_url } = await res.json();
      window.location.href = checkout_url;
    } catch {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-lg font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent"
        >
          Echoic
        </Link>
        <SignedIn>
          <Link
            href="/studio"
            className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Back to Studio
          </Link>
        </SignedIn>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Start with a sample. Pay for the full book.</h1>
            <p className="text-zinc-400">
              Hear your first pages for free, then turn the entire manuscript into a downloadable audiobook.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-zinc-100">$2,000+</p>
              <p className="text-xs text-zinc-500">typical studio narration</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-zinc-100">$9.99</p>
              <p className="text-xs text-zinc-500">one Echoic audiobook</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-zinc-100">26 languages</p>
              <p className="text-xs text-zinc-500">voices and character casting</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`bg-zinc-900 border-2 rounded-2xl p-6 space-y-4 relative ${
                  "promo" in plan && plan.promo
                    ? "border-violet-500"
                    : "border-zinc-800"
                }`}
              >
                {"popular" in plan && plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                    Most Popular
                  </span>
                )}
                {"promo" in plan && plan.promo && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-violet-600 text-white text-xs font-medium rounded-full">
                    50% Off First Month
                  </span>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-zinc-100">{plan.name}</h3>
                  <p className="text-sm text-zinc-500">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-zinc-100">{plan.price}</span>
                  {"originalPrice" in plan && plan.originalPrice && (
                    <span className="text-lg text-zinc-600 line-through">{plan.originalPrice}</span>
                  )}
                  {plan.period && (
                    <span className="text-zinc-500 text-sm">{plan.period}</span>
                  )}
                </div>

                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-zinc-400 flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="pt-2">
                  {plan.id === "free" ? (
                    <>
                      <SignedOut>
                        <Link
                          href="/studio"
                          className="block w-full py-2.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded-lg font-medium text-sm transition-colors text-center"
                        >
                          {plan.cta}
                        </Link>
                      </SignedOut>
                      <SignedIn>
                        <Link
                          href="/studio"
                          className="block w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-colors text-center"
                        >
                          Go to Studio
                        </Link>
                      </SignedIn>
                    </>
                  ) : (
                    <>
                      <SignedOut>
                        <SignInButton mode="modal">
                          <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-colors cursor-pointer">
                            {plan.cta}
                          </button>
                        </SignInButton>
                      </SignedOut>
                      <SignedIn>
                        <button
                          onClick={() => handlePurchase(plan.id)}
                          disabled={loading === plan.id}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {loading === plan.id ? "Redirecting..." : plan.cta}
                        </button>
                      </SignedIn>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t border-zinc-800 py-6 px-4 text-center text-xs text-zinc-600">
        echoic.studio — AI-powered audiobook generation
      </footer>
    </main>
  );
}
