"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createDeliveryZone,
  createDepot,
  deleteDeliveryZone,
  deleteDepot,
  getDeliveryZonesAdmin,
  getDepotsAdmin,
  updateDeliveryZone,
  updateDepot,
  type DeliveryZone,
  type DepotAdmin,
} from "@/lib/api";
import { formatFCFA } from "@/lib/format";
import { BackofficePage, btnGhost, btnPrimary, Empty, inputCls, Notice, type StaffContext } from "@/components/backoffice-page";

interface DepotForm {
  name: string;
  city: string;
  address: string;
  phone: string;
  latitude: string;
  longitude: string;
}
const EMPTY_DEPOT: DepotForm = { name: "", city: "", address: "", phone: "", latitude: "", longitude: "" };
const EMPTY_ZONE = { name: "", fee: "", depotId: "" };

function Depots({ token, user }: StaffContext) {
  const [depots, setDepots] = useState<DepotAdmin[] | null>(null);
  const [zones, setZones] = useState<DeliveryZone[] | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<DepotForm>(EMPTY_DEPOT);
  const [zoneForm, setZoneForm] = useState<{ id: string | null; name: string; fee: string; depotId: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const isAdmin = user.role === "ADMIN";

  const load = useCallback(() => {
    Promise.all([getDepotsAdmin(token), getDeliveryZonesAdmin(token)])
      .then(([d, z]) => {
        setDepots(d);
        setZones(z);
      })
      .catch((e: Error) => setMsg({ kind: "error", text: e.message }));
  }, [token]);
  useEffect(load, [load]);

  async function run(action: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setMsg(null);
    try {
      await action();
      setMsg({ kind: "ok", text: ok });
      load();
      return true;
    } catch (e) {
      setMsg({ kind: "error", text: e instanceof Error ? e.message : "Échec de l'action." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  function startEdit(d: DepotAdmin | null) {
    setEditing(d ? d.id : "new");
    setForm(d ? { name: d.name, city: d.city, address: d.address, phone: d.phone ?? "", latitude: d.latitude?.toString() ?? "", longitude: d.longitude?.toString() ?? "" } : EMPTY_DEPOT);
    setMsg(null);
  }

  async function saveDepot() {
    const lat = form.latitude.trim() ? Number(form.latitude.replace(",", ".")) : undefined;
    const lng = form.longitude.trim() ? Number(form.longitude.replace(",", ".")) : undefined;
    const data = { name: form.name.trim(), city: form.city.trim(), address: form.address.trim(), phone: form.phone.trim() || undefined, latitude: lat, longitude: lng };
    const ok = await run(() => (editing === "new" ? createDepot(token, data) : updateDepot(token, editing!, data)), editing === "new" ? "Dépôt créé." : "Dépôt modifié.");
    if (ok) setEditing(null);
  }

  async function saveZone() {
    if (!zoneForm) return;
    const data = { name: zoneForm.name.trim(), fee: Number(zoneForm.fee) };
    const ok = await run(
      () => (zoneForm.id ? updateDeliveryZone(token, zoneForm.id, { ...data, depotId: zoneForm.depotId || null }) : createDeliveryZone(token, { ...data, depotId: zoneForm.depotId || undefined })),
      zoneForm.id ? "Zone modifiée." : "Zone créée.",
    );
    if (ok) setZoneForm(null);
  }

  const depotValid = form.name.trim().length >= 2 && form.city.trim().length >= 2 && form.address.trim().length >= 3;
  const zoneValid = !!zoneForm && zoneForm.name.trim().length >= 2 && zoneForm.fee !== "" && Number(zoneForm.fee) >= 0;

  return (
    <div className="grid gap-8">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <section aria-label="Dépôts" className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold">Dépôts et magasins</h2>
          <button type="button" onClick={() => startEdit(null)} className={btnPrimary}>
            + Nouveau dépôt
          </button>
        </div>

        {editing && (
          <div className="grid gap-3 rounded-2xl border border-brand/40 bg-surface p-5">
            <h3 className="font-display font-bold">{editing === "new" ? "Nouveau dépôt" : "Modifier le dépôt"}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["name", "Nom (ex. Magasin Cotonou Akpakpa)"],
                  ["city", "Ville"],
                  ["address", "Adresse"],
                  ["phone", "Téléphone (facultatif)"],
                  ["latitude", "Latitude (facultatif)"],
                  ["longitude", "Longitude (facultatif)"],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="grid gap-1 text-xs font-semibold text-ink-2">
                  {label}
                  <input className={inputCls} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" disabled={busy || !depotValid} onClick={saveDepot} className={btnPrimary}>
                Enregistrer
              </button>
              <button type="button" onClick={() => setEditing(null)} className={btnGhost}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {!depots ? (
          <Empty>Chargement…</Empty>
        ) : depots.length === 0 ? (
          <Empty>Aucun dépôt pour l&apos;instant. Créez le premier : c&apos;est là que la marchandise des vendeurs sera reçue, stockée et remise aux clients.</Empty>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {depots.map((d) => (
              <article key={d.id} className={`grid gap-2 rounded-2xl border border-line bg-surface p-4 ${d.active ? "" : "opacity-60"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display font-bold">
                      {d.name}
                      {!d.active && <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-[10px]">désactivé</span>}
                    </h3>
                    <p className="text-sm text-ink-2">
                      {d.address} · {d.city}
                    </p>
                    {d.phone && <p className="text-xs text-ink-2">{d.phone}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 text-xs font-bold">
                    <button type="button" className="text-brand" onClick={() => startEdit(d)}>
                      Modifier
                    </button>
                    <button type="button" disabled={busy} className={d.active ? "text-down" : "text-brand"} onClick={() => run(() => updateDepot(token, d.id, { active: !d.active }), d.active ? "Dépôt désactivé." : "Dépôt réactivé.")}>
                      {d.active ? "Désactiver" : "Réactiver"}
                    </button>
                    {isAdmin && d._count.listings === 0 && (
                      <button type="button" disabled={busy} className="text-down" onClick={() => confirm(`Supprimer le dépôt « ${d.name} » ?`) && run(() => deleteDepot(token, d.id), "Dépôt supprimé.")}>
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-ink-2">
                  {d._count.listings} annonce(s) reçue(s) · {d._count.zones} zone(s) de livraison
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section aria-label="Zones de livraison" className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold">Livraison à domicile : zones et frais</h2>
            <p className="text-sm text-ink-2">La livraison est assurée par OBP depuis le dépôt de rattachement. Les frais s&apos;ajoutent à la commande.</p>
          </div>
          <button type="button" onClick={() => setZoneForm({ id: null, ...EMPTY_ZONE })} className={btnPrimary}>
            + Nouvelle zone
          </button>
        </div>

        {zoneForm && (
          <div className="grid gap-3 rounded-2xl border border-brand/40 bg-surface p-5">
            <h3 className="font-display font-bold">{zoneForm.id ? "Modifier la zone" : "Nouvelle zone"}</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-1 text-xs font-semibold text-ink-2">
                Nom de la zone (ex. Cotonou centre)
                <input className={inputCls} value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-ink-2">
                Frais de livraison (F)
                <input inputMode="numeric" className={inputCls} value={zoneForm.fee} onChange={(e) => setZoneForm({ ...zoneForm, fee: e.target.value.replace(/\D/g, "") })} />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-ink-2">
                Livrée depuis
                <select className={inputCls} value={zoneForm.depotId} onChange={(e) => setZoneForm({ ...zoneForm, depotId: e.target.value })}>
                  <option value="">Tous les dépôts</option>
                  {(depots ?? [])
                    .filter((d) => d.active)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} · {d.city}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <div className="flex gap-2">
              <button type="button" disabled={busy || !zoneValid} onClick={saveZone} className={btnPrimary}>
                Enregistrer
              </button>
              <button type="button" onClick={() => setZoneForm(null)} className={btnGhost}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {!zones ? (
          <Empty>Chargement…</Empty>
        ) : zones.length === 0 ? (
          <Empty>Aucune zone de livraison : les clients ne peuvent que retirer leur commande au magasin.</Empty>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-surface-2 text-left text-[11px] uppercase tracking-wide text-ink-2">
                <tr>
                  <th className="px-3 py-2">Zone</th>
                  <th className="px-3 py-2">Livrée depuis</th>
                  <th className="px-3 py-2 text-right">Frais</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z.id} className={`border-t border-line ${z.active ? "" : "opacity-60"}`}>
                    <td className="px-3 py-2 font-semibold">
                      {z.name}
                      {!z.active && <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-[10px]">désactivée</span>}
                    </td>
                    <td className="px-3 py-2 text-ink-2">{z.depot ? `${z.depot.name} · ${z.depot.city}` : "Tous les dépôts"}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatFCFA(z.fee)} F</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right text-xs font-bold">
                      <button type="button" className="mr-3 text-brand" onClick={() => setZoneForm({ id: z.id, name: z.name, fee: String(z.fee), depotId: z.depotId ?? "" })}>
                        Modifier
                      </button>
                      <button type="button" disabled={busy} className="mr-3" onClick={() => run(() => updateDeliveryZone(token, z.id, { active: !z.active }), z.active ? "Zone désactivée." : "Zone réactivée.")}>
                        {z.active ? "Désactiver" : "Réactiver"}
                      </button>
                      <button type="button" disabled={busy} className="text-down" onClick={() => confirm(`Supprimer la zone « ${z.name} » ?`) && run(() => deleteDeliveryZone(token, z.id), "Zone supprimée.")}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function DepotsPage() {
  return (
    <BackofficePage roles={["GESTIONNAIRE_LIQUIDITE", "ADMIN"]} title="Dépôts et livraison" subtitle="Les magasins et dépôts OBP, et les zones de livraison à domicile avec leurs frais. Vous pouvez en ajouter ou en modifier à tout moment.">
      {(ctx) => <Depots {...ctx} />}
    </BackofficePage>
  );
}
