"use client";
import Link from "next/link";

interface Participant {
  userId: string;
  user: { username: string; profile?: { displayName?: string | null } | null };
  isWinner?: boolean | null;
}

interface BattleCardProps {
  id: string;
  code: string;
  gameName: string;
  mode: string;
  platform: string;
  skillLevel: string;
  status: string;
  participants: Participant[];
  currentUserId?: string;
  onJoin?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  WAITING: "text-neon-orange",
  ACCEPTED: "text-neon-cyan",
  IN_PROGRESS: "text-neon-blue",
  COMPLETED: "text-neon-green",
  CANCELLED: "text-white/40",
  DECLINED: "text-neon-red",
};

export default function BattleCard({
  id,
  code,
  gameName,
  mode,
  platform,
  skillLevel,
  status,
  participants,
  currentUserId,
  onJoin,
}: BattleCardProps) {
  const isParticipant = currentUserId && participants.some((p) => p.userId === currentUserId);
  const canJoin = status === "WAITING" && !isParticipant;

  return (
    <div className="glass-card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h4 className="font-display text-sm">{gameName}</h4>
        <span className={`text-xs font-semibold ${STATUS_COLORS[status] || ""}`}>{status.replace("_", " ")}</span>
      </div>
      <p className="text-xs text-white/60">
        {mode} · {platform} · {skillLevel}
      </p>
      <p className="text-xs">
        Battle code: <span className="font-mono text-neon-cyan">{code}</span>
      </p>
      <div className="text-xs text-white/70">
        {participants.map((p) => p.user.profile?.displayName || p.user.username).join(" vs ") || "Waiting for opponent"}
      </div>
      <div className="flex gap-2 mt-2">
        <Link href={`/battles/${id}`} className="btn-ghost text-xs px-3 py-1">
          View
        </Link>
        {canJoin && onJoin && (
          <button onClick={onJoin} className="btn-neon text-xs px-3 py-1">
            Join Battle
          </button>
        )}
      </div>
    </div>
  );
}
