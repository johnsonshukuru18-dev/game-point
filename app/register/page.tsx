"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  emoji: string;
  games: { id: string; name: string; slug: string }[];
}

const LOOKING_FOR_OPTIONS = ["Friends", "Battles", "Community", "Tips", "Tournaments"];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [playStyle, setPlayStyle] = useState<"CASUAL" | "COMPETITIVE" | "BOTH">("BOTH");
  const [lookingFor, setLookingFor] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/games")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  function toggleGame(id: string) {
    setSelectedGames((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  function toggleLookingFor(v: string) {
    setLookingFor((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        password,
        gameIds: selectedGames,
        playStyle,
        lookingFor: lookingFor.join(","),
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong");
      return;
    }
    router.push("/home");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card glow-border w-full max-w-xl p-8">
        <p className="font-display text-neon-cyan text-xs tracking-widest mb-2">STEP {step} / 4</p>
        <div className="w-full h-1 bg-white/10 rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-neon-blue to-neon-cyan transition-all" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        {error && <p className="text-neon-red text-sm mb-4">{error}</p>}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl mb-2">Create your account</h2>
            <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input placeholder="Password (min 8 characters)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button
              className="btn-neon w-full"
              disabled={!username || !email || password.length < 8}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-display text-xl mb-4">What games do you play?</h2>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div key={cat.id}>
                  <p className="text-xs text-white/60 mb-2">
                    {cat.emoji} {cat.name.replace("_", " ")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cat.games.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => toggleGame(g.id)}
                        className={`px-3 py-2 rounded-lg text-sm border ${
                          selectedGames.includes(g.id)
                            ? "bg-neon-blue/20 border-neon-blue text-neon-cyan"
                            : "border-white/10 text-white/70 hover:border-white/30"
                        }`}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {categories.length === 0 && <p className="text-xs text-white/40">Loading games…</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-ghost flex-1" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="btn-neon flex-1" disabled={selectedGames.length === 0} onClick={() => setStep(3)}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-display text-xl mb-4">What do you play?</h2>
            <div className="flex gap-3">
              {(["CASUAL", "COMPETITIVE", "BOTH"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setPlayStyle(v)}
                  className={`flex-1 py-3 rounded-lg border text-sm ${
                    playStyle === v ? "bg-neon-purple/20 border-neon-purple text-white" : "border-white/10 text-white/60"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-ghost flex-1" onClick={() => setStep(2)}>
                Back
              </button>
              <button className="btn-neon flex-1" onClick={() => setStep(4)}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="font-display text-xl mb-4">What are you looking for?</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {LOOKING_FOR_OPTIONS.map((v) => (
                <button
                  key={v}
                  onClick={() => toggleLookingFor(v)}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    lookingFor.includes(v) ? "bg-neon-green/20 border-neon-green text-neon-green" : "border-white/10 text-white/70"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button className="btn-ghost flex-1" onClick={() => setStep(3)}>
                Back
              </button>
              <button className="btn-neon flex-1" disabled={submitting} onClick={handleSubmit}>
                {submitting ? "Creating account…" : "Enter Game Point"}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-white/40 mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-neon-cyan">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
