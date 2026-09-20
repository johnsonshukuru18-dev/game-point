"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@/lib/useUser";
import PostCard from "@/components/PostCard";
import { uploadImageFile } from "@/lib/uploadClient";

export default function HomePage() {
  const { user } = useUser();
  const [feedFilter, setFeedFilter] = useState<"all" | "mine">("mine");
  const [posts, setPosts] = useState<any[]>([]);
  const [myGames, setMyGames] = useState<any[]>([]);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handlePickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submitPost() {
    if (!caption.trim()) return;
    setPosting(true);
    setUploadError("");
    try {
      let imageUrls: string[] = [];
      if (imageFile) {
        const url = await uploadImageFile(imageFile, "posts");
        imageUrls = [url];
      }
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, gameId: myGames[0]?.gameId, imageUrls }),
      });
      if (res.ok) {
        const newPost = await res.json();
        setPosts((prev) => [{ ...newPost, likeCount: 0, commentCount: 0, likedByMe: false, _count: { likes: 0, comments: 0 } }, ...prev]);
        setCaption("");
        clearImage();
      } else {
        const data = await res.json().catch(() => ({}));
        setUploadError(data.error || "Could not create post");
      }
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setPosting(false);
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
        {imagePreview && (
          <div className="relative mt-2 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Selected" className="rounded-lg h-32 object-cover" />
            <button
              onClick={clearImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center"
              title="Remove image"
            >
              ×
            </button>
          </div>
        )}
        {uploadError && <p className="text-neon-red text-xs mt-2">{uploadError}</p>}
        <div className="flex justify-between items-center mt-2">
          <label className="btn-ghost text-xs cursor-pointer">
            📷 Add photo
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePickImage} className="hidden" />
          </label>
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