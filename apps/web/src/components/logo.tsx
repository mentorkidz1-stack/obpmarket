/**
 * Logo OBP Market : trois barres de prix ascendantes (le marché, les prix, la valeur qui monte)
 * et un « + » orange, clin d'œil à One Build Plus.
 */
export function LogoMark({ className = "size-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="OBP Market" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#2b3fae" />
      <rect x="11" y="26" width="7" height="12" rx="2" fill="#fff" />
      <rect x="20.5" y="19" width="7" height="19" rx="2" fill="#fff" />
      <rect x="30" y="12" width="7" height="26" rx="2" fill="#fff" />
      <path d="M14.5 8.5v8M10.5 12.5h8" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ compact = false, markClassName = "size-9 sm:size-10", textClassName = "text-lg sm:text-xl" }: { compact?: boolean; markClassName?: string; textClassName?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className={`flex-none ${markClassName}`} />
      {!compact && (
        <span className={`font-display font-extrabold leading-none tracking-tight ${textClassName}`}>
          OBP <span className="text-brand">Market</span>
        </span>
      )}
    </span>
  );
}
