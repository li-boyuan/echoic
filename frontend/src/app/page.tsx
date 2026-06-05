export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
          Echoic
        </h1>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-zinc-100">
            Echoic is paused
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            New conversions are paused while I figure out what&apos;s next.
            If you previously converted a book and need your files,
            email me and I&apos;ll send them over.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            Want to be notified if Echoic restarts? Drop me a line.
          </p>
        </div>

        <div className="pt-2">
          <a
            href="mailto:hello@echoic.studio"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors"
          >
            hello@echoic.studio
          </a>
        </div>

        <p className="text-xs text-zinc-500 pt-6">
          — Boyuan
        </p>
      </div>
    </main>
  );
}
