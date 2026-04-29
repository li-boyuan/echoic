"use client";

import { useUser, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { useState, useEffect } from "react";
import { trackPricingView } from "@/lib/tracking";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "",
    description: "Try it out",
    features: ["1 free conversion", "Up to 5,000 words", "All voices included", "Auto character casting"],
    cta: "Get Started",
  },
  {
    id: "single",
    name: "Single Book",
    price: "$9.99",
    period: "",
    description: "Perfect for one book",
    features: ["1 book conversion", "Unlimited words", "All voices included", "Auto character casting", "Chapter splitting"],
    cta: "Buy Now",
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29.99",
    period: "/mo",
    description: "For power users",
    features: ["Unlimited conversions", "Unlimited words", "All voices included", "Auto character casting", "Chapter splitting", "Priority processing"],
    cta: "Subscribe",
  },
];

export default function Pricing() {
  const { user } = useUser();
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => { trackPricingView(); }, []);

  const handlePurchase = async (productId: string) => {
    if (!user) return;
    setLoading(productId);

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
            <h1 className="text-3xl font-bold">Simple pricing</h1>
            <p className="text-zinc-400">Pay only for what you need</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-6 space-y-4 relative"
              >
                {"popular" in plan && plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                    Most Popular
                  </span>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-zinc-100">{plan.name}</h3>
                  <p className="text-sm text-zinc-500">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-zinc-100">{plan.price}</span>
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
                        <SignInButton mode="modal">
                          <button className="w-full py-2.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded-lg font-medium text-sm transition-colors cursor-pointer">
                            {plan.cta}
                          </button>
                        </SignInButton>
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
