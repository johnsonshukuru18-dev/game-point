"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/lib/useUser";

function MessagesPageInner() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(searchParams.get("conversation"));
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const lastFetchRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  function loadConversations() {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then(setConversations);
  }

  useEffect(loadConversations, []);

  // Poll the active conversation for new messages every 3 seconds — a real,
  // functional stand-in for full WebSocket real-time (see README for the
  // Socket.IO upgrade path).
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;

    async function poll() {
      const url = lastFetchRef.current
        ? `/api/conversations/${activeId}/messages?after=${encodeURIComponent(lastFetchRef.current)}`
        : `/api/conversations/${activeId}/messages`;
      const res = await fetch(url);
      if (!res.ok || cancelled) return;
      const newMsgs = await res.json();
      if (newMsgs.length > 0) {
        setMessages((prev) => (lastFetchRef.current ? [...prev, ...newMsgs] : newMsgs));
        lastFetchRef.current = newMsgs[newMsgs.length - 1].createdAt;
      } else if (!lastFetchRef.current) {
        lastFetchRef.current = new Date(0).toISOString();
      }
    }

    setMessages([]);
    lastFetchRef.current = null;
    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!text.trim() || !activeId) return;
    const res = await fetch(`/api/conversations/${activeId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      lastFetchRef.current = msg.createdAt;
      setText("");
    }
  }

  const activeConvo = conversations.find((c) => c.id === activeId);
  const otherUser = activeConvo?.participants.find((p: any) => p.userId !== user?.id)?.user;

  return (
    <div className="max-w-5xl mx-auto px-4 pt-8 grid md:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
      <div className="glass-card p-3 overflow-y-auto">
        <h2 className="font-display text-sm mb-3 px-2">Messages</h2>
        {conversations.map((c) => {
          const other = c.participants.find((p: any) => p.userId !== user?.id)?.user;
          const lastMsg = c.messages[0];
          return (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`w-full text-left p-3 rounded-lg mb-1 ${activeId === c.id ? "bg-white/10" : "hover:bg-white/5"}`}
            >
              <p className="text-sm font-semibold">{other?.profile?.displayName || other?.username}</p>
              <p className="text-xs text-white/40 truncate">{lastMsg?.content || "No messages yet"}</p>
            </button>
          );
        })}
        {conversations.length === 0 && <p className="text-xs text-white/40 px-2">No conversations yet. Message someone from their profile.</p>}
      </div>

      <div className="glass-card p-4 md:col-span-2 flex flex-col">
        {activeId ? (
          <>
            <div className="border-b border-white/10 pb-2 mb-3">
              <p className="font-semibold text-sm">{otherUser?.profile?.displayName || otherUser?.username || "Conversation"}</p>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 mb-3">
              {messages.map((m) => (
                <div key={m.id} className={`max-w-[75%] ${m.senderId === user?.id ? "ml-auto text-right" : ""}`}>
                  <div
                    className={`inline-block px-3 py-2 rounded-xl text-sm ${
                      m.senderId === user?.id ? "bg-neon-blue text-[#051019]" : "bg-white/10"
                    }`}
                  >
                    {m.battleCode ? (
                      <span>
                        ⚔ Battle code: <span className="font-mono">{m.battleCode}</span>
                      </span>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="flex gap-2">
              <input
                placeholder="Type a message…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button className="btn-neon text-sm" onClick={send}>
                Send
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-white/40 m-auto">Select a conversation to start chatting.</p>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesPageInner />
    </Suspense>
  );
}
