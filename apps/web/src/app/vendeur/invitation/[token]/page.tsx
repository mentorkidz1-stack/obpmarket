"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Logo } from "@/components/logo";
import { LoadError, PageLoading } from "@/components/page-state";
import { VendorForm } from "@/components/vendor-form";
import { checkVendorInvite, getMyVendorProfile, type VendorInviteCheck } from "@/lib/api";

const REASON: Record<string, string> = {
  UNKNOWN: "Ce lien d'invitation n'est pas valide. Vérifiez qu'il est complet, ou demandez-en un nouveau à OBP Market.",
  USED: "Cette invitation a déjà été utilisée. Si c'était vous, ouvrez directement votre espace vendeur.",
  EXPIRED: "Cette invitation a expiré. Demandez-en une nouvelle à OBP Market.",
  REVOKED: "Cette invitation a été annulée. Contactez OBP Market.",
};

/** Page ouverte depuis le lien privé envoyé par OBP Market : connexion, puis ouverture du compte vendeur. */
export default function VendorInvitationPage(props: PageProps<"/vendeur/invitation/[token]">) {
  const { token: inviteToken } = use(props.params);
  const router = useRouter();
  const { token, ready } = useAuth();
  const [invite, setInvite] = useState<VendorInviteCheck | null>(null);
  const [alreadyVendor, setAlreadyVendor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    checkVendorInvite(inviteToken)
      .then(setInvite)
      .catch((e: Error) => setError(e.message));
  }, [inviteToken, attempt]);

  useEffect(() => {
    if (!token) return;
    getMyVendorProfile(token)
      .then((p) => setAlreadyVendor(!!p && p.status !== "REFUSE"))
      .catch(() => {});
  }, [token]);

  if (error) return <LoadError message={error} onRetry={() => { setError(null); setAttempt((n) => n + 1); }} />;
  if (!invite || !ready) return <PageLoading />;

  const shell = (children: React.ReactNode) => (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-10">
      <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <Logo markClassName="size-10" textClassName="text-lg" />
        {children}
      </div>
    </main>
  );

  if (!invite.valid) {
    return shell(
      <>
        <h1 className="mt-5 font-display text-2xl font-extrabold">Invitation indisponible</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{REASON[invite.reason] ?? REASON.UNKNOWN}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/contact" className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-on-brand">
            Contacter OBP Market
          </Link>
          <Link href="/vendeur" className="rounded-xl border border-line px-5 py-2.5 text-sm font-bold hover:bg-surface-2">
            Espace vendeur
          </Link>
        </div>
      </>,
    );
  }

  if (!token) {
    return shell(
      <>
        <h1 className="mt-5 font-display text-2xl font-extrabold">Vous êtes invité(e) à devenir vendeur partenaire</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          OBP Market vous invite à vendre vos produits sur sa plateforme. Connectez-vous avec votre numéro de téléphone
          {invite.phoneRestricted ? " (celui sur lequel l'invitation a été envoyée)" : ""} pour ouvrir votre compte vendeur.
        </p>
        <Link
          href={`/connexion?next=${encodeURIComponent(`/vendeur/invitation/${inviteToken}`)}`}
          className="mt-6 block rounded-xl bg-brand py-3.5 text-center text-sm font-bold text-on-brand"
        >
          Me connecter pour continuer
        </Link>
      </>,
    );
  }

  if (alreadyVendor) {
    return shell(
      <>
        <h1 className="mt-5 font-display text-2xl font-extrabold">Vous avez déjà un compte vendeur</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">Votre espace vendeur est prêt : publiez vos annonces et suivez vos ventes.</p>
        <Link href="/vendeur" className="mt-5 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-on-brand">
          Ouvrir mon espace vendeur
        </Link>
      </>,
    );
  }

  return shell(
    <>
      <h1 className="mt-5 font-display text-2xl font-extrabold">Ouvrir mon compte vendeur</h1>
      <p className="mt-1 mb-5 text-sm text-ink-2">
        Invitation d&apos;OBP Market. Votre compte est actif dès que vous validez : vous gardez votre compte acheteur, votre stock et votre portefeuille.
      </p>
      <VendorForm token={token} inviteToken={inviteToken} initialType={invite.type} initialZone={invite.zone} onDone={() => router.replace("/vendeur")} />
    </>,
  );
}
