export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* left panel — always dark gradient, always light text */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="font-semibold text-white">TaskApp</span>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Organize your work,<br />
              <span className="text-violet-200">simplify your life.</span>
            </h1>
            <p className="text-violet-100/80 text-lg">
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
              <div key={s.label} className="bg-white/15 backdrop-blur rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-sm text-violet-100/70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-violet-100/50">© 2026 TaskApp. All rights reserved.</p>
      </div>

      {/* right panel — form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
