const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  unitLabel: string;
  isPerishable: boolean;
  isStockable: boolean;
  stockQuantity: number;
  categoryId: string;
  category: Category;
  /** JSON.stringify d'un tableau de data URI. Utiliser parseProductPhotos(). */
  photos: string;
}

export interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string | null;
  linkUrl: string | null;
  position: number;
  active: boolean;
  createdAt: string;
}

async function apiFetch<T>(path: string): Promise<T> {
  // Côté serveur Next, la réponse est gardée 30 s : les visites suivantes ne rappellent pas l'API
  // (dont le premier appel peut prendre plusieurs secondes sur l'hébergement gratuit). Une modification
  // du back-office apparaît donc en moins de 30 s. Côté navigateur, l'option est ignorée.
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 30 } });
  if (!res.ok) {
    throw new Error(`Appel API ${path} en échec (${res.status})`);
  }
  return res.json() as Promise<T>;
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
  return message ?? fallback;
}

/**
 * Lit le corps d'une réponse JSON. L'API renvoie un corps vide (et non « null ») quand il n'y a rien à
 * retourner — par exemple le profil vendeur d'un compte qui n'est pas vendeur : on le lit comme `null`.
 */
async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

/** Requête authentifiée — envoie le jeton du staff ou du client connecté (JwtAuthGuard). */
async function authFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` },
  });
  if (res.status === 401 && typeof window !== "undefined") {
    // Session expirée ou invalide : le AuthProvider déconnecte, les pages repassent sur la connexion.
    window.dispatchEvent(new Event("obp:session-expired"));
    throw new Error("Votre session a expiré. Reconnectez-vous.");
  }
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `Échec de la requête (${res.status})`));
  }
  return readJson<T>(res);
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `Échec de la requête (${res.status})`));
  }
  return readJson<T>(res);
}

function authJson<T>(path: string, token: string, method: string, body?: unknown): Promise<T> {
  return authFetch<T>(path, token, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function getBanners() {
  return apiFetch<Banner[]>("/banners");
}

export function getAllBanners(token: string) {
  return authFetch<Banner[]>("/banners/all", token);
}

export function createBanner(
  token: string,
  data: { imageUrl: string; title: string; subtitle?: string; linkUrl?: string; position?: number },
) {
  return authJson<Banner>("/banners", token, "POST", data);
}

export function updateBanner(
  token: string,
  id: string,
  data: Partial<Pick<Banner, "title" | "subtitle" | "linkUrl" | "position" | "active" | "imageUrl">>,
) {
  return authJson<Banner>(`/banners/${id}`, token, "PATCH", data);
}

export function deleteBanner(token: string, id: string) {
  return authFetch<{ id: string }>(`/banners/${id}`, token, { method: "DELETE" });
}

export function parseProductPhotos(product: Pick<Product, "photos">): string[] {
  try {
    const parsed: unknown = JSON.parse(product.photos || "[]");
    return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === "string") : [];
  } catch {
    return [];
  }
}

export interface ReferencePrice {
  id: string;
  productId: string;
  value: number;
  readingsCount: number;
  marketsCount: number;
  windowHours: number;
  computedAt: string;
  /** Variation sur 7 jours, en points de pourcentage — présent seulement sur la liste globale. */
  changePct7d?: number | null;
}

export function getProducts() {
  return apiFetch<Product[]>("/products");
}

export function getProduct(id: string) {
  return apiFetch<Product>(`/products/${id}`);
}

export function updateProductPhotos(token: string, id: string, photos: string[]): Promise<Product> {
  return authJson<Product>(`/products/${id}/photos`, token, "PATCH", { photos });
}

export function getLatestReferencePrices() {
  return apiFetch<ReferencePrice[]>("/reference-prices");
}

export function getReferencePriceHistory(productId: string, days = 30) {
  return apiFetch<ReferencePrice[]>(`/products/${productId}/reference-price/history?days=${days}`);
}

export interface Market {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface AgentUser {
  id: string;
  fullName: string;
  phone: string;
  role: string;
}

export interface AuthUser {
  id: string;
  phone: string;
  email: string | null;
  fullName: string;
  role: string;
  createdAt: string;
}

export async function requestOtp(phone: string): Promise<{ sent: boolean; expiresInMinutes: number; devCode?: string }> {
  const res = await fetch(`${API_URL}/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "Échec de l'envoi du code."));
  return res.json();
}

