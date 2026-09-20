import Link from "next/link";

interface GameCardProps {
  slug: string;
  name: string;
  accentFrom: string;
  accentTo: string;
  playerCount: number;
  postCount: number;
  coverUrl?: string | null;
}

export default function GameCard({ slug, name, accentFrom, accentTo, playerCount, postCount, coverUrl }: GameCardProps) {
  return (
    <Link
      href={`/games/${slug}`}
      className="game-card glass-card flex flex-col justify-end h-48 relative overflow-hidden group"
      style={{ borderColor: `${accentFrom}55` }}
    >
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div
          className="absolute inset-0 opacity-40 group-hover:opacity-55 transition-opacity"
          style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      <div className="relative z-10 p-4">
        <h3 className="font-display text-lg drop-shadow">{name}</h3>
        <p className="text-xs text-white/70 mt-1">🔥 {playerCount} players online</p>
      </div>
      <div className="relative z-10 flex items-center justify-between text-xs text-white/80 px-4 pb-4">
        <span>📸 {postCount} posts</span>
        <span
          className="px-3 py-1 rounded-full font-semibold bg-gamer-gradient text-white shadow-glow"
        >
          Enter →
        </span>
      </div>
    </Link>
  );
}