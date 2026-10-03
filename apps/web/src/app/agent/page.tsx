"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Logo } from "@/components/logo";
import { PageLoading } from "@/components/page-state";
import { requestOtp, verifyOtp } from "@/lib/api";
import { FieldApp } from "./field-app";

const FIELD_ROLES = ["AGENT", "GESTIONNAIRE_PRIX", "ADMIN"];
const field = "w-full rounded-xl border border-line bg-surface px-3 py-3 text-lg outline-none focus:border-brand";

/** Connexion de l'agent de terrain : numéro de téléphone puis code, comme pour un client. */
function AgentLogin() {
  const { setSession } = useAuth();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("+229");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setBusy(true);
    setError(null);
    try {
      const res = await requestOtp(phone);
      if (res.devCode) setCode(res.devCode);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi du code.");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    setError(null);
    try {
      const { accessToken, user } = await verifyOtp(phone, code);
      setSession(accessToken, user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code invalide.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-5 px-4 py-12">
      <div>
        <Logo markClassName="size-11" textClassName="text-xl" />
        <h1 className="mt-5 font-display text-2xl font-extrabold">Relevé de prix</h1>
        <p className="mt-1 text-sm text-ink-2">Espace des agents de terrain. Connectez-vous avec votre numéro.</p>
      </div>
      {error && <p className="rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}
      {step === "phone" ? (
        <>
          <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
            Numéro de téléphone
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
          </label>
          <button type="button" disabled={busy || phone.trim().length < 8} onClick={sendCode} className="rounded-xl bg-brand py-3.5 font-bold text-on-brand disabled:opacity-60">
            {busy ? "Envoi…" : "Recevoir le code"}
          </button>
        </>
      ) : (
        <>
          <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
            Code à 6 chiffres
            <input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className={`${field} text-center font-mono text-2xl tracking-[0.3em]`} />
          </label>
          <button type="button" disabled={busy || code.length !== 6} onClick={verify} className="rounded-xl bg-brand py-3.5 font-bold text-on-brand disabled:opacity-60">
            {busy ? "Vérification…" : "Valider"}
          </button>
          <button type="button" onClick={() => setStep("phone")} className="text-xs text-ink-2 underline">
            Changer de numéro
          </button>
        </>
      )}
    </main>
  );
}

export default function AgentPage() {
  const { user, token, ready, logout } = useAuth();

  if (!ready) return <PageLoading />;
  if (!token || !user) return <AgentLogin />;

  if (!FIELD_ROLES.includes(user.role)) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <p className="max-w-sm text-sm text-ink-2">Ce compte n&apos;est pas un compte d&apos;agent de terrain.</p>
        <button type="button" onClick={logout} className="rounded-xl border border-line px-5 py-2.5 text-sm font-bold">
          Changer de compte
        </button>
      </main>
    );
  }

  return <FieldApp token={token} agent={user} onLogout={logout} />;
}