export async function verifyOtp(phone: string, code: string): Promise<{ accessToken: string; user: AuthUser }> {
  const res = await fetch(`${API_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "Code invalide."));
  return res.json();
}

/** Connexion des rôles internes — docs/decisions/0006-connexion-interne.md. */
export async function staffLogin(email: string, password: string): Promise<{ accessToken: string; user: AuthUser }> {
  const res = await fetch(`${API_URL}/auth/staff-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "Identifiants invalides."));
  return res.json();
}

export function getMarkets() {
  return apiFetch<Market[]>("/markets");
}

/** Agents de terrain (back-office : affectation aux marchés). */
export function getAgents(token: string) {
  return authFetch<AgentUser[]>("/admin/agents", token);
}

export interface PriceReadingToReview {
  id: string;
  price: number;
  quality: string | null;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceToMarketMeters: number | null;
  status: "VALIDE" | "A_CONTROLER" | "REJETE";
  flagReason: string | null;
  recordedAt: string;
  product: Product;
  market: Market;
  agent: AgentUser;
}

export function getReadingsToReview(token: string) {
  return authFetch<PriceReadingToReview[]>("/price-readings/to-review", token);
}

export function approveReading(token: string, id: string, note?: string) {
  return authJson(`/price-readings/${id}/approve`, token, "PATCH", { note });
}

export function rejectReading(token: string, id: string, note?: string) {
  return authJson(`/price-readings/${id}/reject`, token, "PATCH", { note });
}

export type VendorType = "PARTICULIER" | "PROFESSIONNEL" | "COOPERATIVE";
export type VendorStatus = "EN_ATTENTE" | "ACTIF" | "SUSPENDU" | "REFUSE";
export type VendorListingStatus = "EN_ATTENTE" | "A_CORRIGER" | "VALIDEE" | "EN_VENTE" | "EPUISEE" | "REFUSEE";

export interface VendorProfileRecord {
  id: string;
  userId: string;
  type: VendorType;
  zone: string;
  paymentInfo: string;
  status: VendorStatus;
  rejectionReason: string | null;
  createdAt: string;
  user?: AgentUser;
}

export interface VendorListingRecord {
  id: string;
  vendorId: string;
  productId: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  photos: string;
  status: VendorListingStatus;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  receivedAt: string | null;
  depotId?: string | null;
  depot?: { id: string; name: string; city: string } | null;
  product: Product;
  vendor: VendorProfileRecord;
  referencePrice?: number | null;
  priceOutOfBand?: boolean;
}

export function becomeVendor(token: string, type: VendorType, zone: string, paymentInfo: string) {
  return authJson<VendorProfileRecord>("/vendor-profile", token, "POST", { type, zone, paymentInfo });
}

export function getMyVendorProfile(token: string) {
  return authFetch<VendorProfileRecord | null>("/vendor-profile/mine", token);
}

export function createVendorListing(
  token: string,
  data: { productId: string; quantity: number; unitPrice: number; photos: string[] },
) {
  return authJson<VendorListingRecord>("/vendor-listings", token, "POST", data);
}

export function getMyVendorListings(token: string) {
  return authFetch<VendorListingRecord[]>("/vendor-listings/mine", token);
}

export function getPendingVendors(token: string) {
  return authFetch<VendorProfileRecord[]>("/vendor-profile/pending", token);
}

export function approveVendor(token: string, id: string) {
  return authJson<VendorProfileRecord>(`/vendor-profile/${id}/approve`, token, "POST");
}

export function rejectVendor(token: string, id: string, reason: string) {
  return authJson<VendorProfileRecord>(`/vendor-profile/${id}/reject`, token, "POST", { reason });
}

export function getPendingVendorListings(token: string) {
  return authFetch<VendorListingRecord[]>("/vendor-listings/pending", token);
}

export function approveVendorListing(token: string, id: string) {
  return authJson<VendorListingRecord>(`/vendor-listings/${id}/approve`, token, "POST");
}

