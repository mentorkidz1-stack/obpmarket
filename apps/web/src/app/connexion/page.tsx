"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestOtp, verifyOtp } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Photo } from "@/components/photo";
import { Logo } from "@/components/logo";

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
    <main className="mx-auto grid w-full max-w-4xl flex-1 items-center px-4 py-10 sm:px-6 sm:py-14">
      <div className="grid overflow-hidden rounded-3xl border border-line bg-surface md:grid-cols-2">
        <div className="relative hidden min-h-[460px] md:block">
          <Photo src="/promos/hero-2.jpg" alt="" sizes="440px" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d20]/90 via-[#0b0d20]/30 to-transparent" />
          <div className="relative flex h-full flex-col justify-end p-8 text-white">
            <p className="font-display text-2xl font-extrabold leading-tight">Le prix juste, directement du marché.</p>
            <p className="mt-2 text-sm text-white/85">Achetez, déposez et revendez vos produits en toute confiance.</p>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-5 p-6 sm:p-10">
      <div>
        <Logo markClassName="size-11" textClassName="text-xl" />
        <h1 className="mt-4 font-display text-3xl font-extrabold">Se connecter</h1>
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
              Votre code de connexion est affiché et pré-rempli ci-dessous.
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
        </div>
      </div>
    </main>
  );
}
