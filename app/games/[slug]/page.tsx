"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import PlayerCard from "@/components/PlayerCard";
import BattleCard from "@/components/BattleCard";
import { useUser } from "@/lib/useUser";

export default function GameHubPage({ params }: { params: { slug: string } }) {
  const { user } = useUser();
  const [game, setGame] = useState<any>(null);
  const [tab, setTab] = useState<"feed" | "battles" | "players">("feed");
  const [posts, setPosts] = useState<any[]>([]);
  const [battles, setBattles] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/games")
      .then((r) => r.json())
      .then((cats) => {
        for (const c of cats) {
          const found = c.games.find((g: any) => g.slug === params.slug);
          if (found) setGame({ ...found, categoryName: c.name });
        }
      });
  }, [params.slug]);

  useEffect(() => {
    fetch(`/api/posts?game=${params.slug}`)
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []));
    fetch(`/api/battles?game=${params.slug}&status=WAITING`)
      .then((r) => r.json())
      .then(setBattles);
    fetch(`/api/players?game=${params.slug}`)
      .then((r) => r.json())
      .then(setPlayers);
  }, [params.slug]);

  async function handleJoin(battleId: string) {
    const res = await fetch(`/api/battles/${battleId}/join`, { method: "POST" });
    if (res.ok) {
      setBattles((prev) => prev.filter((b) => b.id !== battleId));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Could not join battle");
    }
  }

  if (!game) return <div className="max-w-4xl mx-auto px-4 pt-8 text-white/40">Loading game hub…</div>;

  const topPlayers = [...players].sort((a, b) => (b.profile?.wins || 0) - (a.profile?.wins || 0)).slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8">
      <div
        className="glass-card p-6 mb-6 relative overflow-hidden"
        style={{ borderColor: `${game.accentFrom}55` }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: `linear-gradient(135deg, ${game.accentFrom}, ${game.accentTo})` }}
        />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-white/50">{game.categoryName?.replace("_", " ")} HUB</p>
            <h1 className="text-3xl font-display">{game.name}</h1>
            <p className="text-xs text-white/60 mt-1">🔥 {game._count?.userGames ?? players.length} players on Game Point</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/battles?gameId=${game.id}&gameSlug=${game.slug}&create=1`} className="btn-neon text-sm">
              ⚔ Battle
            </Link>
            <Link href={`/players?game=${game.slug}`} className="btn-ghost text-sm">
              👥 Find Players
            </Link>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(["feed", "battles", "players"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`btn-ghost text-xs capitalize ${tab === t ? "border-neon-cyan text-neon-cyan" : ""}`}
          >
            {t === "feed" ? "📸 Community" : t === "battles" ? "⚔ Challenges" : "🏆 Top Players"}
          </button>
        ))}
      </div>

      {tab === "feed" && (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              id={p.id}
              userId={p.user.id}
              username={p.user.username}
              displayName={p.user.profile?.displayName}
              gameName={p.game?.name}
              caption={p.caption}
              images={p.images}
              likeCount={p._count?.likes ?? 0}
              commentCount={p._count?.comments ?? 0}
              likedByMe={p.likedByMe}
              createdAt={p.createdAt}
              onDeleted={() => setPosts((prev) => prev.filter((post) => post.id !== p.id))}
            />
          ))}
          {posts.length === 0 && <p className="text-sm text-white/40">No posts for {game.name} yet.</p>}
        </div>
      )}

      {tab === "battles" && (
        <div className="grid sm:grid-cols-2 gap-4">
          {battles.map((b) => (
            <BattleCard
              key={b.id}
              id={b.id}
              code={b.code}
              gameName={game.name}
              mode={b.mode}
              platform={b.platform}
              skillLevel={b.skillLevel}
              status={b.status}
              participants={b.participants}
              currentUserId={user?.id}
              onJoin={() => handleJoin(b.id)}
            />
          ))}
          {battles.length === 0 && <p className="text-sm text-white/40">No open challenges right now — create one!</p>}
        </div>
      )}

      {tab === "players" && (
        <div>
          <p className="text-xs text-white/50 mb-3">🏆 TOP PLAYERS (platform rankings, not official leaderboards)</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {topPlayers.map((p) => (
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
            {topPlayers.length === 0 && <p className="text-sm text-white/40">No players yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}