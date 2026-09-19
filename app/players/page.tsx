"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PlayerCard from "@/components/PlayerCard";

function PlayersPageInner() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState("");
  const [game, setGame] = useState(searchParams.get("game") || "");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [games, setGames] = useState<{ slug: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/games")
      .then((r) => r.json())
      .then((cats) => setGames(cats.flatMap((c: any) => c.games)));
  }, []);

  function search() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (game) params.set("game", game);
    if (onlineOnly) params.set("onlineOnly", "true");
    fetch(`/api/players?${params.toString()}`)
      .then((r) => r.json())
      .then(setPlayers);
  }

  useEffect(search, [game, onlineOnly]);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8">
      <h1 className="text-2xl font-display mb-6">👥 Find Players</h1>

      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <input
          placeholder="Search by username or gamer tag…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <select value={game} onChange={(e) => setGame(e.target.value)}>
          <option value="">All games</option>
          {games.map((g) => (
            <option key={g.slug} value={g.slug}>
              {g.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm whitespace-nowrap px-2">
          <input type="checkbox" className="w-auto" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} />
          Online only
        </label>
        <button className="btn-neon text-sm" onClick={search}>
          Search
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((p) => (
          <PlayerCard
            key={p.id}
            id={p.id}
            username={p.username}
            displayName={p.profile?.displayName}
            gamerTag={p.profile?.gamerTag}
            status={p.profile?.status}
            wins={p.profile?.wins}
            losses={p.profile?.losses}
            games={p.userGames}
          />
        ))}
        {players.length === 0 && <p className="text-sm text-white/40">No players found.</p>}
      </div>
    </div>
  );
}

export default function PlayersPage() {
  return (
    <Suspense fallback={null}>
      <PlayersPageInner />
    </Suspense>
  );
}
