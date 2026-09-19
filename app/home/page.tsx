"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/lib/useUser";
import PostCard from "@/components/PostCard";

export default function HomePage() {
  const { user } = useUser();
  const [feedFilter, setFeedFilter] = useState<"all" | "mine">("mine");
  const [posts, setPosts] = useState<any[]>([]);
  const [myGames, setMyGames] = useState<any[]>([]);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/users/${user.id}`)
      .then((r) => r.json())
      .then((data) => setMyGames(data.userGames || []));
  }, [user]);

  useEffect(() => {
    const qs = feedFilter === "mine" ? "?myGames=true" : "";
    fetch(`/api/posts${qs}`)
      .then((r) => r.json())
      .then((data) => setPosts(data.posts || []));
  }, [feedFilter]);

  async function submitPost() {
    if (!caption.trim()) return;
    setPosting(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption, gameId: myGames[0]?.gameId }),
    });
    setPosting(false);
    if (res.ok) {
      const newPost = await res.json();
      setPosts((prev) => [{ ...newPost, likeCount: 0, commentCount: 0, likedByMe: false, _count: { likes: 0, comments: 0 } }, ...prev]);
      setCaption("");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8">
      <p className="font-display text-neon-cyan text-xs tracking-widest">GAME MODE</p>
      <h1 className="text-2xl font-display mb-6">Welcome back, {user?.profile?.displayName || user?.username || "Gamer"}.</h1>

      <div className="glass-card p-4 mb-4">
        <p className="text-xs text-white/50 mb-2">YOUR GAMES</p>
        <div className="flex flex-wrap gap-2">
          {myGames.map((ug: any) => (
            <Link key={ug.gameId} href={`/games/${ug.game.slug}`} className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 hover:border-neon-cyan/50">
              {ug.game.name}
            </Link>
          ))}
          {myGames.length === 0 && (
            <p className="text-xs text-white/40">
              You haven&apos;t selected any games yet.{" "}
              <Link href="/games" className="text-neon-cyan">
                Browse games
              </Link>
            </p>
          )}
        </div>
      </div>

      <div className="glass-card p-4 mb-6">
        <textarea
          placeholder="Share an achievement, clip, or tip…"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={2}
        />
        <div className="flex justify-end mt-2">
          <button className="btn-neon text-sm" disabled={posting || !caption.trim()} onClick={submitPost}>
            {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setFeedFilter("mine")} className={`btn-ghost text-xs ${feedFilter === "mine" ? "border-neon-cyan text-neon-cyan" : ""}`}>
          My Games
        </button>
        <button onClick={() => setFeedFilter("all")} className={`btn-ghost text-xs ${feedFilter === "all" ? "border-neon-cyan text-neon-cyan" : ""}`}>
          All Games
        </button>
      </div>

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
        {posts.length === 0 && <p className="text-sm text-white/40 text-center py-10">No posts yet — be the first to share something.</p>}
      </div>
    </div>
  );
}