"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/useUser";
import PostCard from "@/components/PostCard";

export default function ProfilePage({ params }: { params: { id: string } }) {
  const { user } = useUser();
  const router = useRouter();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [tab, setTab] = useState<"posts" | "games">("posts");
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [gamerTag, setGamerTag] = useState("");
  const [saving, setSaving] = useState(false);

  const isOwnProfile = user?.id === params.id;

  function load() {
    fetch(`/api/users/${params.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setProfileUser(data);
        if (data?.profile) {
          setBio(data.profile.bio || "");
          setGamerTag(data.profile.gamerTag || "");
        }
      });
  }

  useEffect(load, [params.id]);

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((d) => setPosts((d.posts || []).filter((p: any) => p.user.id === params.id)));
  }, [params.id]);

  async function toggleFollow() {
    const res = await fetch(`/api/users/${params.id}/follow`, { method: "POST" });
    if (res.ok) load();
  }

  async function startConversation() {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: params.id }),
    });
    if (res.ok) router.push("/messages");
  }

  async function challenge() {
    router.push(`/battles?create=1&targetUserId=${params.id}`);
  }

  async function saveProfile() {
    setSaving(true);
    const res = await fetch(`/api/users/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio, gamerTag }),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(false);
      load();
    }
  }

  if (!profileUser) return <div className="max-w-3xl mx-auto px-4 pt-8 text-white/40">Loading profile…</div>;

  const p = profileUser.profile;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-8">
      <div className="glass-card p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center font-display text-xl">
              {(p?.displayName || profileUser.username).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-xl">{p?.displayName || profileUser.username}</h1>
              <p className="text-xs text-white/50">@{profileUser.username} {p?.gamerTag && `· #${p.gamerTag}`}</p>
              {p?.bio && <p className="text-sm text-white/70 mt-1 max-w-md">{p.bio}</p>}
            </div>
          </div>
          {!isOwnProfile ? (
            <div className="flex gap-2">
              <button onClick={toggleFollow} className={profileUser.isFollowedByMe ? "btn-ghost text-sm" : "btn-neon text-sm"}>
                {profileUser.isFollowedByMe ? "Following" : "Follow"}
              </button>
              <button onClick={startConversation} className="btn-ghost text-sm">
                Message
              </button>
              <button onClick={challenge} className="btn-ghost text-sm">
                Challenge
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing((v) => !v)} className="btn-ghost text-sm">
              {editing ? "Cancel" : "Edit Profile"}
            </button>
          )}
        </div>

        {editing && (
          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            <input placeholder="Gamer tag" value={gamerTag} onChange={(e) => setGamerTag(e.target.value)} />
            <textarea placeholder="Bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={2} />
            <button className="btn-neon text-sm" disabled={saving} onClick={saveProfile}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}

        <div className="grid grid-cols-4 gap-3 mt-5 text-center">
          <div>
            <p className="font-display text-lg">{p?.wins ?? 0}</p>
            <p className="text-[10px] text-white/40">WINS</p>
          </div>
          <div>
            <p className="font-display text-lg">{p?.losses ?? 0}</p>
            <p className="text-[10px] text-white/40">LOSSES</p>
          </div>
          <div>
            <p className="font-display text-lg">{profileUser._count?.followers ?? 0}</p>
            <p className="text-[10px] text-white/40">FOLLOWERS</p>
          </div>
          <div>
            <p className="font-display text-lg">{profileUser._count?.posts ?? 0}</p>
            <p className="text-[10px] text-white/40">POSTS</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("posts")} className={`btn-ghost text-xs ${tab === "posts" ? "border-neon-cyan text-neon-cyan" : ""}`}>
          Posts
        </button>
        <button onClick={() => setTab("games")} className={`btn-ghost text-xs ${tab === "games" ? "border-neon-cyan text-neon-cyan" : ""}`}>
          Games
        </button>
      </div>

      {tab === "posts" && (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              userId={post.user.id}
              username={post.user.username}
              displayName={post.user.profile?.displayName}
              gameName={post.game?.name}
              caption={post.caption}
              images={post.images}
              likeCount={post._count?.likes ?? 0}
              commentCount={post._count?.comments ?? 0}
              likedByMe={post.likedByMe}
              createdAt={post.createdAt}
              onDeleted={() => setPosts((prev) => prev.filter((p) => p.id !== post.id))}
            />
          ))}
          {posts.length === 0 && <p className="text-sm text-white/40">No posts yet.</p>}
        </div>
      )}

      {tab === "games" && (
        <div className="flex flex-wrap gap-2">
          {profileUser.userGames.map((ug: any) => (
            <span key={ug.gameId} className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10">
              {ug.game.name}
            </span>
          ))}
          {profileUser.userGames.length === 0 && <p className="text-sm text-white/40">No games selected.</p>}
        </div>
      )}
    </div>
  );
}