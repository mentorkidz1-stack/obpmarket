"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import {
  getNotificationPrefs,
  getNotifications,
  markAllNotificationsRead,
  setNotificationPrefs,
  type NotificationPrefs,
  type NotificationRecord,
} from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { PageHero } from "@/components/page-hero";
import { LoadError, PageLoading } from "@/components/page-state";

export default function NotificationsPage() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [items, setItems] = useState<NotificationRecord[] | null>(null);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace("/connexion?next=/notifications");
      return;
    }
    let alive = true;
    Promise.all([getNotifications(token), getNotificationPrefs(token)])
      .then(([n, p]) => {
        if (!alive) return;
        setItems(n.items);
        setPrefs(p);
        // Les afficher vaut lecture : la pastille de la cloche repart à zéro.
        if (n.unread > 0) markAllNotificationsRead(token).catch(() => {});
      })
      .catch((err: Error) => alive && setLoadError(err.message));
    return () => {
      alive = false;
    };
  }, [ready, token, router, attempt]);

  async function toggleWhatsApp(next: boolean) {
    if (!token) return;
    setPrefs(await setNotificationPrefs(token, next));
  }

  if (loadError) {
    return (
      <LoadError
        message={loadError}
        onRetry={() => {
          setLoadError(null);
          setAttempt((n) => n + 1);
        }}
      />
    );
  }
  if (!items || !prefs) return <PageLoading />;

  return (
    <>
      <PageHero title="Notifications" crumb="Notifications" subtitle="Alertes de prix, ventes, suivi de vos commandes et de votre compte vendeur." />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <section className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display font-bold">Recevoir aussi par WhatsApp</p>
              <p className="mt-1 text-sm text-ink-2">
                {prefs.whatsappAvailable
                  ? "Vos notifications importantes vous sont envoyées sur le numéro de votre compte."
                  : "Bientôt disponible : vos notifications resteront ici en attendant."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.whatsappOptIn}
              aria-label="Recevoir les notifications par WhatsApp"
              onClick={() => toggleWhatsApp(!prefs.whatsappOptIn)}
              className={`relative h-7 w-12 flex-none rounded-full transition-colors ${prefs.whatsappOptIn ? "bg-brand" : "bg-line"}`}
            >
              <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all ${prefs.whatsappOptIn ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        </section>

        {items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-line bg-surface p-10 text-center">
            <p className="font-display text-lg font-extrabold">Aucune notification pour l&apos;instant</p>
            <p className="mt-1 text-sm text-ink-2">Créez une alerte de prix pour être prévenu quand un produit baisse.</p>
            <Link href="/alertes" className="mt-5 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand">
              Mes alertes de prix
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid gap-2.5">
            {items.map((n) => {
              const inner = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-display text-[15px] font-bold">{n.title}</p>
                    <span className="flex-none text-[11px] text-ink-2">{formatRelativeTime(n.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-2">{n.body}</p>
                </>
              );
              const cls = `block rounded-2xl border bg-surface p-4 ${n.readAt ? "border-line" : "border-brand/50"}`;
              return (
                <li key={n.id}>
                  {n.href ? (
                    <Link href={n.href} className={`${cls} hover:bg-surface-2`}>
                      {inner}
                    </Link>
                  ) : (
                    <div className={cls}>{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
