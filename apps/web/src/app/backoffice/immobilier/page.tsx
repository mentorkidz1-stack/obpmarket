"use client";

import { useEffect, useState } from "react";
import {
  createProperty,
  deleteProperty,
  getAllProperties,
  getPropertyInquiries,
  parseProductPhotos,
  setPropertyInquiryHandled,
  updateProperty,
  type AreaUnit,
  type Property,
  type PropertyInput,
  type PropertyInquiryRecord,
  type PropertyKind,
  type PropertyStatus,
  type PropertyType,
  type RentPeriod,
} from "@/lib/api";
import { formatFCFA, formatRelativeTime } from "@/lib/format";
import { resizeImageFile } from "@/lib/image";
import { AREA_UNITS, KIND_LABEL, PROPERTY_TYPES, RENT_PERIODS, formatArea, parseCoords, statusLabel, typeLabel } from "@/lib/property";
import { useStaffSession } from "@/lib/staff-session";
import { StaffBar } from "@/components/staff-bar";

type Row = Property & { _count: { inquiries: number } };

interface FormState {
  title: string;
  type: PropertyType;
  kind: PropertyKind;
  status: PropertyStatus;
  published: boolean;
  featured: boolean;
  city: string;
  district: string;
  areaValue: string;
  areaUnit: AreaUnit;
  coords: string;
  bedrooms: string;
  bathrooms: string;
  titleDeed: string;
  price: string;
  rentPeriod: RentPeriod;
  negotiable: boolean;
  description: string;
  photos: string[];
}

const EMPTY: FormState = {
  title: "",
  type: "PARCELLE",
  kind: "VENTE",
  status: "DISPONIBLE",
  published: true,
  featured: false,
  city: "",
  district: "",
  areaValue: "",
  areaUnit: "M2",
  coords: "",
  bedrooms: "",
  bathrooms: "",
  titleDeed: "",
  price: "",
  rentPeriod: "MOIS",
  negotiable: false,
  description: "",
  photos: [],
};

const HOUSING: PropertyType[] = ["MAISON", "APPARTEMENT", "CHAMBRE", "GUEST_HOUSE"];

function toForm(p: Property): FormState {
  return {
    title: p.title,
    type: p.type,
    kind: p.kind,
    status: p.status,
    published: p.published,
    featured: p.featured,
    city: p.city,
    district: p.district ?? "",
    areaValue: p.areaValue != null ? String(p.areaValue) : "",
    areaUnit: p.areaUnit,
    coords: p.latitude != null && p.longitude != null ? `${p.latitude}, ${p.longitude}` : "",
    bedrooms: p.bedrooms != null ? String(p.bedrooms) : "",
    bathrooms: p.bathrooms != null ? String(p.bathrooms) : "",
    titleDeed: p.titleDeed ?? "",
    price: String(p.price),
    rentPeriod: p.rentPeriod ?? "MOIS",
    negotiable: p.negotiable,
    description: p.description,
    photos: parseProductPhotos(p),
  };
}

const field = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand";
const lbl = "grid gap-1.5 text-xs font-semibold text-ink-2";

