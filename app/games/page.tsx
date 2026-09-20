"use client";
import { useEffect, useState } from "react";
import GameCard from "@/components/GameCard";

interface Category {
  id: string;
  name: string;
  emoji: string;
  games: {
    id: string;
    slug: string;
    name: string;
    accentFrom: string;
    accentTo: string;
    coverUrl: string | null;
    _count: { userGames: number; posts: number; battles: number };
  }[];
}

export default function GamesHubPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/games")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 pt-8">
      <p className="font-display text-neon-cyan text-xs tracking-widest">GAME HUBS</p>
      <h1 className="text-2xl font-display mb-8">Choose your battlefield.</h1>

      {categories.map((cat) => (
        <div key={cat.id} className="mb-10">
          <h2 className="text-lg font-display mb-4">
            {cat.emoji} {cat.name.replace("_", " ")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cat.games.map((g) => (
              <GameCard
                key={g.id}
                slug={g.slug}
                name={g.name}
                accentFrom={g.accentFrom}
                accentTo={g.accentTo}
                coverUrl={g.coverUrl}
                playerCount={g._count.userGames}
                postCount={g._count.posts}
              />
            ))}
          </div>
        </div>
      ))}
      {categories.length === 0 && <p className="text-sm text-white/40">Loading games…</p>}
    </div>
  );
}