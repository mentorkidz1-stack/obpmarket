"use client";

import { useState } from "react";
import { changeMyPassword } from "@/lib/api";
import { ALL_STAFF_ROLES, ROLE_LABEL } from "@/lib/staff-nav";
import { BackofficePage, btnPrimary, inputCls, Notice, type StaffContext } from "@/components/backoffice-page";

function Account({ token, user }: StaffContext) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const mismatch = again !== "" && next !== again;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await changeMyPassword(token, current, next);
      setMsg({ kind: "ok", text: "Mot de passe modifié." });
      setCurrent("");
      setNext("");
      setAgain("");
    } catch (err) {
      setMsg({ kind: "error", text: err instanceof Error ? err.message : "Échec de la modification." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-2xl border border-line bg-surface p-5 text-sm">
        <p className="font-display text-lg font-bold">{user.fullName}</p>
        <p className="text-ink-2">{ROLE_LABEL[user.role] ?? user.role}</p>
      </section>

      <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-lg font-bold">Changer mon mot de passe</h2>
        <label className="grid gap-1 text-xs font-semibold text-ink-2">
          Mot de passe actuel
          <input type="password" autoComplete="current-password" className={inputCls} value={current} onChange={(e) => setCurrent(e.target.value)} />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-ink-2">
          Nouveau mot de passe (10 caractères minimum)
          <input type="password" autoComplete="new-password" className={inputCls} value={next} onChange={(e) => setNext(e.target.value)} />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-ink-2">
          Confirmer le nouveau mot de passe
          <input type="password" autoComplete="new-password" className={inputCls} value={again} onChange={(e) => setAgain(e.target.value)} />
        </label>
        {mismatch && <Notice kind="error">Les deux mots de passe ne correspondent pas.</Notice>}
        {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
        <button type="submit" disabled={busy || !current || next.length < 10 || next !== again} className={`${btnPrimary} w-fit`}>
          Modifier le mot de passe
        </button>
      </form>
    </div>
  );
}

export default function AccountPage() {
  return (
    <BackofficePage roles={ALL_STAFF_ROLES} title="Mon compte" width="max-w-xl">
      {(ctx) => <Account {...ctx} />}
    </BackofficePage>
  );
}
