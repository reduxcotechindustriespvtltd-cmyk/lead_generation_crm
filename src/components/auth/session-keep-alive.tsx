"use client";

import { useEffect } from "react";

const REFRESH_INTERVAL_MS = 20 * 60 * 1000; // access token lives 30 min; refresh well before it expires

export function SessionKeepAlive() {
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/auth/refresh", { method: "POST" }).catch(() => {});
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}
