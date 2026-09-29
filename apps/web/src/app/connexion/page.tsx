"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestOtp, verifyOtp } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("+229");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequestOtp() {
    setBusy(true);
    setError(null);
    try {
      const res = await requestOtp(phone);
      setDevCode(res.devCode ?? null);
      if (res.devCode) setCode(res.devCode);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi du code.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    setBusy(true);
    setError(null);
    try {
      const { accessToken, user } = await verifyOtp(phone, code);
      setSession(accessToken, user);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code invalide.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-5 px-4 py-12">
      <div>
        <p className="grid size-10 place-items-center rounded-[11px] bg-brand font-display text-[15px] font-extrabold text-on-brand">
          OBP
        </p>
        <h1 className="mt-4 font-display text-2xl font-bold">Se connecter</h1>
        <p className="text-sm text-ink-2">
          {step === "phone" ? "Avec votre numéro de téléphone." : `Code envoyé au ${phone}.`}
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">{error}</p>
      )}

      {step === "phone" ? (
        <>
          <div className="grid gap-1.5">
            <label htmlFor="phone" className="text-xs font-semibold text-ink-2">
              Numéro de téléphone
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-xl border border-line bg-surface px-3 py-2.5 text-lg outline-none focus:border-brand"
            />
          </div>
          <button
            type="button"
            disabled={busy || phone.trim().length < 8}
            onClick={handleRequestOtp}
            className="rounded-xl bg-brand py-3 font-semibold text-on-brand disabled:opacity-60"
          >
            {busy ? "Envoi…" : "Recevoir le code"}
          </button>
        </>
      ) : (
        <>
          {devCode && (
            <p className="rounded-xl border border-accent/40 bg-accent-soft px-3 py-2 text-xs leading-relaxed">
              Mode développement : aucune passerelle SMS n&apos;est branchée, le code est donc affiché ici et
              pré-rempli.
            </p>
          )}
          <div className="grid gap-1.5">
            <label htmlFor="code" className="text-xs font-semibold text-ink-2">
              Code à 6 chiffres
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="rounded-xl border border-line bg-surface px-3 py-2.5 text-center font-mono text-2xl tracking-[0.3em] outline-none focus:border-brand"
            />
          </div>
          <button
            type="button"
            disabled={busy || code.length !== 6}
            onClick={handleVerify}
            className="rounded-xl bg-brand py-3 font-semibold text-on-brand disabled:opacity-60"
          >
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
