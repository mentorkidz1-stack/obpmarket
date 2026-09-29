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

/** Requête authentifiée — envoie le jeton du staff ou du client connecté (JwtAuthGuard). */
async function authFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `Échec de la requête (${res.status})`));
  }
  return res.json() as Promise<T>;
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
  return res.json() as Promise<T>;
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

export function getAgents() {
  return apiFetch<AgentUser[]>("/users?role=AGENT");
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

export function markVendorListingReceived(token: string, id: string) {
  return authJson<VendorListingRecord>(`/vendor-listings/${id}/mark-received`, token, "POST");
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
  transactions: WalletTransaction[];
}

export function getWallet(token: string) {
  return authFetch<WalletSummary>("/wallet/mine", token);
}

export function withdrawWallet(token: string, amount: number) {
  return authJson<WalletSummary>("/wallet/withdraw", token, "POST", { amount });
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

export async function submitPriceReading(input: {
  productId: string;
  marketId: string;
  agentId: string;
  price: number;
  quality?: string;
  latitude?: number;
  longitude?: number;
}): Promise<PriceReadingResult> {
  return postJson<PriceReadingResult>("/price-readings", input);
}
