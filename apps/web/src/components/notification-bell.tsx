"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { getUnreadCount } from "@/lib/api";

/** Cloche des notifications : le nombre de non lues est relu toutes les 60 s, seulement onglet visible. */
export function NotificationBell() {
  const { token, ready } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!ready || !token) return;
    let alive = true;
    const load = () => {
      if (document.visibilityState !== "visible") return;
      getUnreadCount(token)
        .then((r) => alive && setUnread(r.unread))
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, 60_000);
    document.addEventListener("visibilitychange", load);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, [ready, token]);

  if (!ready || !token) return null;

  return (
    <Link
      href="/notifications"
      aria-label={`Notifications${unread ? ` (${unread} non lue${unread > 1 ? "s" : ""})` : ""}`}
      className="relative hidden size-10 place-items-center rounded-xl border border-line bg-surface hover:bg-surface-2 sm:grid"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9z" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-down px-1 font-mono text-[10px] font-bold leading-5 text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
