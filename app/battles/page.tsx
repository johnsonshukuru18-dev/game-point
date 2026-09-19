"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/lib/useUser";
import BattleCard from "@/components/BattleCard";

interface Category {
  games: { id: string; slug: string; name: string }[];
}

function BattlesPageInner() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [battles, setBattles] = useState<any[]>([]);
  const [games, setGames] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [showCreate, setShowCreate] = useState(searchParams.get("create") === "1");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  const [gameId, setGameId] = useState(searchParams.get("gameId") || "");
  const [mode, setMode] = useState("1v1");
  const [platform, setPlatform] = useState("Mobile");
  const [skillLevel, setSkillLevel] = useState<"CASUAL" | "INTERMEDIATE" | "COMPETITIVE">("CASUAL");
  const [creating, setCreating] = useState(false);

  function loadBattles() {
    fetch("/api/battles").then((r) => r.json()).then(setBattles);
  }

  useEffect(() => {
    fetch("/api/games")
      .then((r) => r.json())
      .then((cats: Category[]) => {
        const all = cats.flatMap((c) => c.games);
        setGames(all);
        if (!gameId && all[0]) setGameId(all[0].id);
      });
    loadBattles();
  }, []);

  async function handleCreate() {
    setCreating(true);
    const targetUserId = searchParams.get("targetUserId") || undefined;
    const res = await fetch("/api/battles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, mode, platform, skillLevel, targetUserId }),
    });
    setCreating(false);
    if (res.ok) {
      setShowCreate(false);
      loadBattles();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Could not create battle");
    }
  }

  async function handleJoinByCode() {
    setJoinError("");
    if (!joinCode.trim()) return;
    // Find a WAITING battle by hitting join on a placeholder id; the API resolves by code.
    const res = await fetch(`/api/battles/placeholder/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: joinCode.trim().toUpperCase() }),
    });
    if (res.ok) {
      setJoinCode("");
      loadBattles();
    } else {
      const data = await res.json().catch(() => ({}));
      setJoinError(data.error || "Could not join battle");
    }
  }

  async function handleJoin(id: string) {
    const res = await fetch(`/api/battles/${id}/join`, { method: "POST" });
    if (res.ok) loadBattles();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Could not join");
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-display">⚔ Battle Mode</h1>
        <button className="btn-neon text-sm" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Cancel" : "+ Create Battle"}
        </button>
      </div>

      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <input
          placeholder="Enter Battle Code (e.g. EF-7K92X)"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          className="flex-1"
        />
        <button className="btn-ghost text-sm whitespace-nowrap" onClick={handleJoinByCode}>
          JOIN
        </button>
      </div>
      {joinError && <p className="text-neon-red text-xs mb-4">{joinError}</p>}

      {showCreate && (
        <div className="glass-card p-5 mb-6 space-y-3">
          <h2 className="font-display text-sm mb-2">Create Battle</h2>
          <select value={gameId} onChange={(e) => setGameId(e.target.value)}>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option>1v1</option>
              <option>2v2</option>
              <option>Squad</option>
            </select>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option>Mobile</option>
              <option>PC</option>
              <option>PlayStation</option>
              <option>Xbox</option>
            </select>
          </div>
          <select value={skillLevel} onChange={(e) => setSkillLevel(e.target.value as any)}>
            <option value="CASUAL">Casual</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="COMPETITIVE">Competitive</option>
          </select>
          <button className="btn-neon w-full" disabled={creating || !gameId} onClick={handleCreate}>
            {creating ? "Generating battle code…" : "Generate Code & Create"}
          </button>
        </div>
      )}

      <h2 className="font-display text-sm mb-3 text-white/60">ALL BATTLES</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {battles.map((b) => (
          <BattleCard
            key={b.id}
            id={b.id}
            code={b.code}
            gameName={b.game.name}
            mode={b.mode}
            platform={b.platform}
            skillLevel={b.skillLevel}
            status={b.status}
            participants={b.participants}
            currentUserId={user?.id}
            onJoin={() => handleJoin(b.id)}
          />
        ))}
        {battles.length === 0 && <p className="text-sm text-white/40">No battles yet — create the first one.</p>}
      </div>
    </div>
  );
}

export default function BattlesPage() {
  return (
    <Suspense fallback={null}>
      <BattlesPageInner />
    </Suspense>
  );
}
