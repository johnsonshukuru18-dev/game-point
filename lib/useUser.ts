"use client";
import { useEffect, useState } from "react";

export interface CurrentUser {
  id: string;
  username: string;
  email: string;
  role?: string;
  profile: { displayName?: string; gamerTag?: string; avatarUrl?: string } | null;
}

export function useUser() {
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  return { user, loading: user === undefined };
}