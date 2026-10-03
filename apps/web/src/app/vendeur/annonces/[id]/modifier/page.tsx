import type { Metadata } from "next";
import { VendorListingForm } from "@/components/vendor-listing-form";

export const metadata: Metadata = { title: "Corriger mon annonce" };

export default async function EditVendorListingPage(props: PageProps<"/vendeur/annonces/[id]/modifier">) {
  const { id } = await props.params;
  return <VendorListingForm listingId={id} />;
}
