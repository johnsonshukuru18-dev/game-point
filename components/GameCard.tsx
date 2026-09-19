import Link from "next/link";

interface GameCardProps {
  slug: string;
  name: string;
  accentFrom: string;
  accentTo: string;
  playerCount: number;
  postCount: number;
}

export default function GameCard({ slug, name, accentFrom, accentTo, playerCount, postCount }: GameCardProps) {
  return (
    <Link
      href={`/games/${slug}`}
      className="game-card glass-card p-5 flex flex-col justify-between h-40 relative overflow-hidden group"
      style={{ borderColor: `${accentFrom}55` }}
    >
      <div
        className="absolute inset-0 opacity-20 group-hover:opacity-35 transition-opacity"
        style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}
      />
      <div className="relative z-10">
        <h3 className="font-display text-lg">{name}</h3>
        <p className="text-xs text-white/60 mt-1">🔥 {playerCount} players on Game Point</p>
      </div>
      <div className="relative z-10 flex items-center justify-between text-xs text-white/70">
        <span>📸 {postCount} posts</span>
        <span
          className="px-3 py-1 rounded-full font-semibold"
          style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`, color: "#051019" }}
        >
          Enter →
        </span>
      </div>
    </Link>
  );
}
