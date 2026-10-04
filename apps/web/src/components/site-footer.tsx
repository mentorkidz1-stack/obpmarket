"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";
import { LogoMark } from "@/components/logo";

const COLUMNS = [
  {
    title: "Acheter",
    links: [
      { href: "/boutique", label: "Toute la boutique" },
      { href: "/boutique?tri=hausse", label: "Variations de prix" },
      { href: "/immobilier", label: "Immobilier" },
      { href: "/favoris", label: "Mes favoris" },
      { href: "/panier", label: "Mon panier" },
      { href: "/commandes", label: "Mes commandes" },
    ],
  },
  {
    title: "Mon espace",
    links: [
      { href: "/compte", label: "Mon compte" },
      { href: "/mon-stock", label: "Mon stock" },
      { href: "/portefeuille", label: "Portefeuille" },
      { href: "/boutiques", label: "Boutiques vendeurs" },
  { href: "/vendeur", label: "Devenir vendeur" },
    ],
  },
  {
    title: "Aide",
    links: [
      { href: "/comment-ca-marche", label: "Comment ça marche" },
      { href: "/faq", label: "Questions fréquentes" },
      { href: "/contact", label: "Contact" },
      { href: "/conditions", label: "Conditions d'utilisation" },
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/confidentialite", label: "Confidentialité" },
    ],
  },
];

const PAYMENTS = ["MTN MoMo", "Moov Money", "Orange Money", "Visa", "Mastercard"];

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/agent") || pathname.startsWith("/backoffice") || pathname.startsWith("/connexion-interne")) return null;

  return (
    <footer className="mt-16 bg-ink text-app">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-10" />
            <span className="font-display text-xl font-extrabold">OBP Market</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-app/70">
            Le prix moyen des marchés du Bénin, calculé à partir de relevés de terrain, pour acheter, déposer et revendre au prix juste — et des biens immobiliers proposés par OBP.
          </p>
          {(SITE.whatsapp || SITE.phone || SITE.email || SITE.address) && (
            <ul className="mt-5 grid gap-1.5 text-sm">
              {SITE.address && <li className="max-w-xs text-app/85">{SITE.address}</li>}
              {SITE.whatsapp && (
                <li>
                  <a href={`https://wa.me/${SITE.whatsapp}`} className="text-app/85 hover:text-app">
                    WhatsApp · +{SITE.whatsapp}
                  </a>
                </li>
              )}
              {SITE.phone && (
                <li>
                  <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="text-app/85 hover:text-app">
                    {SITE.phone}
                  </a>
                </li>
              )}
              {SITE.email && (
                <li>
                  <a href={`mailto:${SITE.email}`} className="text-app/85 hover:text-app">
                    {SITE.email}
                  </a>
                </li>
              )}
            </ul>
          )}
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-app/55">{col.title}</p>
            <ul className="mt-4 grid gap-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-app/85 hover:text-app hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 sm:px-6 md:flex-row">
          <p className="text-center text-xs text-app/60 md:text-left">
            © {new Date().getFullYear()} OBP Market, un service de {SITE.company.legalName} · IFU {SITE.company.ifu} · Bénin
          </p>
          <ul className="flex flex-wrap justify-center gap-2" aria-label="Moyens de paiement acceptés">
            {PAYMENTS.map((p) => (
              <li key={p} className="rounded-md border border-white/20 px-2.5 py-1 text-[11px] font-bold text-app/85">
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
