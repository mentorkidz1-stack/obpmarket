export function PriceTrend({ value, size = "sm" }: { value: number | null | undefined; size?: "sm" | "md" }) {
  if (value == null) return null;
  const up = value >= 0;
  const text = size === "md" ? "text-sm" : "text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono font-semibold ${text} ${
        up ? "bg-up/10 text-up" : "bg-down/10 text-down"
      }`}
    >
      <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3">
        {up ? <path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M7 7l10 10M17 9v8H9" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
      {up ? "+" : ""}
      {value.toFixed(1)} %
    </span>
  );
}
