"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/lib/useUser";

export default function BattleDetailPage({ params }: { params: { id: string } }) {
  const { user } = useUser();
  const [battle, setBattle] = useState<any>(null);
  const [winnerId, setWinnerId] = useState("");
  const [scoreSummary, setScoreSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  function load() {
    fetch("/api/battles")
      .then((r) => r.json())
      .then((all) => setBattle(all.find((b: any) => b.id === params.id) || null));
  }

  useEffect(load, [params.id]);

  async function act(action: "join" | "accept" | "decline" | "cancel") {
    setBusy(true);
    const res = await fetch(`/api/battles/${params.id}/${action}`, { method: "POST" });
    setBusy(false);
    if (res.ok) load();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Action failed");
    }
  }

  async function reportResult() {
    if (!winnerId) return;
    setBusy(true);
    const res = await fetch(`/api/battles/${params.id}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerId, scoreSummary }),
    });
    setBusy(false);
    if (res.ok) load();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Could not report result");
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(battle.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!battle) return <div className="max-w-2xl mx-auto px-4 pt-8 text-white/40">Loading battle…</div>;

  const isParticipant = user && battle.participants.some((p: any) => p.userId === user.id);
  const isCreator = user && battle.creatorId === user.id;
  const canReport = isParticipant && (battle.status === "ACCEPTED" || battle.status === "IN_PROGRESS");

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8">
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-xl">{battle.game.name} Battle</h1>
          <span className="text-xs font-semibold text-neon-cyan">{battle.status.replace("_", " ")}</span>
        </div>
        <p className="text-sm text-white/60 mb-4">
          {battle.mode} · {battle.platform} · {battle.skillLevel}
        </p>

        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-lg text-neon-cyan">{battle.code}</span>
          <button onClick={copyCode} className="btn-ghost text-xs px-3 py-1">
            {copied ? "Copied!" : "Copy Code"}
          </button>
        </div>

        <div className="space-y-1 mb-4">
          {battle.participants.map((p: any) => (
            <p key={p.userId} className="text-sm">
              {p.user.profile?.displayName || p.user.username} {p.isWinner === true && "🏆"} {p.isWinner === false && "❌"}
            </p>
          ))}
          {battle.participants.length < 2 && battle.status === "WAITING" && (
            <p className="text-sm text-white/40">Waiting for an opponent…</p>
          )}
        </div>

        {battle.result && (
          <div className="glass-card p-3 mb-4 text-sm">
            <p>Result reported: {battle.result.scoreSummary || "—"}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {battle.status === "WAITING" && !isParticipant && (
            <button className="btn-neon text-sm" disabled={busy} onClick={() => act("join")}>
              Join Battle
            </button>
          )}
          {battle.status === "WAITING" && isCreator && (
            <button className="btn-ghost text-sm" disabled={busy} onClick={() => act("cancel")}>
              Cancel Battle
            </button>
          )}
          {canReport && (
            <div className="w-full mt-3 glass-card p-4">
              <p className="text-xs text-white/50 mb-2">REPORT RESULT</p>
              <select value={winnerId} onChange={(e) => setWinnerId(e.target.value)} className="mb-2">
                <option value="">Select winner…</option>
                {battle.participants.map((p: any) => (
                  <option key={p.userId} value={p.userId}>
                    {p.user.profile?.displayName || p.user.username}
                  </option>
                ))}
              </select>
              <input
                placeholder="Score (e.g. 3-1)"
                value={scoreSummary}
                onChange={(e) => setScoreSummary(e.target.value)}
                className="mb-2"
              />
              <button className="btn-neon text-sm w-full" disabled={busy || !winnerId} onClick={reportResult}>
                Submit Result
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
