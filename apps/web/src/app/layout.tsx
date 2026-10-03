import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { CartProvider } from "@/components/cart-provider";
import { CurrencyProvider } from "@/components/currency-provider";
import { WishlistProvider } from "@/components/wishlist-provider";
import { UIProvider } from "@/components/ui-provider";
import { CartDrawer } from "@/components/cart-drawer";
import { MobileNav } from "@/components/mobile-nav";
import { BackToTop } from "@/components/back-to-top";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductIconDefs } from "@/components/product-icons";
import { SITE } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — Prix du marché`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "fr_BJ",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image", title: `${SITE.name} — ${SITE.tagline}`, description: SITE.description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2b3fae" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0f1c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <a
          href="#contenu"
          className="absolute left-3 top-3 z-[100] -translate-y-20 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-on-brand transition-transform focus:translate-y-0"
        >
          Aller au contenu
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: SITE.name,
              legalName: SITE.company.legalName,
              url: SITE.url,
              logo: `${SITE.url}/icon`,
              telephone: SITE.phone || undefined,
              email: SITE.email || undefined,
              address: SITE.address ? { "@type": "PostalAddress", streetAddress: SITE.address, addressCountry: "BJ" } : undefined,
            }),
          }}
        />
        <ProductIconDefs />
        <AuthProvider>
          <CartProvider>
            <CurrencyProvider>
              <WishlistProvider>
                <UIProvider>
                  <SiteHeader />
                  <div id="contenu" tabIndex={-1} className="flex flex-1 flex-col outline-none">
                    {children}
                  </div>
                  <SiteFooter />
                  <CartDrawer />
                  <MobileNav />
                  <BackToTop />
                  <WhatsAppButton />
                </UIProvider>
              </WishlistProvider>
            </CurrencyProvider>
          </CartProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
