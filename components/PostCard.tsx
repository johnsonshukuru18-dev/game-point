"use client";
import { useState } from "react";
import { useUser } from "@/lib/useUser";

interface PostCardProps {
  id: string;
  userId: string;
  username: string;
  displayName?: string | null;
  gameName?: string | null;
  caption: string;
  images: { url: string }[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
  onDeleted?: () => void;
}

export default function PostCard(props: PostCardProps) {
  const { user } = useUser();
  const [liked, setLiked] = useState(props.likedByMe);
  const [likeCount, setLikeCount] = useState(props.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwnPost = user?.id === props.userId;

  async function toggleLike() {
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    const res = await fetch(`/api/posts/${props.id}/like`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount(data.count);
    }
  }

  async function loadComments() {
    setShowComments((v) => !v);
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      const res = await fetch(`/api/posts/${props.id}/comment`);
      if (res.ok) setComments(await res.json());
      setLoadingComments(false);
    }
  }

  async function submitComment() {
    if (!commentText.trim()) return;
    const res = await fetch(`/api/posts/${props.id}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText }),
    });
    if (res.ok) {
      const c = await res.json();
      setComments((prev) => [...prev, c]);
      setCommentText("");
    }
  }

  async function deletePost() {
    if (!confirm("Delete this post? This can't be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/posts/${props.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      props.onDeleted?.();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Could not delete post");
    }
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-semibold text-sm">{props.displayName || props.username}</p>
          <p className="text-xs text-white/50">
            @{props.username} {props.gameName && `· ${props.gameName}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40">{new Date(props.createdAt).toLocaleString()}</span>
          {isOwnPost && (
            <button
              onClick={deletePost}
              disabled={deleting}
              title="Delete post"
              className="text-white/40 hover:text-neon-red text-xs"
            >
              {deleting ? "…" : "🗑"}
            </button>
          )}
        </div>
      </div>
      <p className="text-sm mb-3">{props.caption}</p>
      {props.images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {props.images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={img.url} alt="Post attachment" className="rounded-lg object-cover w-full h-40" />
          ))}
        </div>
      )}
      <div className="flex items-center gap-4 text-sm text-white/70">
        <button onClick={toggleLike} className={liked ? "text-neon-red" : ""}>
          {liked ? "❤️" : "🤍"} {likeCount}
        </button>
        <button onClick={loadComments}>💬 {props.commentCount}</button>
        <button className="opacity-60 cursor-not-allowed" title="Coming soon">
          🔄 Share
        </button>
      </div>
      {showComments && (
        <div className="mt-3 border-t border-white/10 pt-3 space-y-2">
          {loadingComments && <p className="text-xs text-white/40">Loading comments…</p>}
          {comments.map((c) => (
            <p key={c.id} className="text-xs">
              <span className="font-semibold">{c.user.profile?.displayName || c.user.username}:</span> {c.content}
            </p>
          ))}
          <div className="flex gap-2 mt-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment…"
              className="text-xs"
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
            />
            <button onClick={submitComment} className="btn-ghost text-xs px-3">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}