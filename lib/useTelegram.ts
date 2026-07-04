"use client";

import { useEffect, useState } from "react";

export function useTelegram() {
  const [initData, setInitData] = useState<string>("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      setInitData(tg.initData || "");
    }
    setReady(true);
  }, []);

  async function apiFetch(url: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    headers.set("X-Telegram-Init-Data", initData);
    return fetch(url, { ...options, headers });
  }

  return { initData, ready, apiFetch };
}