export function requestVendorListingCorrection(token: string, id: string, reason: string) {
  return authJson<VendorListingRecord>(`/vendor-listings/${id}/request-correction`, token, "POST", { reason });
}

export function rejectVendorListing(token: string, id: string, reason: string) {
  return authJson<VendorListingRecord>(`/vendor-listings/${id}/reject`, token, "POST", { reason });
}

export function markVendorListingReceived(token: string, id: string, receivedQuantity?: number, depotId?: string) {
  return authJson<VendorListingRecord>(`/vendor-listings/${id}/mark-received`, token, "POST", { ...(receivedQuantity ? { receivedQuantity } : {}), ...(depotId ? { depotId } : {}) });
}

export function updateVendorListing(token: string, id: string, data: { quantity?: number; unitPrice?: number; photos?: string[] }) {
  return authJson<VendorListingRecord>(`/vendor-listings/${id}`, token, "PATCH", data);
}

export function cancelVendorListing(token: string, id: string) {
  return authFetch<{ deleted: boolean }>(`/vendor-listings/${id}`, token, { method: "DELETE" });
}

export function updateVendorProfile(token: string, data: { zone?: string; paymentInfo?: string }) {
  return authJson<VendorProfileRecord>("/vendor-profile/mine", token, "PATCH", data);
}

export function getAllVendors(token: string) {
  return authFetch<Array<VendorProfileRecord & { _count: { listings: number } }>>("/vendor-profile/all", token);
}

export function suspendVendor(token: string, id: string, reason: string) {
  return authJson<VendorProfileRecord>(`/vendor-profile/${id}/suspend`, token, "POST", { reason });
}

export function reactivateVendor(token: string, id: string) {
  return authJson<VendorProfileRecord>(`/vendor-profile/${id}/reactivate`, token, "POST");
}

export type PaymentMethod = "MTN_MOMO" | "MOOV_MONEY";

export interface PaymentInfo {
  merchantName: string;
  mtnNumber: string;
  moovNumber: string;
}

export function getPaymentInfo() {
  return apiFetch<PaymentInfo>("/payment-info");
}

export interface ExchangeRates {
  base: "XOF";
  rates: Record<"EUR" | "USD" | "NGN" | "GHS", number>;
  updatedAt: string;
  source: "live" | "fallback";
}

export function getExchangeRates() {
  return apiFetch<ExchangeRates>("/exchange-rates");
}

// ---------------------------------------------------------------------------
// Back-office : tableau de bord, catalogue, marchés, commandes, équipe, journal
// ---------------------------------------------------------------------------

export interface AdminStats {
  generatedAt: string;
  totals: { customers: number; activeVendors: number; products: number; publishedProperties: number; markets: number };
  sales: {
    paidOrders: number;
    revenue: number;
    paidOrders30d: number;
    revenue30d: number;
    averageBasket30d: number;
    byStatus: Record<string, number>;
  };
  series: Array<{ date: string; orders: number; revenue: number }>;
  todo: {
    pendingPayments: number;
    readingsToReview: number;
    vendorsToValidate: number;
    listingsToReview: number;
    liquidityPending: number;
    propertyInquiries: number;
    contactMessages: number;
    toWithdraw: number;
    pendingPayouts: number;
  };
  lowStock: Array<{ id: string; name: string; unitLabel: string; stockQuantity: number }>;
  stalePrices: Array<{ id: string; name: string; lastAt: string | null; ageHours: number | null }>;
  topProducts30d: Array<{ productId: string; name: string; units: number }>;
}

export function getAdminStats(token: string) {
  return authFetch<AdminStats>("/admin/stats", token);
}

export interface CategoryWithCount extends Category {
  _count: { products: number };
}

export function getCategories() {
  return apiFetch<CategoryWithCount[]>("/products/categories");
}

export function createCategory(token: string, name: string) {
  return authJson<Category>("/products/categories", token, "POST", { name });
}

export function renameCategory(token: string, id: string, name: string) {
  return authJson<Category>(`/products/categories/${id}`, token, "PATCH", { name });
}

export function deleteCategory(token: string, id: string) {
  return authFetch<{ deleted: boolean }>(`/products/categories/${id}`, token, { method: "DELETE" });
}

export interface ProductInput {
  name: string;
  categoryId: string;
  unitLabel: string;
  isPerishable: boolean;
  isStockable: boolean;
}

