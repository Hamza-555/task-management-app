import Link from "next/link";

export default function RootPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">Task Management App</h1>
      <p className="text-foreground/60">Backend and database are live. Auth and UI coming next.</p>
      <div className="flex gap-3 mt-2">
        <a
          href={process.env.NEXT_PUBLIC_API_URL + "/health"}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded-md bg-brand-500 text-white text-sm hover:bg-brand-600 transition-colors"
        >
          Check API health
        </a>
        <Link
          href="/login"
          className="px-4 py-2 rounded-md border border-border text-sm hover:bg-foreground/5 transition-colors"
        >
          Go to login
        </Link>
      </div>
    </main>
  );
}
