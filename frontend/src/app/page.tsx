import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
          Echoic
        </span>
        <div className="flex items-center gap-3">
          <Link href="/pricing" className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            Pricing
          </Link>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-3">
              <Link
                href="/studio"
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                Studio
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
              Echoic
            </h1>
            <p className="text-2xl text-zinc-300">
              Turn any manuscript into a professional audiobook in minutes
            </p>
            <p className="text-lg text-zinc-500 max-w-lg mx-auto">
              AI reads your text, identifies characters, casts voices to match
              their personality, then narrates it with emotion and pacing.
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/studio"
              className="inline-block px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-lg transition-colors"
            >
              Try Free — No Sign-up Required
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="border-t border-zinc-800 py-16 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-200">AI-Directed</h3>
            <p className="text-sm text-zinc-500">
              An AI reads your text first and adds emotion, pacing, and dramatic
              beats — so the narration sounds natural, not robotic.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-200">Auto Character Casting</h3>
            <p className="text-sm text-zinc-500">
              AI identifies every character in your book and assigns each one a
              unique voice that matches their personality.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-200">24+ Languages</h3>
            <p className="text-sm text-zinc-500">
              Generate audiobooks in English, Chinese, Spanish, French, Japanese,
              Korean, Hindi, and many more languages.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="border-t border-zinc-800 py-16 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <h2 className="text-xl font-semibold text-zinc-200 text-center">FAQ</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-medium text-zinc-200">Where can I publish my audiobook?</h3>
              <p className="text-sm text-zinc-500">
                Your audiobook, your choice. Sell on your website, Gumroad, Google Play Books,
                Apple Books, Kobo, Spotify, or share directly with your readers. Please note
                that some platforms (e.g., Audible/ACX) may restrict AI-narrated content.
                Check each platform&apos;s policies before publishing.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-zinc-200">Do I own the audiobook?</h3>
              <p className="text-sm text-zinc-500">
                Yes. You retain full ownership of your manuscript and the generated audiobook.
                Echoic does not claim any rights to your content.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-zinc-200">What languages are supported?</h3>
              <p className="text-sm text-zinc-500">
                Echoic supports 26 languages including English, Chinese, Spanish, French,
                Japanese, Korean, Hindi, Arabic, Portuguese, Italian, Russian, and more.
                Each language has multiple voice options.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-zinc-200">Can I use copyrighted books?</h3>
              <p className="text-sm text-zinc-500">
                Echoic is designed for authors converting their own original works. You must
                have the rights to any content you upload. Do not upload copyrighted material
                you do not own or have permission to use.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-zinc-800 py-8 px-4">
        <p className="max-w-2xl mx-auto text-xs text-zinc-600 text-center leading-relaxed">
          Echoic provides AI-generated audio as a tool for content creators. The output is
          generated by third-party AI models and may contain imperfections. Echoic makes no
          guarantees regarding the suitability of generated audio for any specific platform
          or commercial purpose. Users are responsible for ensuring compliance with applicable
          laws, platform policies, and third-party rights before distributing generated content.
          By using Echoic, you confirm that you have the necessary rights to the content you upload.
        </p>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-6 px-4 text-center text-xs text-zinc-600 space-x-3">
        <span>echoic.studio — AI-powered audiobook generation</span>
        <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy Policy</Link>
      </footer>
    </main>
  );
}
