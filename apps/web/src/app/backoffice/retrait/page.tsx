"use client";

import { useState } from "react";
import { confirmWithdrawal, previewWithdrawal, type WithdrawalPreview } from "@/lib/api";
import { BackofficePage, btnGhost, btnPrimary, inputCls, Notice, type StaffContext } from "@/components/backoffice-page";

function Withdrawal({ token }: StaffContext) {
  const [code, setCode] = useState("");
  const [items, setItems] = useState<WithdrawalPreview[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function lookup() {
    setBusy(true);
    setMsg(null);
    setItems(null);
    try {
      setItems(await previewWithdrawal(token, code));
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "Code introuvable." });
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await confirmWithdrawal(token, code);
      setMsg({ kind: "ok", text: `Remis à ${r.client} : ${r.quantity} × ${r.product}.` });
      setItems(null);
      setCode("");
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "Échec de la confirmation." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <form
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.length === 6) lookup();
        }}
      >
        <label className="grid gap-1 text-xs font-semibold text-ink-2">
          Code de retrait du client (6 chiffres)
          <input
            inputMode="numeric"
            maxLength={6}
            autoFocus
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ""));
              setItems(null);
            }}
            className={`${inputCls} w-52 text-center font-mono text-2xl tracking-[0.3em]`}
          />
        </label>
        <button type="submit" disabled={busy || code.length !== 6} className={btnPrimary}>
          Vérifier
        </button>
      </form>

      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      {items && (
        <section className="grid gap-4 rounded-2xl border border-brand/40 bg-surface p-5">
          <h2 className="font-display text-lg font-bold">À remettre au client</h2>
          <ul className="grid gap-2 text-sm">
            {items.map((i) => (
              <li key={i.itemId} className="flex justify-between gap-3 rounded-xl border border-line bg-bg px-3 py-2">
                <span className="font-semibold">
                  {i.quantity} {i.unitLabel} · {i.product}
                </span>
                <span className="text-ink-2">
                  {i.client.fullName !== "Nouveau client" ? i.client.fullName : i.client.phone}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-2">Contrôlez la pièce d&apos;identité si besoin, remettez les articles, puis confirmez. Le code ne peut servir qu&apos;une fois.</p>
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={confirm} className={btnPrimary}>
              Confirmer la remise
            </button>
            <button type="button" onClick={() => setItems(null)} className={btnGhost}>
              Annuler
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default function WithdrawalPage() {
  return (
    <BackofficePage roles={["GESTIONNAIRE_LIQUIDITE", "AGENT_MAGASIN", "ADMIN"]} title="Retrait en magasin" subtitle="Saisissez le code reçu par le client pour retrouver sa commande et enregistrer la remise." width="max-w-2xl">
      {(ctx) => <Withdrawal {...ctx} />}
    </BackofficePage>
  );
}