export function createProduct(token: string, data: ProductInput) {
  return authJson<Product>("/products", token, "POST", data);
}

export function updateProduct(token: string, id: string, data: Partial<ProductInput>) {
  return authJson<Product>(`/products/${id}`, token, "PATCH", data);
}

export function adjustProductStock(token: string, id: string, quantity: number, reason: string) {
  return authJson<Product>(`/products/${id}/stock`, token, "PATCH", { quantity, reason });
}

export function deleteProduct(token: string, id: string) {
  return authFetch<{ deleted: boolean }>(`/products/${id}`, token, { method: "DELETE" });
}

export interface MarketAdmin extends Market {
  radiusMeters: number;
  assignments: Array<{ id: string; agent: AgentUser }>;
  _count: { readings: number };
}

export function getMarketsAdmin(token: string) {
  return authFetch<MarketAdmin[]>("/markets/admin/all", token);
}

export function createMarket(token: string, data: { name: string; city: string; latitude: number; longitude: number; radiusMeters?: number }) {
  return authJson<Market>("/markets", token, "POST", data);
}

export function updateMarket(token: string, id: string, data: Partial<{ name: string; city: string; latitude: number; longitude: number; radiusMeters: number }>) {
  return authJson<Market>(`/markets/${id}`, token, "PATCH", data);
}

export function deleteMarket(token: string, id: string) {
  return authFetch<{ deleted: boolean }>(`/markets/${id}`, token, { method: "DELETE" });
}

export function assignAgentToMarket(token: string, marketId: string, agentId: string) {
  return authJson<unknown>(`/markets/${marketId}/agents/${agentId}`, token, "POST");
}

export function unassignAgentFromMarket(token: string, marketId: string, agentId: string) {
  return authFetch<{ deleted: boolean }>(`/markets/${marketId}/agents/${agentId}`, token, { method: "DELETE" });
}

export function getMyMarkets(token: string) {
  return authFetch<Market[]>("/markets/mine", token);
}

export interface AdminOrder {
  id: string;
  status: Order["status"];
  totalAmount: number;
  createdAt: string;
  paidAt: string | null;
  paymentProvider: "MANUEL" | "NYOLE" | null;
  paymentMethod: PaymentMethod | null;
  paymentReference: string | null;
  rejectionReason: string | null;
  client: AgentUser;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    fulfillment: "RETRAIT" | "DEPOT";
    withdrawalCode?: string | null;
    withdrawnAt?: string | null;
    product: { id: string; name: string; unitLabel: string };
  }>;
}

export function getAdminOrders(token: string, params: { status?: string; q?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.q) qs.set("q", params.q);
  return authFetch<AdminOrder[]>(`/orders/admin/all${qs.size ? `?${qs}` : ""}`, token);
}

export function getAdminOrder(token: string, id: string) {
  return authFetch<AdminOrder & { confirmedBy: AgentUser | null }>(`/orders/admin/${id}`, token);
}

export interface WithdrawalPreview {
  itemId: string;
  orderId: string;
  client: AgentUser;
  product: string;
  unitLabel: string;
  quantity: number;
}

export function previewWithdrawal(token: string, code: string) {
  return authFetch<WithdrawalPreview[]>(`/orders/withdrawal/${encodeURIComponent(code)}`, token);
}

export function confirmWithdrawal(token: string, code: string) {
  return authJson<{ orderId: string; product: string; quantity: number; client: string }>("/orders/withdraw", token, "POST", { code });
}

export type StaffRole = "AGENT" | "AGENT_MAGASIN" | "GESTIONNAIRE_PRIX" | "GESTIONNAIRE_LIQUIDITE" | "MODERATEUR" | "ADMIN";

