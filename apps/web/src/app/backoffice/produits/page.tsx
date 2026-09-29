"use client";

import { useEffect, useState } from "react";
import { getProducts, parseProductPhotos, updateProductPhotos, type Product } from "@/lib/api";
import { resizeImageFile } from "@/lib/image";
import { ProductImage } from "@/components/product-image";
import { useStaffSession } from "@/lib/staff-session";
import { StaffBar } from "@/components/staff-bar";

export default function ProductPhotosAdminPage() {
  const { user, token, authorized, logout } = useStaffSession(["GESTIONNAIRE_PRIX", "ADMIN"]);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProducts().then((list) => {
      setProducts(list);
      if (list[0]) {
        setSelectedId(list[0].id);
        setPhotos(parseProductPhotos(list[0]));
      }
    });
  }, []);

  function select(p: Product) {
    setSelectedId(p.id);
    setPhotos(parseProductPhotos(p));
    setSaved(false);
    setError(null);
  }

  async function addPhotos(files: FileList | null) {
    if (!files || photos.length >= 6) return;
    setBusy(true);
    setError(null);
    try {
      const room = 6 - photos.length;
      const resized = await Promise.all(Array.from(files).slice(0, room).map((f) => resizeImageFile(f)));
      setPhotos((prev) => [...prev, ...resized]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du traitement de la photo.");
    } finally {
      setBusy(false);
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function save() {
    if (!selectedId || !token) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await updateProductPhotos(token, selectedId, photos);
      setProducts((prev) => prev?.map((p) => (p.id === updated.id ? updated : p)) ?? null);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setBusy(false);
    }
  }

  const selected = products?.find((p) => p.id === selectedId);

  if (!authorized || !user || !products) {
    return <main className="flex flex-1 items-center justify-center text-sm text-ink-2">Chargement…</main>;
  }

  return (
    <>
      <StaffBar user={user} logout={logout} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Photos du catalogue</h1>
        <p className="text-sm text-ink-2">
          Sans photo, la vignette illustrée par catégorie sert de repli automatique.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-[240px_1fr]">
          <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
            {products.map((p) => (
              <li key={p.id} className="border-t border-line first:border-t-0">
                <button
                  type="button"
                  onClick={() => select(p)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm ${p.id === selectedId ? "bg-brand-soft" : ""}`}
                >
                  <ProductImage product={p} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{p.name}</span>
                    <span className="block text-xs text-ink-2">
                      {parseProductPhotos(p).length > 0 ? `${parseProductPhotos(p).length} photo(s)` : "Vignette illustrée"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {selected && (
            <div className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="font-display text-lg font-bold">{selected.name}</h2>
              <p className="mb-3 text-xs text-ink-2">{selected.unitLabel} · {selected.category.name}</p>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((src, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Photo ${i + 1}`} className="size-full object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 rounded bg-accent px-1.5 py-0.5 font-mono text-[10px] font-bold text-on-accent">
                        Principale
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      aria-label="Retirer la photo"
                      className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/55 text-xs text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {photos.length < 6 && (
                  <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border border-dashed border-line text-ink-2">
                    {busy ? "…" : "+"}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} disabled={busy} />
                  </label>
                )}
              </div>

              {error && <p className="mt-3 text-sm text-down">{error}</p>}

              <button
                type="button"
                disabled={busy}
                onClick={save}
                className="mt-4 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand disabled:opacity-60"
              >
                {saved ? "Enregistré ✓" : busy ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
