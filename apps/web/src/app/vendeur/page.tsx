"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import {
  becomeVendor,
  cancelVendorListing,
  getMyVendorListings,
  getMyVendorProfile,
  updateVendorProfile,
  type VendorListingRecord,
  type VendorListingStatus,
  type VendorProfileRecord,
  type VendorType,
} from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { Money } from "@/components/money";
import { ProductImage } from "@/components/product-image";
import { VendorLanding } from "@/components/vendor-landing";
import { VendorShopPanel } from "@/components/vendor-shop-panel";
import { LoadError, PageLoading } from "@/components/page-state";

const TYPE_LABEL: Record<VendorType, { title: string; desc: string }> = {
  PARTICULIER: { title: "Particulier", desc: "Je vends occasionnellement ma récolte ou mon surplus." },
  PROFESSIONNEL: { title: "Professionnel", desc: "Commerçant ou producteur régulier." },
  COOPERATIVE: { title: "Coopérative", desc: "Groupement de producteurs." },
};

const LISTING_STATUS_LABEL: Record<VendorListingStatus, string> = {
  EN_ATTENTE: "En cours de vérification",
  A_CORRIGER: "À corriger",
  VALIDEE: "Validée · à déposer au magasin",
  EN_VENTE: "En vente",
  EPUISEE: "Épuisée",
  REFUSEE: "Refusée",
};

const LISTING_STATUS_TONE: Record<VendorListingStatus, string> = {
  EN_ATTENTE: "bg-accent-soft text-accent",
  A_CORRIGER: "bg-down/10 text-down",
  VALIDEE: "bg-brand-soft text-brand",
  EN_VENTE: "bg-up/10 text-up",
  EPUISEE: "bg-surface-2 text-ink-2",
  REFUSEE: "bg-down/10 text-down",
};

const field = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand";

function VendorForm({ token, initial, onDone, submitLabel }: { token: string; initial?: VendorProfileRecord; onDone: () => void; submitLabel: string }) {
  const [type, setType] = useState<VendorType>(initial?.type ?? "PROFESSIONNEL");
  const [zone, setZone] = useState(initial?.zone ?? "Cotonou et environs");
  const [paymentInfo, setPaymentInfo] = useState(initial?.paymentInfo ?? "");
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
      <div className="grid gap-2">
        <span className="text-xs font-semibold text-ink-2">Type de compte</span>
        {(Object.keys(TYPE_LABEL) as VendorType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            aria-pressed={type === t}
            className={`rounded-xl border-2 p-3 text-left text-sm ${type === t ? "border-brand bg-brand-soft" : "border-line bg-surface"}`}
          >
            <span className="block font-bold">{TYPE_LABEL[t].title}</span>
            <span className="text-xs text-ink-2">{TYPE_LABEL[t].desc}</span>
          </button>
        ))}
      </div>

      <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
        Zone d&apos;activité
        <input value={zone} onChange={(e) => setZone(e.target.value)} className={field} />
      </label>

      <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
        Recevoir mes ventes sur
        <input placeholder="MTN MoMo · 01 xx xx xx xx" value={paymentInfo} onChange={(e) => setPaymentInfo(e.target.value)} className={field} />
      </label>

      {error && <p className="rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}

      <button type="button" disabled={busy} onClick={submit} className="rounded-xl bg-brand py-3.5 text-sm font-bold text-on-brand disabled:opacity-60">
        {busy ? "Envoi…" : submitLabel}
      </button>
      <p className="text-center text-[11px] text-ink-2">Validation par OBP Market sous 24 à 48 h.</p>
    </div>
  );
}

