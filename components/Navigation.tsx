"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/lib/useUser";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: "🏠" },
  { href: "/games", label: "Games", icon: "🎮" },
  { href: "/battles", label: "Battles", icon: "⚔️" },
  { href: "/messages", label: "Messages", icon: "💬" },
  { href: "/notifications", label: "Alerts", icon: "🔔" },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const [fabOpen, setFabOpen] = useState(false);

  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
    return null;
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {/* Desktop floating left rail */}
      <nav className="hidden md:flex flex-col items-center gap-2 fixed left-4 top-1/2 -translate-y-1/2 z-40 glass-card glow-border p-3">
        <Link href="/home" className="font-display text-neon-cyan text-sm mb-3 px-1">
          GP
        </Link>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`w-14 h-14 flex flex-col items-center justify-center rounded-xl text-xs gap-0.5 transition ${
              pathname.startsWith(item.href)
                ? "bg-white/10 text-neon-cyan shadow-glow"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        {user && (
          <Link
            href={`/profile/${user.id}`}
            className={`w-14 h-14 flex flex-col items-center justify-center rounded-xl text-xs gap-0.5 transition ${
              pathname.startsWith("/profile") ? "bg-white/10 text-neon-cyan" : "text-white/60 hover:bg-white/5"
            }`}
          >
            <span className="text-lg">👤</span>
            Profile
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="w-14 h-14 flex flex-col items-center justify-center rounded-xl text-xs gap-0.5 text-white/40 hover:text-neon-red hover:bg-white/5"
        >
          <span className="text-lg">⏻</span>
          Logout
        </button>
      </nav>

      {/* Mobile floating bottom bar */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 glass-card glow-border flex items-center justify-around py-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center text-[10px] px-2 py-1 rounded-lg ${
              pathname.startsWith(item.href) ? "text-neon-cyan" : "text-white/50"
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Floating action button */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50">
        {fabOpen && (
          <div className="mb-3 flex flex-col gap-2 items-end">
            <Link onClick={() => setFabOpen(false)} href="/battles?create=1" className="btn-neon text-sm shadow-glow">
              ⚔ Create Battle
            </Link>
            <Link onClick={() => setFabOpen(false)} href="/games?post=1" className="btn-neon text-sm shadow-glow">
              📸 New Post
            </Link>
            <Link onClick={() => setFabOpen(false)} href="/players" className="btn-neon text-sm shadow-glow">
              👥 Find Player
            </Link>
          </div>
        )}
        <button
          onClick={() => setFabOpen((v) => !v)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple text-2xl font-bold shadow-glowPurple flex items-center justify-center"
          aria-label="Quick actions"
        >
          {fabOpen ? "×" : "+"}
        </button>
      </div>
    </>
  );
}
