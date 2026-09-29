/** Symboles SVG partagés pour les vignettes produit — rendu une seule fois dans le layout. */
export function ProductIconDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden focusable="false">
      <defs>
        <symbol id="pi-corn" viewBox="0 0 24 24">
          <path d="M8.2 2.8c4.3 0 8.2 4.4 8.2 10 0 6.3-4 10.4-8.2 10.4-1.1 0-2.2-9-2.2-10.4S7.1 2.8 8.2 2.8z" />
          <path d="M7.6 6.6c1.6.1 2.9 1 3.6 2.2M7 10.4c1.8.1 3.3 1.1 4 2.4M6.6 14.3c1.8.1 3.4 1.1 4.1 2.5M6.4 18.1c1.7.1 3.1 1 3.8 2.1" />
        </symbol>
        <symbol id="pi-grain" viewBox="0 0 24 24">
          <path d="M4.5 20.5c0-8.5 3-14.8 7.5-17 4.5 2.2 7.5 8.5 7.5 17z" />
          <path d="M8.3 20.2c0-6.3 1.6-10.7 3.7-13M15.7 20.2c0-6.3-1.6-10.7-3.7-13" opacity=".55" />
        </symbol>
        <symbol id="pi-jerrycan" viewBox="0 0 24 24">
          <rect x="5" y="7.5" width="14" height="13.5" rx="2" />
          <path d="M9 7.5V4.5h6v3M9.5 4.5V2.5M14.5 4.5V2.5" />
          <path d="M5 13.2h14M8 16.5h4" />
        </symbol>
        <symbol id="pi-tomato" viewBox="0 0 24 24">
          <circle cx="12" cy="14.2" r="7" />
          <path d="M12 7.2c-1.4-2.1-3-2.7-4.6-2.1M12 7.2c1.4-2.1 3-2.7 4.6-2.1M12 7.2v2.2" />
        </symbol>
        <symbol id="pi-bowl" viewBox="0 0 24 24">
          <path d="M3 11.5h18c0 5.2-4 9.3-9 9.3s-9-4.1-9-9.3z" />
          <path d="M7.2 11.5c0-3.1 2-5.3 4.8-5.3s4.8 2.2 4.8 5.3" />
        </symbol>
        <symbol id="pi-bean" viewBox="0 0 24 24">
          <path d="M6.2 14.3c-2.2-3-1.1-8.2 3-10.3 4.1-2 9 .1 10 4.2 1 4.1-2 8.1-6 9.2-4 1.1-6-.9-7-3.1z" />
          <circle cx="9.6" cy="10.6" r="1.1" />
          <circle cx="13.2" cy="7.9" r="1.1" />
          <circle cx="15.1" cy="12.7" r="1.1" />
        </symbol>
        <symbol id="pi-fridge" viewBox="0 0 24 24">
          <rect x="6" y="2" width="12" height="20" rx="1.6" />
          <path d="M6 10.2h12" />
          <path d="M9 5.2v2.2M9 13.4v2.2" />
        </symbol>
        <symbol id="pi-box" viewBox="0 0 24 24">
          <path d="M3 8l9-5 9 5v8l-9 5-9-5z" />
          <path d="M3 8l9 5 9-5M12 13v8" />
        </symbol>
      </defs>
    </svg>
  );
}

const NAME_ICON: Array<[RegExp, string]> = [
  [/ma[iï]s/i, "pi-corn"],
  [/riz/i, "pi-grain"],
  [/haricot|ni[ée]b[ée]/i, "pi-bean"],
  [/huile/i, "pi-jerrycan"],
  [/gari/i, "pi-bowl"],
  [/tomate/i, "pi-tomato"],
];

const CATEGORY_ICON: Record<string, string> = {
  "Céréales": "pi-grain",
  "Tubercules": "pi-bowl",
  "Huiles": "pi-jerrycan",
  "Légumes": "pi-tomato",
  "Électroménager": "pi-fridge",
};

export function productIconId(productName: string, categoryName: string): string {
  for (const [pattern, id] of NAME_ICON) {
    if (pattern.test(productName)) return id;
  }
  return CATEGORY_ICON[categoryName] ?? "pi-box";
}
