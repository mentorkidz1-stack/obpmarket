import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez l'équipe OBP Market : une question, un souci avec une commande ou une demande de partenariat.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
