"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import {
  becomeVendor,
  getMyVendorListings,
  getMyVendorProfile,
  type VendorListingRecord,
  type VendorListingStatus,
  type VendorProfileRecord,
  type VendorType,
} from "@/lib/api";
import { formatFCFA, formatRelativeTime } from "@/lib/format";
import { ProductImage } from "@/components/product-image";
import { PageHero } from "@/components/page-hero";

const TYPE_LABEL: Record<VendorType, { title: string; desc: string }> = {
  PARTICULIER: { title: "Particulier", desc: "Je vends occasionnellement ma récolte ou mon surplus." },
  PROFESSIONNEL: { title: "Professionnel", desc: "Commerçant ou producteur régulier." },
  COOPERATIVE: { title: "Coopérative", desc: "Groupement de producteurs." },
};

const LISTING_STATUS_LABEL: Record<VendorListingStatus, string> = {
  EN_ATTENTE: "En attente de validation",
  A_CORRIGER: "À corriger",
  VALIDEE: "Validée · en attente de réception au magasin",
  EN_VENTE: "En vente",
  EPUISEE: "Épuisée",
  REFUSEE: "Refusée",
};

const LISTING_STATUS_TONE: Record<VendorListingStatus, string> = {
  EN_ATTENTE: "bg-accent-soft text-ink",
  A_CORRIGER: "bg-down/10 text-down",
  VALIDEE: "bg-brand-soft text-brand",
  EN_VENTE: "bg-up/10 text-up",
  EPUISEE: "bg-surface-2 text-ink-2",
  REFUSEE: "bg-down/10 text-down",
};

function BecomeVendorForm({ token, onDone }: { token: string; onDone: () => void }) {
  const [type, setType] = useState<VendorType>("PROFESSIONNEL");
  const [zone, setZone] = useState("Cotonou et environs");
  const [paymentInfo, setPaymentInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!paymentInfo.trim()) {
      setError("Indiquez comment recevoir vos ventes (ex. MTN MoMo).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await becomeVendor(token, type, zone, paymentInfo);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la demande.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm text-ink-2">
        Vous gardez votre compte acheteur, votre stock et votre portefeuille. Une fois validé par OBP Market, vous
        pourrez publier des annonces.
      </p>

      <div className="grid gap-2">
        <span className="text-xs font-semibold text-ink-2">Type de compte</span>
        {(Object.keys(TYPE_LABEL) as VendorType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            aria-pressed={type === t}
            className={`rounded-xl border p-3 text-left text-sm ${type === t ? "border-brand bg-brand-soft" : "border-line bg-surface"}`}
          >
            <span className="block font-semibold">{TYPE_LABEL[t].title}</span>
            <span className="text-xs text-ink-2">{TYPE_LABEL[t].desc}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="zone" className="text-xs font-semibold text-ink-2">Zone d&apos;activité</label>
        <input id="zone" value={zone} onChange={(e) => setZone(e.target.value)} className="rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand" />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="payment" className="text-xs font-semibold text-ink-2">Recevoir mes ventes sur</label>
        <input
          id="payment"
          placeholder="MTN MoMo · 01 xx xx xx"
          value={paymentInfo}
          onChange={(e) => setPaymentInfo(e.target.value)}
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>

      {error && <p className="rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}

      <button type="button" disabled={busy} onClick={submit} className="rounded-xl bg-brand py-3 text-sm font-semibold text-on-brand disabled:opacity-60">
        {busy ? "Envoi…" : "Envoyer ma demande"}
      </button>
      <p className="text-center text-[11px] text-ink-2">Validation par OBP Market sous 24 à 48 h.</p>
    </div>
  );
}

export default function VendorDashboardPage() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [profile, setProfile] = useState<VendorProfileRecord | null | undefined>(undefined);
  const [listings, setListings] = useState<VendorListingRecord[] | null>(null);

  function reload(t: string) {
    getMyVendorProfile(t).then((p) => {
      setProfile(p);
      if (p?.status === "ACTIF") getMyVendorListings(t).then(setListings);
    });
  }

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace("/connexion");
      return;
    }
    reload(token);
  }, [ready, token, router]);

  if (profile === undefined || !token) {
    return <main className="flex flex-1 items-center justify-center text-sm text-ink-2">Chargement…</main>;
  }

  return (
    <>
    <PageHero title="Espace vendeur" crumb="Vendeur" subtitle="Publiez vos produits : OBP Market modère vos annonces et réceptionne votre stock." />
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">

      {!profile && (
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="mb-3 font-display text-xl font-extrabold">Devenir vendeur</h2>
          <BecomeVendorForm token={token} onDone={() => reload(token)} />
        </div>
      )}

      {profile?.status === "EN_ATTENTE" && (
        <p className="mt-4 rounded-2xl border border-accent/40 bg-accent-soft p-5 text-sm">
          Votre demande de compte vendeur ({TYPE_LABEL[profile.type].title.toLowerCase()}, {profile.zone}) est en
          attente de validation par OBP Market.
        </p>
      )}

      {profile?.status === "REFUSE" && (
        <p className="mt-4 rounded-2xl border border-down/30 bg-down/10 p-5 text-sm text-down">
          Votre demande a été refusée. {profile.rejectionReason ?? ""}
        </p>
      )}

      {profile?.status === "ACTIF" && (
        <>
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-line bg-surface p-4">
            <div>
              <p className="text-xs text-ink-2">Compte vendeur actif</p>
              <p className="font-display font-bold">{TYPE_LABEL[profile.type].title} · {profile.zone}</p>
            </div>
            <Link href="/vendeur/nouvelle-annonce" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand">
              + Nouvelle annonce
            </Link>
          </div>

          <h2 className="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wide text-ink-2">Mes annonces</h2>
          {!listings ? (
            <p className="text-sm text-ink-2">Chargement…</p>
          ) : listings.length === 0 ? (
            <p className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-ink-2">
              Aucune annonce pour l&apos;instant.
            </p>
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
              {listings.map((l) => {
                return (
                  <li key={l.id} className="flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
                    <ProductImage product={l.product} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold">{l.product.name}</p>
                      <p className="text-xs text-ink-2">
                        {l.status === "EN_VENTE" || l.status === "EPUISEE" ? l.receivedQuantity : l.quantity}{" "}
                        {l.product.unitLabel} · {formatFCFA(l.unitPrice)} F · {formatRelativeTime(l.createdAt)}
                      </p>
                      {l.status === "A_CORRIGER" && l.rejectionReason && (
                        <p className="mt-0.5 text-xs text-down">À corriger : {l.rejectionReason}</p>
                      )}
                      {l.status === "REFUSEE" && l.rejectionReason && (
                        <p className="mt-0.5 text-xs text-down">Motif : {l.rejectionReason}</p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${LISTING_STATUS_TONE[l.status]}`}>
                      {LISTING_STATUS_LABEL[l.status]}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </main>
    </>
  );
}