export interface StaffMember {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  role: StaffRole;
  disabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export function getStaff(token: string) {
  return authFetch<StaffMember[]>("/admin/staff", token);
}

export function createStaff(token: string, data: { fullName: string; phone: string; email?: string; role: StaffRole; password?: string }) {
  return authJson<{ user: StaffMember; temporaryPassword?: string }>("/admin/staff", token, "POST", data);
}

export function updateStaff(token: string, id: string, data: Partial<{ fullName: string; phone: string; email: string; role: StaffRole; disabled: boolean }>) {
  return authJson<StaffMember>(`/admin/staff/${id}`, token, "PATCH", data);
}

export function resetStaffPassword(token: string, id: string) {
  return authJson<{ temporaryPassword: string }>(`/admin/staff/${id}/reset-password`, token, "POST");
}

export function changeMyPassword(token: string, currentPassword: string, newPassword: string) {
  return authJson<{ ok: boolean }>("/auth/change-password", token, "POST", { currentPassword, newPassword });
}

export interface CustomerRow {
  id: string;
  fullName: string;
  phone: string;
  disabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  ordersCount: number;
  totalSpent: number;
}

export function getCustomers(token: string, q?: string) {
  return authFetch<CustomerRow[]>(`/admin/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`, token);
}

export function setCustomerDisabled(token: string, id: string, disabled: boolean) {
  return authJson<{ id: string; disabled: boolean }>(`/admin/customers/${id}`, token, "PATCH", { disabled });
}

export interface AuditEntry {
  id: string;
  actorId: string | null;
  actorName: string;
  action: string;
  target: string;
  detail: string | null;
  createdAt: string;
}

export function getAuditLog(token: string, params: { action?: string; skip?: number } = {}) {
  const qs = new URLSearchParams({ take: "100" });
  if (params.action) qs.set("action", params.action);
  if (params.skip) qs.set("skip", String(params.skip));
  return authFetch<AuditEntry[]>(`/admin/audit?${qs}`, token);
}

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export function getNotifications(token: string) {
  return authFetch<{ items: NotificationRecord[]; unread: number }>("/notifications", token);
}

export function getUnreadCount(token: string) {
  return authFetch<{ unread: number }>("/notifications/unread-count", token);
}

export function markAllNotificationsRead(token: string) {
  return authJson<{ ok: boolean }>("/notifications/read-all", token, "POST");
}

export interface NotificationPrefs {
  whatsappOptIn: boolean;
  /** Le canal WhatsApp est-il configuré côté serveur ? */
  whatsappAvailable: boolean;
}

export function getNotificationPrefs(token: string) {
  return authFetch<NotificationPrefs>("/notifications/preferences", token);
}

export function setNotificationPrefs(token: string, whatsappOptIn: boolean) {
  return authJson<NotificationPrefs>("/notifications/preferences", token, "PATCH", { whatsappOptIn });
}

export interface PriceAlertRecord {
  id: string;
  productId: string;
  targetPrice: number;
  active: boolean;
  createdAt: string;
  triggeredAt: string | null;
  currentPrice: number | null;
  product: { id: string; name: string; unitLabel: string };
}

export function getPriceAlerts(token: string) {
  return authFetch<PriceAlertRecord[]>("/price-alerts", token);
}

export function savePriceAlert(token: string, productId: string, targetPrice: number) {
  return authJson<PriceAlertRecord>("/price-alerts", token, "POST", { productId, targetPrice });
}

export function deletePriceAlert(token: string, id: string) {
  return authFetch<{ deleted: boolean }>(`/price-alerts/${id}`, token, { method: "DELETE" });
}

export interface MarketPrice {
  marketId: string;
  name: string;
  city: string;
  price: number;
  recordedAt: string;
  readings: number;
}

/** Prix relevé dans chaque marché pour le dernier prix de référence (public, sans données d'agent). */
export function getMarketPrices(productId: string) {
  return apiFetch<MarketPrice[]>(`/products/${productId}/reference-price/markets`);
}

export interface ContactMessageRecord {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  subject: string;
  message: string;
  status: "NOUVEAU" | "TRAITE";
  createdAt: string;
  handledAt: string | null;
}

export function sendContactMessage(data: {
  name: string;
  phone?: string;
  email?: string;
  subject: string;
  message: string;
  website?: string;
}) {
  return postJson<{ received: boolean }>("/contact", data);
}

export type PropertyType = "PARCELLE" | "MAISON" | "APPARTEMENT" | "CHAMBRE" | "GUEST_HOUSE" | "LOCAL_COMMERCIAL" | "TERRAIN_AGRICOLE";
export type PropertyKind = "VENTE" | "LOCATION";
export type PropertyStatus = "DISPONIBLE" | "RESERVE" | "CONCLU";
export type AreaUnit = "M2" | "ARE" | "HECTARE";
export type RentPeriod = "NUIT" | "MOIS" | "AN";

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  kind: PropertyKind;
  status: PropertyStatus;
  published: boolean;
  featured: boolean;
  description: string;
  city: string;
  district: string | null;
  areaValue: number | null;
  areaUnit: AreaUnit;
  areaM2: number | null;
  /** Position GPS (facultative) pour la carte de la fiche. */
  latitude: number | null;
  longitude: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  titleDeed: string | null;
  price: number;
  rentPeriod: RentPeriod | null;
  negotiable: boolean;
  /** JSON.stringify d'un tableau de data URI — utiliser parseProductPhotos(). */
  photos: string;
  createdAt: string;
  updatedAt: string;
}

