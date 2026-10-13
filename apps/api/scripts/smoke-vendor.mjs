// Test de bout en bout du parcours vendeur contre une API locale (`npm run start:dev`).
// Crée un vendeur de test (+22990009999) : à supprimer ensuite de la base (voir docs/decisions/0013-parcours-vendeur.md).
const API = process.env.API_URL ?? "http://localhost:3001";
const PHONE = "+22990009999";
const J = { "Content-Type": "application/json" };
const call = async (method, path, token, body) => {
  const r = await fetch(`${API}${path}`, { method, headers: token ? { ...J, Authorization: `Bearer ${token}` } : J, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => null);
  return [r.status, data];
};
const ok = (label, got, want) => console.log(`${got === want ? "OK " : "KO "} ${label} → ${got}${got === want ? "" : ` (attendu ${want})`}`);

const otp = (await call("POST", "/auth/request-otp", null, { phone: PHONE }))[1];
const vendorLogin = (await call("POST", "/auth/verify-otp", null, { phone: PHONE, code: otp.devCode }))[1];
const V = vendorLogin.accessToken;
const staff = (await call("POST", "/auth/staff-login", null, { email: process.env.STAFF_EMAIL ?? "moderatrice@obpmarket.test", password: process.env.STAFF_PASSWORD ?? "demo1234" }))[1].accessToken;

const products = (await call("GET", "/products"))[1];
const stockable = products.find((p) => p.isStockable && !p.isPerishable);
const perishable = products.find((p) => p.isPerishable);
const photos = ["data:image/jpeg;base64,/9j/AAAA", "data:image/jpeg;base64,/9j/BBBB"];

const NEW_PROFILE = { type: "PROFESSIONNEL", zone: "Cotonou", paymentInfo: "MTN MoMo 0190000000" };
ok("inscription sans invitation refusée", (await call("POST", "/vendor-profile", V, NEW_PROFILE))[0], 400);
ok("inscription avec un faux jeton refusée", (await call("POST", "/vendor-profile", V, { ...NEW_PROFILE, inviteToken: "jeton-inventé-0123456789" }))[0], 403);
ok("création d'une invitation réservée à un client refusée", (await call("POST", "/vendor-invites", V, { note: "x" }))[0], 403);
const other = (await call("POST", "/vendor-invites", staff, { note: "Test autre numéro", phone: "+22990001111" }))[1];
ok("invitation réservée à un autre numéro refusée", (await call("POST", "/vendor-profile", V, { ...NEW_PROFILE, inviteToken: other.token }))[0], 403);
const invite = (await call("POST", "/vendor-invites", staff, { note: "Test vendeur", phone: PHONE, type: "PROFESSIONNEL", zone: "Cotonou" }))[1];
ok("création de l'invitation", typeof invite?.token, "string");
const check = (await call("GET", `/vendor-invites/check/${invite.token}`))[1];
ok("le lien est vérifiable publiquement", check?.valid, true);
ok("le mémo interne n'est pas exposé", check?.note, undefined);

let r = await call("POST", "/vendor-profile", V, { ...NEW_PROFILE, inviteToken: invite.token });
ok("ouverture du compte avec l'invitation", r[0], 201);
ok("le compte est actif tout de suite", r[1]?.status, "ACTIF");
const profileId = r[1].id;
ok("invitation à usage unique", (await call("POST", "/vendor-profile", V, { ...NEW_PROFILE, inviteToken: invite.token }))[0], 409);
ok("invitation utilisée signalée", (await call("GET", `/vendor-invites/check/${invite.token}`))[1]?.reason, "USED");
const revoked = (await call("POST", "/vendor-invites", staff, { note: "Test annulée" }))[1];
await call("POST", `/vendor-invites/${revoked.id}/revoke`, staff);
ok("invitation annulée signalée", (await call("GET", `/vendor-invites/check/${revoked.token}`))[1]?.reason, "REVOKED");
await call("POST", `/vendor-invites/${other.id}/revoke`, staff);
ok("modification du profil", (await call("PATCH", "/vendor-profile/mine", V, { zone: "Bénin" }))[1]?.zone, "Bénin");

ok("1 seule photo refusée", (await call("POST", "/vendor-listings", V, { productId: stockable.id, quantity: 5, unitPrice: 1000, photos: [photos[0]] }))[0], 400);
if (perishable) ok("produit frais refusé", (await call("POST", "/vendor-listings", V, { productId: perishable.id, quantity: 5, unitPrice: 1000, photos }))[0], 400);

r = await call("POST", "/vendor-listings", V, { productId: stockable.id, quantity: 5, unitPrice: 1000, photos });
ok("création de l'annonce", r[0], 201);
const lid = r[1].id;
ok("demande de correction", (await call("POST", `/vendor-listings/${lid}/request-correction`, staff, { reason: "Photo floue" }))[1]?.status, "A_CORRIGER");
r = await call("PATCH", `/vendor-listings/${lid}`, V, { unitPrice: 1100, quantity: 4 });
ok("correction par le vendeur → en attente", r[1]?.status, "EN_ATTENTE");
ok("motif effacé après correction", r[1]?.rejectionReason, null);
ok("annonce d'un autre refusée", (await call("PATCH", `/vendor-listings/inexistant`, V, { quantity: 2 }))[0], 404);
ok("approbation de l'annonce", (await call("POST", `/vendor-listings/${lid}/approve`, staff))[1]?.status, "VALIDEE");
ok("modification interdite après validation", (await call("PATCH", `/vendor-listings/${lid}`, V, { quantity: 2 }))[0], 400);
ok("réception > annoncé refusée", (await call("POST", `/vendor-listings/${lid}/mark-received`, staff, { receivedQuantity: 9 }))[0], 400);
r = await call("POST", `/vendor-listings/${lid}/mark-received`, staff, { receivedQuantity: 3 });
ok("réception partielle (3 sur 4)", `${r[1]?.status}/${r[1]?.receivedQuantity}`, "EN_VENTE/3");
ok("retrait impossible quand en vente", (await call("DELETE", `/vendor-listings/${lid}`, V))[0], 400);

ok("liste de tous les vendeurs (staff)", (await call("GET", "/vendor-profile/all", staff))[0], 200);
ok("liste de tous les vendeurs sans jeton", (await call("GET", "/vendor-profile/all", null))[0], 401);
ok("suspension", (await call("POST", `/vendor-profile/${profileId}/suspend`, staff, { reason: "Test" }))[1]?.status, "SUSPENDU");
ok("annonce impossible quand suspendu", (await call("POST", "/vendor-listings", V, { productId: stockable.id, quantity: 1, unitPrice: 1000, photos }))[0], 403);
ok("réactivation", (await call("POST", `/vendor-profile/${profileId}/reactivate`, staff))[1]?.status, "ACTIF");

// 2e annonce pour tester le retrait
r = await call("POST", "/vendor-listings", V, { productId: stockable.id, quantity: 2, unitPrice: 1000, photos });
ok("retrait d'une annonce en attente", (await call("DELETE", `/vendor-listings/${r[1].id}`, V))[0], 200);
console.log("profileId", profileId, "userId", vendorLogin.user.id);
