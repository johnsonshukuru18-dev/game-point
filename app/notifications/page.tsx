"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const ICONS: Record<string, string> = {
  FOLLOW: "👤",
  LIKE: "❤️",
  COMMENT: "💬",
  BATTLE_REQUEST: "⚔",
  BATTLE_ACCEPTED: "✅",
  MESSAGE: "✉️",
  BATTLE_RESULT: "🏆",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications || []);
        if (d.unreadCount > 0) fetch("/api/notifications", { method: "PUT" });
      });
  }, []);

  return (
    <div className="max-w-xl mx-auto px-4 pt-8">
      <h1 className="text-2xl font-display mb-6">🔔 Notifications</h1>
      <div className="space-y-2">
        {notifications.map((n) => (
          <Link
            key={n.id}
            href={n.link || "#"}
            className={`glass-card p-3 flex items-start gap-3 block ${!n.read ? "border-neon-cyan/40" : ""}`}
          >
            <span className="text-lg">{ICONS[n.type] || "🔔"}</span>
            <div>
              <p className="text-sm">{n.message}</p>
              <p className="text-xs text-white/40">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          </Link>
        ))}
        {notifications.length === 0 && <p className="text-sm text-white/40">You&apos;re all caught up.</p>}
      </div>
    </div>
  );
}