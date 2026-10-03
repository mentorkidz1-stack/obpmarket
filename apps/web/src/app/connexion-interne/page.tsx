"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { staffLogin } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Logo } from "@/components/logo";

export default function StaffLoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      const { accessToken, user } = await staffLogin(email.trim(), password);
      setSession(accessToken, user);
      router.push("/backoffice");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la connexion.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
     <div className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-6 sm:p-9">
      <div>
        <Logo markClassName="size-11" textClassName="text-xl" />
        <h1 className="mt-4 font-display text-3xl font-extrabold">Connexion interne</h1>
        <p className="text-sm text-ink-2">Réservé aux équipes OBP Market (gestionnaires, modérateurs).</p>
      </div>

      {error && <p className="rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}

      <div className="grid gap-1.5">
        <label htmlFor="email" className="text-xs font-semibold text-ink-2">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="rounded-xl border border-line bg-surface px-3 py-2.5 outline-none focus:border-brand"
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="password" className="text-xs font-semibold text-ink-2">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="rounded-xl border border-line bg-surface px-3 py-2.5 outline-none focus:border-brand"
        />
      </div>
      <button
        type="button"
        disabled={busy || !email || !password}
        onClick={handleSubmit}
        className="rounded-xl bg-brand py-3 font-semibold text-on-brand disabled:opacity-60"
      >
        {busy ? "Connexion…" : "Se connecter"}
      </button>
     </div>
    </main>
  );
}