export default function PropertiesAdminPage() {
  const { user, token, authorized, logout } = useStaffSession(["MODERATEUR", "ADMIN"]);
  const [tab, setTab] = useState<"biens" | "demandes">("biens");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [inquiries, setInquiries] = useState<PropertyInquiryRecord[] | null>(null);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reload(t: string) {
    getAllProperties(t).then(setRows).catch((e: Error) => setError(e.message));
    getPropertyInquiries(t).then(setInquiries).catch(() => {});
  }

  useEffect(() => {
    if (token) reload(token);
  }, [token]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  function openNew() {
    setForm(EMPTY);
    setEditingId("new");
    setError(null);
  }

  function openEdit(p: Property) {
    setForm(toForm(p));
    setEditingId(p.id);
    setError(null);
  }

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    const room = 10 - form.photos.length;
    if (room <= 0) return;
    setBusy(true);
    setError(null);
    try {
      const resized = await Promise.all(Array.from(files).slice(0, room).map((f) => resizeImageFile(f, 1400, 0.8)));
      setForm((f) => ({ ...f, photos: [...f.photos, ...resized] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du traitement de la photo.");
    } finally {
      setBusy(false);
    }
  }

  function movePhotoFirst(i: number) {
    setForm((f) => ({ ...f, photos: [f.photos[i], ...f.photos.filter((_, j) => j !== i)] }));
  }

  async function save() {
    if (!token) return;
    const price = Number(form.price);
    if (!form.title.trim() || !form.city.trim() || !Number.isFinite(price) || price < 0 || form.price === "") {
      setError("Le titre, la ville et le prix sont obligatoires.");
      return;
    }
    const num = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));
    const area = num(form.areaValue);
    if (area != null && (!Number.isFinite(area) || area < 0)) {
      setError("La superficie doit être un nombre positif.");
      return;
    }

    const coords = form.coords.trim() === "" ? null : parseCoords(form.coords);
    if (form.coords.trim() !== "" && !coords) {
      setError("Position GPS invalide : écrivez « latitude, longitude » (ex. 6.3577, 2.3586) ou laissez vide.");
      return;
    }

    const housing = HOUSING.includes(form.type);
    const payload: PropertyInput = {
      latitude: coords ? coords[0] : null,
      longitude: coords ? coords[1] : null,
      title: form.title.trim(),
      type: form.type,
      kind: form.kind,
      status: form.status,
      published: form.published,
      featured: form.featured,
      city: form.city.trim(),
      district: form.district.trim() || null,
      areaValue: area,
      areaUnit: form.areaUnit,
      bedrooms: housing ? num(form.bedrooms) : null,
      bathrooms: housing ? num(form.bathrooms) : null,
      titleDeed: form.titleDeed.trim() || null,
      price,
      rentPeriod: form.kind === "LOCATION" ? form.rentPeriod : null,
      negotiable: form.negotiable,
      description: form.description.trim(),
      photos: form.photos,
    };

    setBusy(true);
    setError(null);
    try {
      if (editingId === "new") await createProperty(token, payload);
      else if (editingId) await updateProperty(token, editingId, payload);
      setEditingId(null);
      reload(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: Property) {
    if (!token || !window.confirm(`Supprimer définitivement « ${p.title} » et ses demandes de visite ?`)) return;
    await deleteProperty(token, p.id);
    reload(token);
  }

  async function quick(p: Property, data: PropertyInput) {
    if (!token) return;
    await updateProperty(token, p.id, data);
    reload(token);
  }

  async function toggleInquiry(i: PropertyInquiryRecord) {
    if (!token) return;
    await setPropertyInquiryHandled(token, i.id, i.status === "NOUVEAU");
    reload(token);
  }

  if (!authorized || !user) {
    return <main className="flex flex-1 items-center justify-center text-sm text-ink-2">Chargement…</main>;
  }

  const openInquiries = inquiries?.filter((i) => i.status === "NOUVEAU").length ?? 0;
  const housing = HOUSING.includes(form.type);

  return (
    <>
      <StaffBar user={user} logout={logout} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold">Immobilier</h1>
            <p className="text-sm text-ink-2">Biens publiés par OBP Market et demandes de visite des clients.</p>
          </div>
          {editingId === null && tab === "biens" && (
            <button type="button" onClick={openNew} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-on-brand">
              + Nouveau bien
            </button>
          )}
        </div>

        <div className="mt-5 flex gap-1 rounded-xl bg-surface-2 p-1 sm:max-w-sm">
          {(
            [
              { v: "biens", l: `Biens${rows ? ` (${rows.length})` : ""}` },
              { v: "demandes", l: `Demandes${openInquiries ? ` · ${openInquiries}` : ""}` },
            ] as const
          ).map((t) => (
            <button
              key={t.v}
              type="button"
              onClick={() => {
                setTab(t.v);
                setEditingId(null);
              }}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ${tab === t.v ? "bg-surface shadow-sm" : "text-ink-2"}`}
            >
              {t.l}
            </button>
          ))}
        </div>

        {error && <p className="mt-4 rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}

        {tab === "biens" && editingId !== null && (
          <section className="mt-5 grid gap-4 rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-extrabold">{editingId === "new" ? "Nouveau bien" : "Modifier le bien"}</h2>

            <label className={lbl}>
              Titre de l&apos;annonce *
              <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex. Parcelle de 500 m² à Godomey, titre foncier" className={field} />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className={lbl}>
                Type de bien
                <select value={form.type} onChange={(e) => set("type", e.target.value as PropertyType)} className={field}>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={lbl}>
                Annonce
                <select value={form.kind} onChange={(e) => set("kind", e.target.value as PropertyKind)} className={field}>
                  <option value="VENTE">À vendre</option>
                  <option value="LOCATION">À louer</option>
                </select>
              </label>
              <label className={lbl}>
                Disponibilité
                <select value={form.status} onChange={(e) => set("status", e.target.value as PropertyStatus)} className={field}>
                  <option value="DISPONIBLE">Disponible</option>
                  <option value="RESERVE">Réservé</option>
                  <option value="CONCLU">{form.kind === "VENTE" ? "Vendu" : "Loué"}</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={lbl}>
                Ville *
                <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Abomey-Calavi" className={field} />
              </label>
              <label className={lbl}>
                Quartier / secteur
                <input value={form.district} onChange={(e) => set("district", e.target.value)} placeholder="Godomey" className={field} />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_1fr]">
              <label className={lbl}>
                Superficie
                <input inputMode="decimal" value={form.areaValue} onChange={(e) => set("areaValue", e.target.value.replace(/[^\d.,]/g, ""))} placeholder="500 ou 1" className={field} />
              </label>
              <label className={lbl}>
                Unité
                <select value={form.areaUnit} onChange={(e) => set("areaUnit", e.target.value as AreaUnit)} className={field}>
                  {AREA_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="self-end pb-2.5 text-xs text-ink-2">
                {form.areaValue
                  ? `Affiché : ${formatArea(Number(form.areaValue.replace(",", ".")) || 0, form.areaUnit)}`
                  : "Saisissez librement : 500 m², 1 hectare, 3 ares…"}
              </p>
            </div>

            <label className={lbl}>
              Position GPS (facultatif) — pour afficher la carte
              <input value={form.coords} onChange={(e) => set("coords", e.target.value)} placeholder="6.3577, 2.3586" className={field} />
              <span className="font-normal">
                {form.coords.trim() === "" ? (
                  "Dans Google Maps : clic droit sur le lieu, puis cliquez sur les coordonnées pour les copier."
                ) : parseCoords(form.coords) ? (
                  <span className="text-up">Position valide ✓</span>
                ) : (
                  <span className="text-down">Format attendu : latitude, longitude (ex. 6.3577, 2.3586)</span>
                )}
              </span>
            </label>

            {housing && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={lbl}>
                  Chambres
                  <input inputMode="numeric" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value.replace(/\D/g, ""))} className={field} />
                </label>
                <label className={lbl}>
                  Salles de bain
                  <input inputMode="numeric" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value.replace(/\D/g, ""))} className={field} />
                </label>
              </div>
            )}

            <div className={`grid gap-4 ${form.kind === "LOCATION" ? "sm:grid-cols-2" : ""}`}>
              <label className={lbl}>
                Prix en FCFA *
                <input inputMode="numeric" value={form.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))} placeholder="15000000" className={field} />
                {form.price && <span className="font-normal">{formatFCFA(Number(form.price))} F</span>}
              </label>
              {form.kind === "LOCATION" && (
                <label className={lbl}>
                  Loyer
                  <select value={form.rentPeriod} onChange={(e) => set("rentPeriod", e.target.value as RentPeriod)} className={field}>
                    {RENT_PERIODS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <label className={lbl}>
              Documents / situation foncière
              <input value={form.titleDeed} onChange={(e) => set("titleDeed", e.target.value)} placeholder="Titre foncier, permis d'habiter, convention de vente…" className={field} />
            </label>

            <label className={lbl}>
              Description
              <textarea rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} className={field} />
            </label>

            <div>
              <p className="mb-2 text-xs font-semibold text-ink-2">Photos ({form.photos.length}/10) — la première est la photo principale</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {form.photos.map((src, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Photo ${i + 1}`} className="size-full object-cover" />
                    {i === 0 ? (
                      <span className="absolute bottom-1 left-1 rounded bg-accent px-1.5 py-0.5 font-mono text-[10px] font-bold text-on-accent">Principale</span>
                    ) : (
                      <button type="button" onClick={() => movePhotoFirst(i)} className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        Principale
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))}
                      aria-label="Retirer la photo"
                      className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/55 text-xs text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {form.photos.length < 10 && (
                  <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border border-dashed border-line text-ink-2">
                    {busy ? "…" : "+"}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} disabled={busy} />
                  </label>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} className="size-4 accent-[var(--color-brand)]" />
                Visible sur le site
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="size-4 accent-[var(--color-brand)]" />
                Mettre à la une
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={form.negotiable} onChange={(e) => set("negotiable", e.target.checked)} className="size-4 accent-[var(--color-brand)]" />
                Prix négociable
              </label>
            </div>

            <div className="flex gap-2">
              <button type="button" disabled={busy} onClick={save} className="rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand disabled:opacity-60">
                {busy ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button type="button" onClick={() => setEditingId(null)} className="rounded-xl border border-line px-6 py-3 text-sm font-bold">
                Annuler
              </button>
            </div>
          </section>
        )}

        {tab === "biens" && editingId === null && (
          <>
            {rows && rows.length === 0 && (
              <p className="mt-6 rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-2">Aucun bien pour l&apos;instant. Cliquez sur « Nouveau bien ».</p>
            )}
            <ul className="mt-5 grid gap-3">
              {rows?.map((p) => {
                const photo = parseProductPhotos(p)[0];
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-4">
                    <div className="size-20 flex-none overflow-hidden rounded-xl bg-surface-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {photo ? <img src={photo} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center text-[10px] text-ink-2">Pas de photo</div>}
                    </div>
                    <div className="min-w-0 flex-1 basis-56">
                      <p className="font-display font-bold">{p.title}</p>
                      <p className="text-xs text-ink-2">
                        {typeLabel(p.type)} · {KIND_LABEL[p.kind]} · {[p.district, p.city].filter(Boolean).join(", ")}
                        {formatArea(p.areaValue, p.areaUnit) ? ` · ${formatArea(p.areaValue, p.areaUnit)}` : ""}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold">{formatFCFA(p.price)} F</span>
                        <span className={`rounded-md px-2 py-0.5 font-bold ${p.status === "DISPONIBLE" ? "bg-up/10 text-up" : "bg-surface-2 text-ink-2"}`}>{statusLabel(p.status, p.kind)}</span>
                        {!p.published && <span className="rounded-md bg-accent-soft px-2 py-0.5 font-bold text-accent">Masqué</span>}
                        {p.featured && <span className="rounded-md bg-brand-soft px-2 py-0.5 font-bold text-brand">À la une</span>}
                        {p._count.inquiries > 0 && <span className="rounded-md bg-brand px-2 py-0.5 font-bold text-on-brand">{p._count.inquiries} demande(s)</span>}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                      <button type="button" onClick={() => openEdit(p)} className="rounded-lg border border-line px-3 py-2 hover:bg-surface-2">
                        Modifier
                      </button>
                      <button type="button" onClick={() => quick(p, { published: !p.published })} className="rounded-lg border border-line px-3 py-2 hover:bg-surface-2">
                        {p.published ? "Masquer" : "Publier"}
                      </button>
                      <button type="button" onClick={() => remove(p)} className="rounded-lg border border-down/40 px-3 py-2 text-down hover:bg-down/10">
                        Supprimer
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {tab === "demandes" && (
          <>
            {inquiries && inquiries.length === 0 && (
              <p className="mt-6 rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-2">Aucune demande de visite pour l&apos;instant.</p>
            )}
            <ul className="mt-5 grid gap-3">
              {inquiries?.map((i) => (
                <li key={i.id} className={`rounded-2xl border bg-surface p-5 ${i.status === "NOUVEAU" ? "border-brand/50" : "border-line opacity-75"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-display font-bold">{i.property.title}</p>
                      <p className="text-xs text-ink-2">
                        {i.property.city} · {i.name} · {formatRelativeTime(i.createdAt)}
                      </p>
                    </div>
                    <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${i.status === "NOUVEAU" ? "bg-brand-soft text-brand" : "bg-up/10 text-up"}`}>
                      {i.status === "NOUVEAU" ? "À rappeler" : "Traitée"}
                    </span>
                  </div>
                  {i.message && <p className="mt-3 whitespace-pre-wrap text-sm">{i.message}</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                    <a href={`tel:${i.phone}`} className="font-semibold text-brand">
                      {i.phone}
                    </a>
                    {i.email && (
                      <a href={`mailto:${i.email}`} className="font-semibold text-brand">
                        {i.email}
                      </a>
                    )}
                    <button type="button" onClick={() => toggleInquiry(i)} className="ml-auto rounded-lg border border-line px-3 py-1.5 text-xs font-bold hover:bg-surface-2">
                      {i.status === "NOUVEAU" ? "Marquer comme traitée" : "Rouvrir"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  );
}
