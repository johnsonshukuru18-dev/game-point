"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrUsername, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Login failed");
      return;
    }
    router.push(searchParams.get("next") || "/home");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="glass-card glow-border w-full max-w-sm p-8 space-y-4">
        <h1 className="font-display text-2xl text-center mb-2">
          GAME <span className="text-neon-cyan">POINT</span>
        </h1>
        {error && <p className="text-neon-red text-sm text-center">{error}</p>}
        <input placeholder="Email or username" value={emailOrUsername} onChange={(e) => setEmailOrUsername(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn-neon w-full" disabled={loading}>
          {loading ? "Logging in…" : "Log In"}
        </button>
        <p className="text-center text-xs text-white/40 mt-2">
          Demo account: <span className="text-white/60">demo1@gamepoint.demo</span> / <span className="text-white/60">Demo1234!</span>
        </p>
        <p className="text-center text-xs text-white/40">
          New here?{" "}
          <a href="/register" className="text-neon-cyan">
            Create an account
          </a>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