export type PropertyInput = Partial<
  Omit<Property, "id" | "photos" | "areaM2" | "createdAt" | "updatedAt" | "district" | "titleDeed" | "areaValue" | "bedrooms" | "bathrooms" | "rentPeriod" | "latitude" | "longitude">
> & {
  latitude?: number | null;
  longitude?: number | null;
  district?: string | null;
  titleDeed?: string | null;
  areaValue?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  rentPeriod?: RentPeriod | null;
  photos?: string[];
};

export interface PropertyInquiryRecord {
  id: string;
  propertyId: string;
  property: { id: string; title: string; city: string };
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  status: "NOUVEAU" | "TRAITE";
  createdAt: string;
  handledAt: string | null;
}

export function getProperties() {
  return apiFetch<Property[]>("/properties");
}

export function getProperty(id: string) {
  return apiFetch<Property>(`/properties/${id}`);
}

export function sendPropertyInquiry(
  propertyId: string,
  data: { name: string; phone: string; email?: string; message?: string; website?: string },
) {
  return postJson<{ received: boolean }>(`/properties/${propertyId}/inquiries`, data);
}

export function getAllProperties(token: string) {
  return authFetch<Array<Property & { _count: { inquiries: number } }>>("/properties/admin/all", token);
}

export function createProperty(token: string, data: PropertyInput) {
  return authJson<Property>("/properties", token, "POST", data);
}

export function updateProperty(token: string, id: string, data: PropertyInput) {
  return authJson<Property>(`/properties/${id}`, token, "PATCH", data);
}

export function deleteProperty(token: string, id: string) {
  return authFetch<{ deleted: boolean }>(`/properties/${id}`, token, { method: "DELETE" });
}

export function getPropertyInquiries(token: string) {
  return authFetch<PropertyInquiryRecord[]>("/properties/admin/inquiries", token);
}

export function setPropertyInquiryHandled(token: string, id: string, handled: boolean) {
  return authJson<PropertyInquiryRecord>(`/properties/inquiries/${id}/handled`, token, "PATCH", { handled });
}

export function getContactMessages(token: string) {
  return authFetch<ContactMessageRecord[]>("/contact", token);
}

export function setContactHandled(token: string, id: string, handled: boolean) {
  return authJson<ContactMessageRecord>(`/contact/${id}/handled`, token, "PATCH", { handled });
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  fulfillment: "RETRAIT" | "DEPOT";
  withdrawalCode: string | null;
  withdrawnAt: string | null;
  product: Product;
}

export interface Order {
  id: string;
  clientId: string;
  status: "EN_ATTENTE_PAIEMENT" | "EN_VERIFICATION" | "PAYEE" | "RETIREE" | "ANNULEE";
  totalAmount: number;
  createdAt: string;
  paymentMethod: PaymentMethod | null;
  paymentReference: string | null;
  paymentSubmittedAt: string | null;
  rejectionReason: string | null;
  paidAt: string | null;
  items: OrderItem[];
  client?: AgentUser;
}

export function createOrder(
  token: string,
  items: Array<{ productId: string; quantity: number; fulfillment?: "RETRAIT" | "DEPOT" }>,
) {
  return authJson<Order>("/orders", token, "POST", { items });
}

export function getMyOrders(token: string) {
  return authFetch<Order[]>("/orders/mine", token);
}

export function getOrder(token: string, id: string) {
  return authFetch<Order>(`/orders/${id}`, token);
}

