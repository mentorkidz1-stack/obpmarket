"use client";

import type { ReactNode } from "react";
import type { AuthUser } from "@/lib/api";
import { useStaffSession } from "@/lib/staff-session";
import { StaffBar } from "@/components/staff-bar";
import { PageLoading } from "@/components/page-state";

export interface StaffContext {
  token: string;
  user: AuthUser;
}

/**
 * Coquille commune des écrans du back-office : contrôle d'accès par rôle, barre de navigation,
 * titre et corps. Le contenu reçoit la session (jeton + utilisateur) une fois celle-ci validée.
 */
export function BackofficePage({
  roles,
  title,
  subtitle,
  actions,
  width = "max-w-6xl",
  children,
}: {
  roles: string[];
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  width?: string;
  children: (ctx: StaffContext) => ReactNode;
}) {
  const { user, token, authorized, logout } = useStaffSession(roles);
  if (!authorized || !user || !token) return <PageLoading />;

  return (
    <>
      <StaffBar user={user} logout={logout} />
      <main className={`mx-auto w-full ${width} flex-1 px-4 py-7 sm:px-6`}>
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold">{title}</h1>
            {subtitle && <p className="mt-1 max-w-2xl text-sm text-ink-2">{subtitle}</p>}
          </div>
          {actions}
        </header>
        {children({ token, user })}
      </main>
    </>
  );
}

export const inputCls = "w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-brand";
export const btnPrimary = "rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-on-brand disabled:opacity-60";
export const btnGhost = "rounded-xl border border-line px-4 py-2.5 text-sm font-bold hover:bg-surface-2 disabled:opacity-60";

export function Notice({ kind, children }: { kind: "ok" | "error" | "info"; children: ReactNode }) {
  const tone = kind === "ok" ? "border-up/30 bg-up/10 text-up" : kind === "error" ? "border-down/30 bg-down/10 text-down" : "border-line bg-surface-2 text-ink";
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`rounded-xl border px-3 py-2 text-sm ${tone}`}>
      {children}
    </p>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-2">{children}</p>;
}

/** Télécharge un tableau en CSV (séparateur « ; » et BOM pour qu'Excel ouvre correctement les accents). */
export function downloadCsv(filename: string, rows: Array<Array<string | number | null | undefined>>) {
  const escape = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const blob = new Blob(["﻿" + rows.map((r) => r.map(escape).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
