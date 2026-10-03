"use client";

import { useEffect, useState } from "react";
import { getContactMessages, setContactHandled, type ContactMessageRecord } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { useStaffSession } from "@/lib/staff-session";
import { StaffBar } from "@/components/staff-bar";

export default function MessagesAdminPage() {
  const { user, token, authorized, logout } = useStaffSession(["MODERATEUR", "ADMIN"]);
  const [messages, setMessages] = useState<ContactMessageRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reload(t: string) {
    getContactMessages(t)
      .then(setMessages)
      .catch((err: Error) => setError(err.message));
  }

  useEffect(() => {
    if (token) reload(token);
  }, [token]);

  async function toggle(m: ContactMessageRecord) {
    if (!token) return;
    await setContactHandled(token, m.id, m.status === "NOUVEAU");
    reload(token);
  }

  if (!authorized || !user) {
    return <main className="flex flex-1 items-center justify-center text-sm text-ink-2">Chargement…</main>;
  }

  const open = messages?.filter((m) => m.status === "NOUVEAU").length ?? 0;

  return (
    <>
      <StaffBar user={user} logout={logout} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-extrabold">Messages des clients</h1>
        <p className="text-sm text-ink-2">
          Envoyés depuis la page Contact du site. {messages && `${open} à traiter.`}
        </p>

        {error && <p className="mt-4 rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}

        {messages && messages.length === 0 && (
          <p className="mt-6 rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-2">Aucun message pour l&apos;instant.</p>
        )}

        <ul className="mt-5 grid gap-3">
          {messages?.map((m) => (
            <li key={m.id} className={`rounded-2xl border bg-surface p-5 ${m.status === "NOUVEAU" ? "border-brand/50" : "border-line opacity-75"}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display font-bold">{m.subject}</p>
                  <p className="text-xs text-ink-2">
                    {m.name} · {formatRelativeTime(m.createdAt)}
                  </p>
                </div>
                <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${m.status === "NOUVEAU" ? "bg-brand-soft text-brand" : "bg-up/10 text-up"}`}>
                  {m.status === "NOUVEAU" ? "À traiter" : "Traité"}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{m.message}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                {m.phone && (
                  <a href={`tel:${m.phone}`} className="font-semibold text-brand">
                    {m.phone}
                  </a>
                )}
                {m.email && (
                  <a href={`mailto:${m.email}`} className="font-semibold text-brand">
                    {m.email}
                  </a>
                )}
                <button type="button" onClick={() => toggle(m)} className="ml-auto rounded-lg border border-line px-3 py-1.5 text-xs font-bold hover:bg-surface-2">
                  {m.status === "NOUVEAU" ? "Marquer comme traité" : "Rouvrir"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
