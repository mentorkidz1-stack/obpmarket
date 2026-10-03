// Contrôles de sécurité de l'API (aucune écriture durable). À lancer contre une API locale : npm run start:dev
// Identifiants du personnel facultatifs : STAFF_EMAIL / STAFF_PASSWORD (un compte MODERATEUR suffit).
const API = process.env.API_URL ?? "http://localhost:3001";
const J = { "Content-Type": "application/json" };
const call = async (method, path, token, body) => {
  const r = await fetch(`${API}${path}`, { method, headers: token ? { ...J, Authorization: `Bearer ${token}` } : J, body: body ? JSON.stringify(body) : undefined });
  return [r.status, await r.json().catch(() => null)];
};
let failures = 0;
const ok = (label, got, want) => {
  const pass = Array.isArray(want) ? want.includes(got) : got === want;
  if (!pass) failures++;
  console.log(`${pass ? "OK " : "KO "} ${label} → ${got}${pass ? "" : ` (attendu ${want})`}`);
};

console.log("--- Routes qui étaient publiques : doivent exiger une connexion");
ok("créer un utilisateur ADMIN sans connexion", (await call("POST", "/users", null, { phone: "+22900000000", fullName: "x", role: "ADMIN" }))[0], 401);
ok("lister les utilisateurs sans connexion", (await call("GET", "/users", null))[0], 401);
ok("créer un produit sans connexion", (await call("POST", "/products", null, { name: "x", categoryId: "x", unitLabel: "x" }))[0], 401);
ok("créer une catégorie sans connexion", (await call("POST", "/products/categories", null, { name: "x" }))[0], 401);
ok("créer un marché sans connexion", (await call("POST", "/markets", null, { name: "x", city: "x", latitude: 6, longitude: 2 }))[0], 401);
ok("affecter un agent sans connexion", (await call("POST", "/markets/a/agents/b", null))[0], 401);
ok("recalcul de prix sans connexion", (await call("POST", "/products/x/reference-price/recompute", null))[0], 401);
ok("relevé de prix sans connexion", (await call("POST", "/price-readings", null, { productId: "x", marketId: "x", price: 1 }))[0], 401);
ok("agents d'un marché sans connexion", (await call("GET", "/markets/x/agents", null))[0], 401);
ok("statistiques sans connexion", (await call("GET", "/admin/stats", null))[0], 401);
ok("journal d'activité sans connexion", (await call("GET", "/admin/audit", null))[0], 401);
ok("jeton invalide", (await call("GET", "/admin/stats", "faux.jeton.ici"))[0], 401);

console.log("--- Connexion par code : interdite au personnel");
for (const phone of ["+22901000002", "+22901000003", "+22901000004"]) {
  const otp = (await call("POST", "/auth/request-otp", null, { phone }))[1];
  if (!otp?.devCode) {
    console.log(`-- ${phone} : pas de code en clair (mode production), contrôle ignoré`);
    continue;
  }
  ok(`code OTP d'un compte du personnel (${phone})`, (await call("POST", "/auth/verify-otp", null, { phone, code: otp.devCode }))[0], 403);
}

const email = process.env.STAFF_EMAIL ?? "moderatrice@obpmarket.test";
const password = process.env.STAFF_PASSWORD ?? "demo1234";
const login = await call("POST", "/auth/staff-login", null, { email, password });
if (login[0] === 201) {
  const T = login[1].accessToken;
  console.log("--- Droits par rôle (compte " + login[1].user.role + ")");
  const isAdmin = login[1].user.role === "ADMIN";
  ok("créer un produit avec un rôle sans droit", (await call("POST", "/products", T, { name: "x", categoryId: "x", unitLabel: "x" }))[0], isAdmin ? [201, 400, 409] : 403);
  ok("liste de l'équipe", (await call("GET", "/admin/staff", T))[0], isAdmin ? 200 : 403);
  ok("journal d'activité", (await call("GET", "/admin/audit", T))[0], isAdmin ? 200 : 403);
  ok("changement de mot de passe : mot de passe actuel faux", (await call("POST", "/auth/change-password", T, { currentPassword: "faux", newPassword: "unNouveauMotDePasse1" }))[0], 401);
} else {
  console.log("-- connexion du personnel impossible avec ces identifiants (", login[0], ") : contrôles par rôle ignorés");
}

console.log("--- Limite des essais de connexion du personnel");
let last = 0;
for (let i = 0; i < 7; i++) last = (await call("POST", "/auth/staff-login", null, { email: "inconnu@obpmarket.test", password: "mauvais" + i }))[0];
ok("blocage après des mots de passe erronés répétés", last, 429);

console.log(failures === 0 ? "\nTous les contrôles passent." : `\n${failures} contrôle(s) en échec.`);
process.exitCode = failures === 0 ? 0 : 1;
