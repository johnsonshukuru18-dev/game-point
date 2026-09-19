"use client";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [forbidden, setForbidden] = useState(false);

  function load() {
    fetch("/api/admin/stats").then((r) => {
      if (r.status === 403) return setForbidden(true);
      r.json().then(setStats);
    });
    fetch("/api/admin/reports").then((r) => (r.ok ? r.json() : [])).then(setReports);
  }

  useEffect(load, []);

  async function updateReport(id: string, status: string) {
    await fetch("/api/admin/reports", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  if (forbidden) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-16 text-center">
        <p className="text-neon-red font-display text-lg">Admins only.</p>
        <p className="text-sm text-white/50 mt-2">
          This account doesn't have admin access. To make a user an admin, set their <code>role</code> to{" "}
          <code>&quot;ADMIN&quot;</code> in the database (e.g. via <code>npx prisma studio</code>).
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8">
      <h1 className="text-2xl font-display mb-6">🛠 Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {stats &&
          Object.entries(stats).map(([key, value]) => (
            <div key={key} className="glass-card p-4 text-center">
              <p className="font-display text-2xl">{value as number}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wide">{key}</p>
            </div>
          ))}
      </div>

      <h2 className="font-display text-sm mb-3 text-white/60">REPORTS</h2>
      <div className="space-y-2">
        {reports.map((r) => (
          <div key={r.id} className="glass-card p-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm">
                <span className="font-semibold">{r.targetType}</span> reported by {r.reporter.username}
              </p>
              <p className="text-xs text-white/50">{r.reason}</p>
              <p className="text-[10px] text-white/30">{new Date(r.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-neon-cyan">{r.status}</span>
              {r.status === "OPEN" && (
                <>
                  <button className="btn-ghost text-xs px-2 py-1" onClick={() => updateReport(r.id, "REVIEWED")}>
                    Mark Reviewed
                  </button>
                  <button className="btn-ghost text-xs px-2 py-1" onClick={() => updateReport(r.id, "DISMISSED")}>
                    Dismiss
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {reports.length === 0 && <p className="text-sm text-white/40">No reports filed.</p>}
      </div>
    </div>
  );
}
