export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* left panel — decorative */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-violet-100 via-purple-50 to-indigo-100 dark:from-violet-950 dark:via-purple-950 dark:to-indigo-950">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="font-semibold text-foreground">TaskApp</span>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground leading-tight">
              Organize your work,<br />
              <span className="text-primary">simplify your life.</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Track tasks, set priorities, and never miss a deadline again.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Tasks tracked", value: "10k+" },
              { label: "Teams using", value: "500+" },
              { label: "Uptime", value: "99.9%" },
              { label: "Integrations", value: "20+" },
            ].map((s) => (
              <div key={s.label} className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-xl p-4">
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">© 2026 TaskApp. All rights reserved.</p>
      </div>

      {/* right panel — form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
