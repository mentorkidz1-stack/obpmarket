"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAgents,
  getLatestReferencePrices,
  getMarkets,
  getProducts,
  submitPriceReading,
  type AgentUser,
  type Market,
  type PriceReadingResult,
  type Product,
  type ReferencePrice,
} from "@/lib/api";
import { formatFCFA, formatRelativeTime } from "@/lib/format";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      products: Product[];
      markets: Market[];
      agent: AgentUser;
      prices: Map<string, ReferencePrice>;
    };

type Banner = { kind: "success" | "warning" | "error"; text: string };

export default function AgentPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [marketId, setMarketId] = useState<string>("");
  const [index, setIndex] = useState(0);
  const [priceInput, setPriceInput] = useState("");
  const [quality, setQuality] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "done" | "error">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    Promise.all([getProducts(), getMarkets(), getAgents(), getLatestReferencePrices()])
      .then(([products, markets, agents, prices]) => {
        if (agents.length === 0) {
          setState({ status: "error", message: "Aucun agent créé (lancez npm run seed côté API)." });
          return;
        }
        setState({
          status: "ready",
          products,
          markets,
          agent: agents[0],
          prices: new Map(prices.map((p) => [p.productId, p])),
        });
        setMarketId(markets[0]?.id ?? "");
      })
      .catch((err: Error) => setState({ status: "error", message: err.message }));
  }, []);

  const product = state.status === "ready" ? state.products[index] : undefined;
  const reference = product && state.status === "ready" ? state.prices.get(product.id) : undefined;

  const deviation = useMemo(() => {
    const price = Number(priceInput);
    if (!reference || !price || !Number.isFinite(price)) return null;
    return ((price - reference.value) / reference.value) * 100;
  }, [priceInput, reference]);

  function locate() {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("done");
      },
      () => setGeoStatus("error"),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  async function handleSubmit() {
    if (state.status !== "ready" || !product) return;
    const price = Number(priceInput);
    if (!price || price <= 0) {
      setBanner({ kind: "error", text: "Entrez un prix valide avant d'enregistrer." });
      return;
    }

    setSubmitting(true);
    setBanner(null);
    try {
      const result: PriceReadingResult = await submitPriceReading({
        productId: product.id,
        marketId,
        agentId: state.agent.id,
        price,
        quality: quality || undefined,
        latitude: coords?.lat,
        longitude: coords?.lng,
      });

      setSessionCount((n) => n + 1);
      if (result.reading.status === "A_CONTROLER") {
        setBanner({
          kind: "warning",
          text: `Relevé enregistré, mais mis de côté pour contrôle : ${result.reading.flagReason}`,
        });
      } else {
        setBanner({ kind: "success", text: "Relevé enregistré et pris en compte dans le prix moyen." });
      }

      if (result.recompute.published && result.recompute.value) {
        setState((prev) =>
          prev.status === "ready"
            ? {
                ...prev,
                prices: new Map(prev.prices).set(product.id, {
                  id: "local",
                  productId: product.id,
                  value: result.recompute.value!,
                  readingsCount: result.recompute.readingsCount,
                  marketsCount: result.recompute.marketsCount,
                  windowHours: 24,
                  computedAt: new Date().toISOString(),
                }),
              }
            : prev,
        );
      }

      setPriceInput("");
      setQuality("");
      setIndex((i) => (state.status === "ready" && i + 1 < state.products.length ? i + 1 : i));
    } catch (err) {
      setBanner({ kind: "error", text: err instanceof Error ? err.message : "Échec de l'enregistrement." });
    } finally {
      setSubmitting(false);
    }
  }

  if (state.status === "loading") {
    return <main className="flex flex-1 items-center justify-center text-sm text-ink-2">Chargement…</main>;
  }
  if (state.status === "error") {
    return (
      <main className="flex flex-1 items-center justify-center p-8 text-center text-sm text-ink-2">
        {state.message}
      </main>
    );
  }
  if (!product) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 text-center text-sm text-ink-2">
        Aucun produit dans le catalogue.
      </main>
    );
  }

  const market = state.markets.find((m) => m.id === marketId);
  const done = index >= state.products.length - 1 && banner?.kind !== "error" && priceInput === "" && sessionCount > 0;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col px-4 pb-8 sm:px-0">
      <header className="grid gap-3 bg-brand px-4 py-4 text-on-brand sm:rounded-b-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-lg font-bold">Relevé de prix</h1>
          <label className="sr-only" htmlFor="market">
            Marché
          </label>
          <select
            id="market"
            value={marketId}
            onChange={(e) => setMarketId(e.target.value)}
            className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold text-on-brand outline-none"
          >
            {state.markets.map((m) => (
              <option key={m.id} value={m.id} className="text-ink">
                {m.name} · {m.city}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between text-xs opacity-90">
          <span>Agent : {state.agent.fullName}</span>
          <span className="font-mono">
            {index + 1} / {state.products.length} produits · {sessionCount} enregistré{sessionCount > 1 ? "s" : ""}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${((index + 1) / state.products.length) * 100}%` }}
          />
        </div>
      </header>

      {banner && (
        <div
          role="status"
          className={`mt-4 rounded-xl border px-3 py-2 text-sm ${
            banner.kind === "success"
              ? "border-up/30 bg-up/10 text-up"
              : banner.kind === "warning"
                ? "border-accent/40 bg-accent-soft text-ink"
                : "border-down/30 bg-down/10 text-down"
          }`}
        >
          {banner.text}
        </div>
      )}

      <section className="mt-4 grid gap-1 px-1">
        <p className="font-display text-2xl font-bold">{product.name}</p>
        <p className="text-sm text-ink-2">
          Prix d&apos;un {product.unitLabel}
          {quality ? ` · ${quality}` : ""}
        </p>
      </section>

      <div className="mt-3 flex items-baseline gap-2 border-b-2 border-brand px-1 pb-2">
        <input
          type="text"
          inputMode="decimal"
          aria-label={`Prix en FCFA pour ${product.name}`}
          placeholder="0"
          value={priceInput}
          onChange={(e) => setPriceInput(e.target.value.replace(/[^\d]/g, ""))}
          className="w-full bg-transparent font-display text-5xl font-bold tabular-nums outline-none"
        />
        <span className="text-lg font-semibold text-ink-2">F</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {reference ? (
          <>
            <span className="rounded-full bg-surface-2 px-2.5 py-1 font-mono text-ink-2">
              Moyenne : {formatFCFA(reference.value)} F · {formatRelativeTime(reference.computedAt)}
            </span>
            {deviation !== null && (
              <span
                className={`rounded-full px-2.5 py-1 font-mono ${
                  Math.abs(deviation) > 15 ? "bg-down/10 text-down" : "bg-brand-soft text-brand"
                }`}
              >
                Écart : {deviation >= 0 ? "+" : ""}
                {deviation.toFixed(1)} %{Math.abs(deviation) > 15 ? " · sera signalé" : ""}
              </span>
            )}
          </>
        ) : (
          <span className="rounded-full bg-surface-2 px-2.5 py-1 font-mono text-ink-2">Pas encore de prix moyen</span>
        )}
      </div>

      <div className="mt-4 grid gap-2">
        <label htmlFor="quality" className="text-xs font-semibold text-ink-2">
          Qualité / calibre (optionnel)
        </label>
        <input
          id="quality"
          type="text"
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
          placeholder="Standard"
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>

      <button
        type="button"
        onClick={locate}
        className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-semibold text-ink"
      >
        {geoStatus === "locating"
          ? "Localisation…"
          : geoStatus === "done"
            ? `Position enregistrée ✓ (${coords?.lat.toFixed(4)}, ${coords?.lng.toFixed(4)})`
            : geoStatus === "error"
              ? "Position indisponible — relevé possible sans elle"
              : "Utiliser ma position"}
      </button>
      {market && (
        <p className="mt-1 px-1 text-[11px] text-ink-2">
          Zone du marché : {market.radiusMeters} m autour de {market.name}.
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-5 rounded-xl bg-brand py-3.5 text-center font-semibold text-on-brand disabled:opacity-60"
      >
        {submitting ? "Enregistrement…" : "Enregistrer · produit suivant"}
      </button>

      {done && (
        <p className="mt-3 text-center text-xs text-ink-2">
          Dernier produit de la liste. Vous pouvez continuer à corriger ce relevé ou changer de marché.
        </p>
      )}
    </main>
  );
}