/** Crée une session de paiement en ligne et renvoie l'URL vers laquelle rediriger le client. */
export function payOnline(token: string, orderId: string) {
  return authJson<{ url: string }>(`/orders/${orderId}/pay-online`, token, "POST");
}

/** Filet de sécurité si le webhook n'est pas encore arrivé — revérifie directement le statut. */
export function reconcilePayment(token: string, orderId: string) {
  return authJson<Order>(`/orders/${orderId}/reconcile-payment`, token, "POST");
}

/** Flux de secours : le client déclare avoir envoyé l'argent lui-même et indique la référence reçue par SMS. */
export function submitPaymentReference(token: string, orderId: string, paymentMethod: PaymentMethod, paymentReference: string) {
  return authJson<Order>(`/orders/${orderId}/submit-payment-reference`, token, "POST", { paymentMethod, paymentReference });
}

/** Back-office : file des paiements déclarés, en attente de vérification manuelle. */
export function getPaymentQueue(token: string) {
  return authFetch<Order[]>("/orders/payment-queue", token);
}

export function confirmPayment(token: string, orderId: string) {
  return authJson<Order>(`/orders/${orderId}/confirm-payment`, token, "POST");
}

export function rejectPayment(token: string, orderId: string, reason?: string) {
  return authJson<Order>(`/orders/${orderId}/reject-payment`, token, "POST", { reason });
}

export interface StockHolding {
  id: string;
  productId: string;
  quantity: number;
  avgUnitCost: number;
  updatedAt: string;
  product: Product;
  currentPrice: number | null;
  currentValue: number | null;
  gain: number | null;
  reservedQuantity: number;
}

export function getMyStock(token: string) {
  return authFetch<StockHolding[]>("/stock/mine", token);
}

