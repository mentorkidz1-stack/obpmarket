export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 animate-pulse px-4 py-8 sm:px-6" aria-busy="true" aria-label="Chargement">
      <div className="h-64 rounded-2xl bg-surface-2 sm:h-80" />
      <div className="mt-8 h-7 w-64 rounded-lg bg-surface-2" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="aspect-square bg-surface-2" />
            <div className="grid gap-2 p-3.5">
              <div className="h-3 w-16 rounded bg-surface-2" />
              <div className="h-4 w-3/4 rounded bg-surface-2" />
              <div className="h-6 w-1/2 rounded bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
