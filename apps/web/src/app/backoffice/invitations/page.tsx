"use client";

import { useCallback, useEffect, useState } from "react";
import { createVendorInvite, getVendorInvites, revokeVendorInvite, type VendorInviteRecord, type VendorInviteState, type VendorType } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { BackofficePage, btnGhost, btnPrimary, Empty, inputCls, Notice, type StaffContext } from "@/components/backoffice-page";

const STATE: Record<VendorInviteState, { label: string; tone: string }> = {
  ACTIVE: { label: "En attente", tone: "bg-accent-soft text-ink" },
  USED: { label: "Utilisée", tone: "bg-up/10 text-up" },
  EXPIRED: { label: "Expirée", tone: "bg-surface-2 text-ink-2" },
  REVOKED: { label: "Annulée", tone: "bg-down/10 text-down" },
};

const TYPES: Array<{ value: VendorType | ""; label: string }> = [
  { value: "", label: "Au choix de l'invité" },
  { value: "PARTICULIER", label: "Particulier" },
  { value: "PROFESSIONNEL", label: "Professionnel" },
  { value: "COOPERATIVE", label: "Coopérative" },
];

const linkOf = (path: string) => `${window.location.origin}${path}`;

function messageFor(invite: VendorInviteRecord) {
  const until = new Date(invite.expiresAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  return `Bonjour, OBP Market vous invite à devenir vendeur partenaire. Ouvrez ce lien privé pour activer votre espace vendeur (valable jusqu'au ${until}) : ${linkOf(invite.path)}`;
}

function whatsappUrl(invite: VendorInviteRecord) {
  const digits = invite.phone?.replace(/\D/g, "");
  return `https://wa.me/${digits ?? ""}?text=${encodeURIComponent(messageFor(invite))}`;
}

function Invitations({ token }: StaffContext) {
  const [invites, setInvites] = useState<VendorInviteRecord[] | null>(null);
  const [fresh, setFresh] = useState<VendorInviteRecord | null>(null);
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<VendorType | "">("");
  const [zone, setZone] = useState("");
  const [days, setDays] = useState("14");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(() => {
    getVendorInvites(token)
      .then(setInvites)
      .catch((e: Error) => setMsg({ kind: "error", text: e.message }));
  }, [token]);
  useEffect(load, [load]);

  async function copy(invite: VendorInviteRecord) {
    try {
      await navigator.clipboard.writeText(linkOf(invite.path));
      setMsg({ kind: "ok", text: "Lien copié : collez-le dans votre message." });
    } catch {
      setMsg({ kind: "error", text: "Copie impossible : sélectionnez le lien et copiez-le à la main." });
    }
  }

  async function create() {
    setBusy(true);
    setMsg(null);
    try {
      const created = await createVendorInvite(token, {
        note: note.trim(),
        phone: phone.trim() || undefined,
        type: type || undefined,
        zone: zone.trim() || undefined,
        validDays: Number(days) || 14,
      });
      setFresh(created);
      setNote("");
      setPhone("");
      setType("");
      setZone("");
      load();
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "Échec de la création." });
    } finally {
      setBusy(false);
    }
  }

  async function revoke(i: VendorInviteRecord) {
    if (!confirm(`Annuler l'invitation de « ${i.note} » ? Le lien ne fonctionnera plus.`)) return;
    try {
      await revokeVendorInvite(token, i.id);
      setMsg({ kind: "ok", text: "Invitation annulée." });
      if (fresh?.id === i.id) setFresh(null);
      load();
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "Échec de l'annulation." });
    }
  }

  return (
    <div className="grid gap-6">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <section className="grid gap-4 rounded-2xl border border-line bg-surface p-5">
        <div>
          <h2 className="font-display text-lg font-bold">Inviter un partenaire</h2>
          <p className="text-sm text-ink-2">
            Le compte vendeur ne s&apos;ouvre que sur invitation. Une fois le partenariat conclu, créez l&apos;invitation et envoyez le lien en message
            direct : la personne se connecte, remplit sa zone et son moyen de paiement, et son espace vendeur est actif.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-semibold text-ink-2 sm:col-span-2">
            Pour qui ? (mémo interne, jamais montré à l&apos;invité)
            <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. Coopérative des producteurs de Bohicon" />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-ink-2">
            Téléphone (facultatif : réserve l&apos;invitation à ce numéro)
            <input type="tel" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+229 97 00 00 00" />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-ink-2">
            Validité du lien (jours)
            <input inputMode="numeric" className={inputCls} value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))} />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-ink-2">
            Type de compte proposé
            <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as VendorType | "")}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-ink-2">
            Zone proposée (facultatif)
            <input className={inputCls} value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Ex. Bohicon et environs" />
          </label>
        </div>
        <div>
          <button type="button" disabled={busy || note.trim().length < 2} onClick={create} className={btnPrimary}>
            {busy ? "Création…" : "Créer l'invitation"}
          </button>
        </div>
      </section>

      {fresh && (
        <section className="grid gap-3 rounded-2xl border border-brand/40 bg-brand-soft p-5" role="status">
          <p className="font-display font-bold">Invitation créée pour « {fresh.note} »</p>
          <p className="select-all break-all rounded-xl bg-surface px-3 py-2.5 font-mono text-sm">{linkOf(fresh.path)}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => copy(fresh)} className={btnPrimary}>
              Copier le lien
            </button>
            <a href={whatsappUrl(fresh)} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white hover:brightness-95">
              Envoyer par WhatsApp
            </a>
            <button type="button" onClick={() => setFresh(null)} className={btnGhost}>
              Fermer
            </button>
          </div>
          <p className="text-xs text-ink-2">Le lien est personnel et à usage unique. Envoyez-le en message direct, pas dans un groupe.</p>
        </section>
      )}

      <section aria-label="Invitations envoyées" className="grid gap-3">
        <h2 className="font-display text-lg font-bold">Invitations</h2>
        {!invites ? (
          <Empty>Chargement…</Empty>
        ) : invites.length === 0 ? (
          <Empty>Aucune invitation pour l&apos;instant.</Empty>
        ) : (
          <ul className="grid gap-2.5">
            {invites.map((i) => (
              <li key={i.id} className="grid gap-2 rounded-2xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-bold">{i.note}</p>
                    <p className="text-xs text-ink-2">
                      Créée {formatRelativeTime(i.createdAt)}
                      {i.createdBy ? ` par ${i.createdBy}` : ""}
                      {i.phone ? ` · réservée au ${i.phone}` : ""}
                      {i.state === "ACTIVE" ? ` · expire le ${new Date(i.expiresAt).toLocaleDateString("fr-FR")}` : ""}
                    </p>
                    {i.state === "USED" && i.usedBy && (
                      <p className="text-xs text-up">
                        Utilisée par {i.usedBy.fullName !== "Nouveau client" ? i.usedBy.fullName : i.usedBy.phone} ({i.usedBy.phone})
                        {i.usedAt ? `, ${formatRelativeTime(i.usedAt)}` : ""}
                      </p>
                    )}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATE[i.state].tone}`}>{STATE[i.state].label}</span>
                </div>
                {i.state === "ACTIVE" && (
                  <div className="flex flex-wrap gap-3 text-xs font-bold">
                    <button type="button" onClick={() => copy(i)} className="text-brand">
                      Copier le lien
                    </button>
                    <a href={whatsappUrl(i)} target="_blank" rel="noopener noreferrer" className="text-[#128C7E]">
                      Envoyer par WhatsApp
                    </a>
                    <button type="button" onClick={() => revoke(i)} className="text-down">
                      Annuler
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function InvitationsPage() {
  return (
    <BackofficePage roles={["MODERATEUR", "ADMIN"]} title="Invitations vendeurs" subtitle="Le compte vendeur s'ouvre uniquement avec un lien d'invitation, envoyé en message direct après un partenariat." width="max-w-4xl">
      {(ctx) => <Invitations {...ctx} />}
    </BackofficePage>
  );
}