export interface WalletTransaction {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface WalletSummary {
  balance: number;
  /** Montant déjà demandé en retrait, en attente de versement par OBP. */
  pendingPayouts: number;
  transactions: WalletTransaction[];
}

export interface PayoutRecord {
  id: string;
  amount: number;
  method: PaymentMethod;
  phone: string;
  status: "EN_ATTENTE" | "PAYE" | "REFUSE";
  reference: string | null;
  rejectionReason: string | null;
  createdAt: string;
  processedAt: string | null;
  owner?: { id: string; fullName: string; phone: string };
  processedBy?: { id: string; fullName: string } | null;
}

export function getMyPayouts(token: string) {
  return authFetch<PayoutRecord[]>("/wallet/payouts/mine", token);
}

export function getWallet(token: string) {
  return authFetch<WalletSummary>("/wallet/mine", token);
}

/** Demande de retrait : OBP verse ensuite les fonds sur le numéro Mobile Money indiqué. */
export function requestPayout(token: string, data: { amount: number; method: PaymentMethod; phone: string }) {
  return authJson<PayoutRecord>("/wallet/withdraw", token, "POST", data);
}

export function getPayouts(token: string, status?: PayoutRecord["status"]) {
  return authFetch<PayoutRecord[]>(`/payouts${status ? `?status=${status}` : ""}`, token);
}

export function markPayoutPaid(token: string, id: string, reference: string) {
  return authJson<PayoutRecord>(`/payouts/${id}/paid`, token, "POST", { reference });
}

export function rejectPayout(token: string, id: string, reason: string) {
  return authJson<PayoutRecord>(`/payouts/${id}/reject`, token, "POST", { reason });
}

// ---- Dépôts et zones de livraison ----

export interface Depot {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
}

export interface DepotAdmin extends Depot {
  _count: { listings: number; zones: number };
}

export interface DepotInput {
  name: string;
  city: string;
  address: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  active: boolean;
  depotId: string | null;
  depot: { id: string; name: string; city: string } | null;
}

export function getDepots() {
  return apiFetch<Depot[]>("/depots");
}

export function getDepotsAdmin(token: string) {
  return authFetch<DepotAdmin[]>("/depots/admin/all", token);
}

export function createDepot(token: string, data: DepotInput) {
  return authJson<Depot>("/depots", token, "POST", data);
}

export function updateDepot(token: string, id: string, data: Partial<DepotInput> & { active?: boolean }) {
  return authJson<Depot>(`/depots/${id}`, token, "PATCH", data);
}

export function deleteDepot(token: string, id: string) {
  return authFetch<{ deleted: boolean }>(`/depots/${id}`, token, { method: "DELETE" });
}

export function getDeliveryZones() {
  return apiFetch<DeliveryZone[]>("/delivery-zones");
}

export function getDeliveryZonesAdmin(token: string) {
  return authFetch<DeliveryZone[]>("/delivery-zones/admin/all", token);
}

export function createDeliveryZone(token: string, data: { name: string; fee: number; depotId?: string }) {
  return authJson<DeliveryZone>("/delivery-zones", token, "POST", data);
}

export function updateDeliveryZone(token: string, id: string, data: Partial<{ name: string; fee: number; depotId: string | null; active: boolean }>) {
  return authJson<DeliveryZone>(`/delivery-zones/${id}`, token, "PATCH", data);
}

export function deleteDeliveryZone(token: string, id: string) {
  return authFetch<{ deleted: boolean }>(`/delivery-zones/${id}`, token, { method: "DELETE" });
}

export interface LiquidityRequestRecord {
  id: string;
  clientId: string;
  productId: string;
  quantity: number;
  status: "EN_ATTENTE" | "OFFRE_ENVOYEE" | "ACCEPTEE" | "REFUSEE";
  offeredUnitPrice: number | null;
  offeredById: string | null;
  offeredAt: string | null;
  expiresAt: string | null;
  decidedAt: string | null;
  createdAt: string;
  product: Product;
  client?: AgentUser;
}

export function createLiquidityRequest(token: string, productId: string, quantity: number) {
  return authJson<LiquidityRequestRecord>("/liquidity-requests", token, "POST", { productId, quantity });
}

export function getMyLiquidityRequests(token: string) {
  return authFetch<LiquidityRequestRecord[]>("/liquidity-requests/mine", token);
}

export function acceptLiquidityRequest(token: string, id: string) {
  return authFetch<LiquidityRequestRecord>(`/liquidity-requests/${id}/accept`, token, { method: "POST" });
}

export function rejectLiquidityRequest(token: string, id: string) {
  return authFetch<LiquidityRequestRecord>(`/liquidity-requests/${id}/reject`, token, { method: "POST" });
}

export function getPendingLiquidityRequests(token: string) {
  return authFetch<LiquidityRequestRecord[]>("/liquidity-requests/pending", token);
}

export interface ResaleListingRecord {
  id: string;
  sellerId: string;
  productId: string;
  quantity: number;
  status: "EN_VENTE" | "VENDU" | "ANNULE";
  createdAt: string;
  cancelledAt: string | null;
  product: Product;
}

export function createResaleListing(token: string, productId: string, quantity: number) {
  return authJson<ResaleListingRecord>("/resale-listings", token, "POST", { productId, quantity });
}

export function getMyResaleListings(token: string) {
  return authFetch<ResaleListingRecord[]>("/resale-listings/mine", token);
}

export function cancelResaleListing(token: string, id: string) {
  return authFetch<ResaleListingRecord>(`/resale-listings/${id}/cancel`, token, { method: "POST" });
}

export function offerLiquidity(token: string, id: string, unitPrice: number) {
  return authJson<LiquidityRequestRecord>(`/liquidity-requests/${id}/offer`, token, "POST", { unitPrice });
}

export interface PriceReadingResult {
  reading: {
    id: string;
    status: "VALIDE" | "A_CONTROLER" | "REJETE";
    flagReason: string | null;
    price: number;
    recordedAt: string;
  };
  recompute: {
    published: boolean;
    reason?: "insufficient-readings" | "insufficient-markets";
    readingsCount: number;
    marketsCount: number;
    value?: number;
  };
}

/** Relevé de prix : réservé à l'agent connecté, à qui le relevé est attribué (l'API ignore tout identifiant d'agent envoyé). */
export async function submitPriceReading(
  token: string,
  input: {
    productId: string;
    marketId: string;
    price: number;
    quality?: string;
    latitude?: number;
    longitude?: number;
  },
): Promise<PriceReadingResult> {
  return authJson<PriceReadingResult>("/price-readings", token, "POST", input);
}
