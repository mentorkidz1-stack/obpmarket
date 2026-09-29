"use client";

import { useEffect, useState } from "react";
import { createBanner, deleteBanner, getAllBanners, updateBanner, type Banner } from "@/lib/api";
import { resizeImageFile } from "@/lib/image";
import { useStaffSession } from "@/lib/staff-session";
import { StaffBar } from "@/components/staff-bar";

const EMPTY = { title: "", subtitle: "", linkUrl: "" };

export default function BannersAdminPage() {
  const { user, token, authorized, logout } = useStaffSession(["MODERATEUR", "ADMIN"]);
  const [banners, setBanners] = useState<Banner[] | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reload(t: string) {
    getAllBanners(t).then(setBanners);
  }

  useEffect(() => {
    if (token) reload(token);
  }, [token]);

  async function pickImage(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      setImageUrl(await resizeImageFile(file, 1600, 0.8));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du traitement de l'image.");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!token || !imageUrl || !form.title.trim()) {
      setError("Une image et un titre sont nécessaires.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createBanner(token, {
        imageUrl,
        title: form.title,
        subtitle: form.subtitle || undefined,
        linkUrl: form.linkUrl || undefined,
        position: banners?.length ?? 0,
      });
      setImageUrl(null);
      setForm(EMPTY);
      reload(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la création.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(b: Banner) {
    if (!token) return;
    await updateBanner(token, b.id, { active: !b.active });
    reload(token);
  }

  async function remove(id: string) {
    if (!token) return;
    await deleteBanner(token, id);
    reload(token);
  }

  if (!authorized || !user) {
    return <main className="flex flex-1 items-center justify-center text-sm text-ink-2">Chargement…</main>;
  }

  return (
    <>
      <StaffBar user={user} logout={logout} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Bannières de l&apos;accueil</h1>
        <p className="text-sm text-ink-2">
          Affichées en carrousel tout en haut de la boutique. Format large recommandé (21:7), une seule bannière si
          vous n&apos;en ajoutez qu&apos;une.
        </p>

        <div className="mt-5 rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Nouvelle bannière</h2>

          {imageUrl ? (
            <div className="relative mb-3 aspect-[21/7] overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Aperçu" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-1 text-xs text-white"
              >
                Changer
              </button>
            </div>
          ) : (
            <label className="mb-3 grid aspect-[21/7] cursor-pointer place-items-center rounded-xl border border-dashed border-line text-sm text-ink-2">
              {busy ? "…" : "Choisir une image"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(e.target.files)} disabled={busy} />
            </label>
          )}

          <div className="grid gap-2.5">
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Titre (ex. « La récolte de maïs arrive »)"
              className="rounded-xl border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <input
              value={form.subtitle}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
              placeholder="Sous-titre (optionnel)"
              className="rounded-xl border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <input
              value={form.linkUrl}
              onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
              placeholder="Lien au clic (optionnel, ex. /produits/xxx ou /?categorie=xxx)"
              className="rounded-xl border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>

          {error && <p className="mt-2 text-sm text-down">{error}</p>}

          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="mt-3 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand disabled:opacity-60"
          >
            Publier
          </button>
        </div>

        <h2 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-ink-2">Bannières existantes</h2>
        {!banners ? (
          <p className="text-sm text-ink-2">Chargement…</p>
        ) : banners.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-ink-2">Aucune bannière.</p>
        ) : (
          <ul className="grid gap-3">
            {banners.map((b) => (
              <li key={b.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
                <div className="aspect-[21/7] w-32 flex-none overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.imageUrl} alt={b.title} className="size-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{b.title}</p>
                  {b.subtitle && <p className="truncate text-xs text-ink-2">{b.subtitle}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => toggleActive(b)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${b.active ? "bg-up/10 text-up" : "bg-surface-2 text-ink-2"}`}
                >
                  {b.active ? "Active" : "Masquée"}
                </button>
                <button type="button" onClick={() => remove(b.id)} className="text-xs font-semibold text-down underline">
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