function ProfileCard({ token, profile, onSaved }: { token: string; profile: VendorProfileRecord; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [zone, setZone] = useState(profile.zone);
  const [paymentInfo, setPaymentInfo] = useState(profile.paymentInfo);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await updateVendorProfile(token, { zone, paymentInfo });
      setEditing(false);
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-up">Compte vendeur actif</p>
          <p className="mt-1 font-display text-lg font-extrabold">
            {TYPE_LABEL[profile.type].title} · {profile.zone}
          </p>
          <p className="text-sm text-ink-2">Paiement : {profile.paymentInfo}</p>
        </div>
        <button type="button" onClick={() => setEditing((v) => !v)} className="flex-none text-sm font-bold text-brand">
          {editing ? "Annuler" : "Modifier"}
        </button>
      </div>
      {editing && (
        <div className="mt-4 grid gap-3 border-t border-line pt-4">
          <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
            Zone d&apos;activité
            <input value={zone} onChange={(e) => setZone(e.target.value)} className={field} />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-ink-2">
            Recevoir mes ventes sur
            <input value={paymentInfo} onChange={(e) => setPaymentInfo(e.target.value)} className={field} />
          </label>
          <button type="button" disabled={busy || !zone.trim() || !paymentInfo.trim()} onClick={save} className="w-fit rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-on-brand disabled:opacity-60">
            {busy ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      )}
    </div>
  );
}

function ListingRow({ l, onCancel, busy }: { l: VendorListingRecord; onCancel: (l: VendorListingRecord) => void; busy: boolean }) {
  const canEdit = l.status === "A_CORRIGER" || l.status === "EN_ATTENTE";
  const canCancel = l.status !== "EN_VENTE" && l.status !== "EPUISEE";
  const onSale = l.status === "EN_VENTE" || l.status === "EPUISEE";

  return (
    <li className="grid gap-3 border-t border-line p-4 first:border-t-0 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <ProductImage product={l.product} size="md" />
      <div className="min-w-0">
        <p className="font-display font-bold">{l.product.name}</p>
        <p className="text-xs text-ink-2">
          {onSale ? `${l.receivedQuantity} restant${l.receivedQuantity > 1 ? "s" : ""} sur ${l.quantity}` : `${l.quantity}`} {l.product.unitLabel} ·{" "}
          <Money value={l.unitPrice} /> · {formatRelativeTime(l.createdAt)}
        </p>
        {(l.status === "A_CORRIGER" || l.status === "REFUSEE") && l.rejectionReason && (
          <p className="mt-1 rounded-lg bg-down/10 px-2.5 py-1.5 text-xs text-down">
            <span className="font-bold">{l.status === "A_CORRIGER" ? "À corriger : " : "Motif du refus : "}</span>
            {l.rejectionReason}
          </p>
        )}
        {l.status === "VALIDEE" && (
          <p className="mt-1 text-xs font-semibold text-brand">Votre annonce est validée : déposez le stock au magasin OBP Market pour la mettre en vente.</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${LISTING_STATUS_TONE[l.status]}`}>{LISTING_STATUS_LABEL[l.status]}</span>
        <div className="flex gap-2 text-xs font-bold">
          {canEdit && (
            <Link href={`/vendeur/annonces/${l.id}/modifier`} className="rounded-lg border border-line px-3 py-1.5 hover:bg-surface-2">
              {l.status === "A_CORRIGER" ? "Corriger" : "Modifier"}
            </Link>
          )}
          {canCancel && (
            <button type="button" disabled={busy} onClick={() => onCancel(l)} className="rounded-lg border border-down/40 px-3 py-1.5 text-down hover:bg-down/10 disabled:opacity-60">
              Retirer
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

export default function VendorPage() {
  const { token, ready } = useAuth();
  const [profile, setProfile] = useState<VendorProfileRecord | null | undefined>(undefined);
  const [listings, setListings] = useState<VendorListingRecord[] | null>(null);
  const [reapply, setReapply] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);

  function reload(t: string) {
    getMyVendorProfile(t)
      .then((p) => {
        setProfile(p);
        if (p?.status === "ACTIF") return getMyVendorListings(t).then(setListings);
      })
      .catch((err: Error) => setLoadError(err.message));
  }

  useEffect(() => {
    if (ready && token) reload(token);
  }, [ready, token]);

  async function cancel(l: VendorListingRecord) {
    if (!token || !window.confirm(`Retirer l'annonce « ${l.product.name} » ?`)) return;
    setBusy(true);
    setError(null);
    try {
      await cancelVendorListing(token, l.id);
      reload(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du retrait.");
    } finally {
      setBusy(false);
    }
  }

  if (token && loadError) {
    return (
      <LoadError
        message={loadError}
        onRetry={() => {
          setLoadError(null);
          reload(token);
        }}
      />
    );
  }

  // Sans session, il n'y a rien à charger : on passe directement à la présentation du programme.
  if (!ready || (token && profile === undefined)) return <PageLoading />;

  const shell = (children: React.ReactNode) => <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>;

  // Visiteur non connecté : présentation du programme, avec connexion puis retour ici.
  if (!token) {
    return shell(
      <VendorLanding
        cta={
          <>
            <Link href="/connexion?next=/vendeur" className="rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-[#15172b]">
              Devenir vendeur
            </Link>
            <Link href="/comment-ca-marche" className="rounded-xl border border-white/40 px-7 py-3.5 text-sm font-bold">
              Comment ça marche
            </Link>
          </>
        }
      />,
    );
  }

  // Connecté, pas encore vendeur (ou demande refusée à redéposer).
  if (!profile || (profile.status === "REFUSE" && reapply)) {
    return shell(
      <div className="grid gap-10">
        <div className="mx-auto w-full max-w-xl rounded-3xl border border-line bg-surface p-6 sm:p-8">
          <h1 className="font-display text-2xl font-extrabold">{profile ? "Refaire ma demande" : "Devenir vendeur"}</h1>
          <p className="mt-1 mb-5 text-sm text-ink-2">
            Vous gardez votre compte acheteur, votre stock et votre portefeuille. Une fois validé par OBP Market, vous pourrez publier des annonces.
          </p>
          <VendorForm token={token} initial={profile ?? undefined} submitLabel={profile ? "Renvoyer ma demande" : "Envoyer ma demande"} onDone={() => { setReapply(false); reload(token); }} />
        </div>
        <VendorLanding cta={null} />
      </div>,
    );
  }

  if (profile.status === "EN_ATTENTE") {
    return shell(
      <div className="mx-auto max-w-xl rounded-3xl border border-line bg-surface p-8 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-accent-soft text-accent">
          <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold">Demande en cours de vérification</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          Votre demande de compte vendeur ({TYPE_LABEL[profile.type].title.toLowerCase()}, {profile.zone}) est en cours d&apos;examen par OBP Market. Réponse sous 24 à 48 h.
        </p>
        <Link href="/contact" className="mt-5 inline-block text-sm font-bold text-brand">
          Une question ? Contactez-nous
        </Link>
      </div>,
    );
  }

  if (profile.status === "REFUSE") {
    return shell(
      <div className="mx-auto max-w-xl rounded-3xl border border-down/30 bg-surface p-8 text-center">
        <h1 className="font-display text-2xl font-extrabold">Demande non retenue</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{profile.rejectionReason || "Votre demande n'a pas pu être validée pour le moment."}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => setReapply(true)} className="rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand">
            Refaire une demande
          </button>
          <Link href="/contact" className="rounded-xl border border-line px-6 py-3 text-sm font-bold hover:bg-surface-2">
            Nous contacter
          </Link>
        </div>
      </div>,
    );
  }

  if (profile.status === "SUSPENDU") {
    return shell(
      <div className="mx-auto max-w-xl rounded-3xl border border-down/30 bg-surface p-8 text-center">
        <h1 className="font-display text-2xl font-extrabold">Compte vendeur suspendu</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          {profile.rejectionReason || "Votre compte vendeur est suspendu."} Vos annonces ne sont plus mises en vente. Contactez OBP Market pour en savoir plus.
        </p>
        <Link href="/contact" className="mt-5 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand">
          Nous contacter
        </Link>
      </div>,
    );
  }

  // Compte actif : tableau de bord.
  const list = listings ?? [];
  const count = (...s: VendorListingStatus[]) => list.filter((l) => s.includes(l.status)).length;
  const stats = [
    { label: "En vente", value: count("EN_VENTE"), tone: "text-up" },
    { label: "En vérification", value: count("EN_ATTENTE", "VALIDEE"), tone: "text-accent" },
    { label: "À corriger", value: count("A_CORRIGER"), tone: count("A_CORRIGER") > 0 ? "text-down" : "text-ink" },
  ];

  return shell(
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Espace vendeur</h1>
          <p className="text-sm text-ink-2">Vos annonces, leur suivi et vos gains.</p>
        </div>
        <Link href="/vendeur/nouvelle-annonce" className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-on-brand">
          + Nouvelle annonce
        </Link>
      </div>

      <ProfileCard token={token} profile={profile} onSaved={() => reload(token)} />

      <VendorShopPanel token={token} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface p-4 text-center">
            <p className={`font-display text-3xl font-extrabold tabular-nums ${s.tone}`}>{s.value}</p>
            <p className="text-xs text-ink-2">{s.label}</p>
          </div>
        ))}
        <Link href="/portefeuille" className="rounded-2xl bg-brand p-4 text-center text-on-brand">
          <p className="font-display text-lg font-extrabold">Portefeuille</p>
          <p className="text-xs opacity-85">Voir mes gains →</p>
        </Link>
      </div>

      {error && <p className="rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}

      <section>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-2">Mes annonces</h2>
        {!listings ? (
          <p className="text-sm text-ink-2">Chargement…</p>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-10 text-center">
            <p className="font-display text-lg font-extrabold">Aucune annonce pour l&apos;instant</p>
            <p className="mt-1 text-sm text-ink-2">Publiez votre première annonce : OBP Market la vérifie sous 24 à 48 h.</p>
            <Link href="/vendeur/nouvelle-annonce" className="mt-5 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand">
              Publier une annonce
            </Link>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
            {list.map((l) => (
              <ListingRow key={l.id} l={l} onCancel={cancel} busy={busy} />
            ))}
          </ul>
        )}
      </section>
    </div>,
  );
}
