import type { Metadata } from "next";
import { VendorListingForm } from "@/components/vendor-listing-form";

export const metadata: Metadata = { title: "Nouvelle annonce" };

export default function NewVendorListingPage() {
  return <VendorListingForm />;
}
