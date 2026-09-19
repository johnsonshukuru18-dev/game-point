import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/10 via-transparent to-neon-purple/10 pointer-events-none" />
      <p className="font-display text-neon-cyan tracking-[0.3em] text-xs mb-4">GAME MODE</p>
      <h1 className="font-display text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
        WHERE GAMERS <span className="text-neon-cyan">CONNECT.</span>
      </h1>
      <p className="text-white/70 text-lg mb-10">Play. Connect. Challenge. Share.</p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/register" className="btn-neon">
          ENTER GAME MODE
        </Link>
        <Link href="/games" className="btn-ghost">
          EXPLORE GAMES
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl">
        {[
          { label: "eFootball", accent: "from-neon-blue to-neon-cyan" },
          { label: "Call of Duty", accent: "from-neon-red to-neon-orange" },
          { label: "GTA V", accent: "from-neon-purple to-neon-cyan" },
          { label: "Need for Speed", accent: "from-neon-orange to-neon-red" },
        ].map((g) => (
          <div key={g.label} className={`glass-card px-5 py-4 bg-gradient-to-br ${g.accent} bg-opacity-10`}>
            <p className="font-display text-sm">{g.label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-white/30 mt-16">Game Point — an original community platform. Not affiliated with any game publisher.</p>
    </div>
  );
}
