import { Money } from "@/components/money";
import { useCurrency } from "@/components/currency-provider";
import type { ReferencePrice } from "@/lib/api";

const W = 640;
const H = 220;
const PAD_L = 56;
const PAD_R = 12;
const PAD_T = 16;
const PAD_B = 26;

export function PriceChart({ history }: { history: ReferencePrice[] }) {
  const { format } = useCurrency();
  const data = history.map((h) => ({ t: new Date(h.computedAt).getTime(), v: h.value }));

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-2">Pas encore d&apos;historique de prix.</p>;
  }
  if (data.length === 1) {
    return (
      <p className="py-8 text-center text-sm text-ink-2">
        Un seul relevé pour l&apos;instant : <Money value={data[0].v} />.
      </p>
    );
  }

  const minT = data[0].t;
  const maxT = data[data.length - 1].t;
  const values = data.map((d) => d.v);
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (lo === hi) {
    lo -= lo * 0.05 || 1;
    hi += hi * 0.05 || 1;
  }
  const pad = (hi - lo) * 0.12;
  lo -= pad;
  hi += pad;

  const x = (t: number) => PAD_L + (maxT === minT ? 0 : ((t - minT) / (maxT - minT)) * (W - PAD_L - PAD_R));
  const y = (v: number) => PAD_T + (1 - (v - lo) / (hi - lo)) * (H - PAD_T - PAD_B);

  const points = data.map((d) => `${x(d.t).toFixed(1)},${y(d.v).toFixed(1)}`).join(" ");
  const areaPoints = `${x(minT).toFixed(1)},${y(lo).toFixed(1)} ${points} ${x(maxT).toFixed(1)},${y(lo).toFixed(1)}`;

  const first = values[0];
  const last = values[values.length - 1];
  const changePct = first ? ((last - first) / first) * 100 : 0;
  const up = changePct >= 0;
  const last2 = data.at(-1)!;

  const ticks = [hi - pad * 0.3, (hi + lo) / 2, lo + pad * 0.3];

  const dateFmt = (t: number) =>
    new Date(t).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Évolution du prix moyen dans le temps">
        {ticks.map((tv, i) => (
          <g key={i}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(tv)} y2={y(tv)} stroke="var(--color-line)" strokeWidth="1" />
            <text x={PAD_L - 8} y={y(tv) + 3} textAnchor="end" fontSize="10.5" fill="var(--color-ink-2)" fontFamily="var(--font-mono)">
              {format(tv).amount}
            </text>
          </g>
        ))}
        <polygon points={areaPoints} fill="var(--color-brand)" opacity="0.12" />
        <polyline points={points} fill="none" stroke="var(--color-brand)" strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(last2.t)} cy={y(last2.v)} r="4.5" fill="var(--color-brand)" stroke="var(--color-surface)" strokeWidth="2" />
        <text x={PAD_L} y={H - 6} fontSize="10.5" fill="var(--color-ink-2)" fontFamily="var(--font-mono)">
          {dateFmt(minT)}
        </text>
        <text x={W - PAD_R} y={H - 6} textAnchor="end" fontSize="10.5" fill="var(--color-ink-2)" fontFamily="var(--font-mono)">
          {dateFmt(maxT)}
        </text>
      </svg>
      <p className={`mt-1 text-center font-mono text-xs font-semibold ${up ? "text-up" : "text-down"}`}>
        {up ? "+" : ""}
        {changePct.toFixed(1)} % sur la période affichée
      </p>
    </div>
  );
}
