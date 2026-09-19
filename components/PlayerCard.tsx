import Link from "next/link";

interface PlayerCardProps {
  id: string;
  username: string;
  displayName?: string | null;
  gamerTag?: string | null;
  status?: string;
  wins?: number;
  losses?: number;
  games: { game: { name: string } }[];
}

export default function PlayerCard({ id, username, displayName, gamerTag, status, wins = 0, losses = 0, games }: PlayerCardProps) {
  const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : null;
  return (
    <div className="glass-card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center font-display text-sm">
          {(displayName || username).slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-sm flex items-center gap-1">
            {displayName || username}
            {status === "ONLINE" && <span className="w-2 h-2 rounded-full bg-neon-green inline-block" />}
          </p>
          <p className="text-xs text-white/50">{gamerTag ? `#${gamerTag}` : `@${username}`}</p>
        </div>
      </div>
      <p className="text-xs text-white/60">{games.map((g) => g.game.name).join(", ") || "No games listed yet"}</p>
      {winRate !== null && <p className="text-xs text-white/50">{winRate}% win rate · {wins}W / {losses}L</p>}
      <div className="flex gap-2 mt-1">
        <Link href={`/profile/${id}`} className="btn-ghost text-xs px-3 py-1">
          View Profile
        </Link>
      </div>
    </div>
  );
}
