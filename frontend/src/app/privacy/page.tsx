import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Echoic",
};

export default function Privacy() {
  return (
    <main className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <Link
          href="/"
          className="text-lg font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent"
        >
          Echoic
        </Link>
      </nav>

      <div className="flex-1 px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8 text-zinc-300 text-sm leading-relaxed">
          <h1 className="text-2xl font-semibold text-zinc-100">Privacy Policy</h1>
          <p className="text-xs text-zinc-500">Last updated: April 30, 2026</p>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-zinc-100">What We Collect</h2>
            <p>
              When you use Echoic, we may collect the following information:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-zinc-200">Account info</strong> — If you sign up via Clerk
                (our authentication provider), we receive your name and email address.
              </li>
              <li>
                <strong className="text-zinc-200">Uploaded files</strong> — Manuscripts you upload
                are processed to generate audiobooks. Files are not stored permanently and are
                deleted after processing.
              </li>
              <li>
                <strong className="text-zinc-200">Payment info</strong> — Payments are handled by
                Stripe. We do not store your credit card details. Stripe may collect information
                as described in their{" "}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  privacy policy
                </a>
                .
              </li>
              <li>
                <strong className="text-zinc-200">Usage data</strong> — We collect anonymous usage
                metrics (page views, feature usage) through Vercel Analytics to improve the product.
                Vercel Analytics does not use cookies.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-zinc-100">Cookies & Tracking</h2>
            <p>
              With your consent, we use the <strong className="text-zinc-200">Meta Pixel</strong>{" "}
              (Facebook) to measure advertising effectiveness. The Meta Pixel places cookies on
              your device and may collect information about your browsing activity across websites.
            </p>
            <p>
              You can accept or decline tracking cookies via the banner shown on your first visit.
              If you decline, the Meta Pixel will not be loaded and no tracking cookies will be set.
              You can change your preference at any time by clearing your browser&apos;s local storage
              for this site.
            </p>
            <p>
              For more information, see{" "}
              <a
                href="https://www.facebook.com/privacy/policy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                Meta&apos;s Privacy Policy
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-zinc-100">Third-Party Services</h2>
            <p>We use the following third-party services to operate Echoic:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-zinc-200">Clerk</strong> — Authentication</li>
              <li><strong className="text-zinc-200">Stripe</strong> — Payment processing</li>
              <li><strong className="text-zinc-200">Anthropic (Claude)</strong> — AI text analysis</li>
              <li><strong className="text-zinc-200">Google (Gemini)</strong> — AI text-to-speech</li>
              <li><strong className="text-zinc-200">Vercel</strong> — Hosting and analytics</li>
              <li><strong className="text-zinc-200">Meta</strong> — Advertising pixel (with consent)</li>
            </ul>
            <p>
              Each service has its own privacy policy governing how it handles your data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-zinc-100">Data Retention</h2>
            <p>
              Uploaded manuscripts and generated audio files are temporary and are not stored
              permanently. Account data is retained while your account is active. You can request
              deletion of your data by contacting us.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-zinc-100">Contact</h2>
            <p>
              If you have questions about this privacy policy, contact us at{" "}
              <a href="mailto:support@echoic.studio" className="text-blue-400 hover:underline">
                support@echoic.studio
              </a>
              .
            </p>
          </section>
        </div>
      </div>

      <footer className="border-t border-zinc-800 py-6 px-4 text-center text-xs text-zinc-600">
        echoic.studio — AI-powered audiobook generation
      </footer>
    </main>
  );
}
