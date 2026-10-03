import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Mentions légales" };

export default function LegalNoticePage() {
  const rows: [string, string][] = [
    ["Éditeur du site", `${SITE.company.legalName} (OBP)`],
    ["Numéro IFU", SITE.company.ifu],
    ["Siège", SITE.address],
    ["Téléphone", SITE.phone],
    ...(SITE.email ? ([["E-mail", SITE.email]] as [string, string][]) : []),
    ["Marque", "OBP Market est un service de " + SITE.company.legalName],
    ["Hébergement", "Site : Vercel Inc. — Interface de programmation et base de données : Render Services, Inc."],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <>
      <PageHero title="Mentions légales" crumb="Mentions légales" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <dl className="grid gap-3">
          {rows.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1 border-b border-line pb-3 sm:flex-row sm:justify-between sm:gap-6">
              <dt className="text-sm font-bold">{k}</dt>
              <dd className="text-sm text-ink-2 sm:text-right">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-sm leading-relaxed text-ink-2">
          Pour toute question relative au site ou à vos données, utilisez la page{" "}
          <Link href="/contact" className="font-semibold text-brand underline">
            Contact
          </Link>
          . Les conditions d&apos;utilisation et la politique de confidentialité sont consultables depuis le pied de page.
        </p>
      </main>
    </>
  );
}
