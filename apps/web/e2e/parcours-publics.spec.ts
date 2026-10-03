import { expect, test, type Page } from "@playwright/test";

/** Sur mobile, la navigation passe par le menu latéral ; sur ordinateur, par la barre. */
const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1280) < 1024;

test.describe("Accueil", () => {
  test("affiche la marque, les produits et l'immobilier", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/OBP Market/);
    await expect(page.getByRole("link", { name: "OBP Market, accueil" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("immobilier");
    await expect(page.getByRole("heading", { name: "Acheter par catégorie" })).toBeVisible();
    await expect(page.locator("#immobilier")).toBeVisible();
    await expect(page.getByText("Biens immobiliers", { exact: true })).toBeVisible();
  });

  test("la recherche propose des produits", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("searchbox").or(page.getByLabel("Rechercher un produit")).first().fill("maïs");
    await expect(page.getByRole("link", { name: /Maïs blanc/ }).first()).toBeVisible();
  });

  test("le lien d'accès rapide au contenu existe", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Aller au contenu" })).toBeFocused();
  });
});

test.describe("Boutique", () => {
  test("filtre par catégorie et reflète le filtre dans l'adresse", async ({ page }) => {
    test.skip(isMobile(page), "filtres en panneau sur mobile : couvert séparément");
    await page.goto("/boutique");
    const total = page.getByText(/\d+ produits?/).first();
    await expect(total).toBeVisible();
    await page.getByRole("button", { name: /^Huiles/ }).click();
    await expect(page).toHaveURL(/categorie=/);
    await expect(page.getByRole("heading", { name: "Huile de palme" }).or(page.getByText("Huile de palme").first())).toBeVisible();
  });

  test("trie par prix croissant", async ({ page }) => {
    test.skip(isMobile(page), "tri identique sur mobile");
    await page.goto("/boutique");
    await page.getByLabel("Trier par").selectOption("prix-asc");
    await expect(page).toHaveURL(/tri=prix-asc/);
  });

  test("ajoute au panier, ouvre le panier latéral et garde la ligne", async ({ page }) => {
    await page.goto("/boutique");
    await page.getByRole("button", { name: "Ajouter au panier" }).first().click();
    await expect(page.getByText(/ajouté au panier/).first()).toBeVisible();
    await page.getByRole("button", { name: /Ouvrir le panier/ }).click();
    const drawer = page.getByRole("dialog", { name: "Mon panier" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("Total estimé")).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Commander" })).toBeVisible();
  });
});

test.describe("Fiche produit", () => {
  test("montre le prix par marché et propose l'alerte de prix", async ({ page }) => {
    await page.goto("/boutique");
    await page.getByRole("link", { name: /Gari/ }).first().click();
    await expect(page).toHaveURL(/\/produits\//);
    await expect(page.getByRole("heading", { name: "Prix relevé dans chaque marché" })).toBeVisible();
    await expect(page.getByText("Le moins cher")).toBeVisible();
    // Hors connexion, l'alerte renvoie vers la connexion en gardant la page de retour.
    await expect(page.getByRole("link", { name: "Me prévenir si le prix baisse" })).toHaveAttribute("href", /connexion\?next=/);
  });
});

test.describe("Immobilier", () => {
  test("liste, filtre location et ouvre une fiche complète", async ({ page }) => {
    await page.goto("/immobilier");
    await expect(page.getByText(/\d+ biens?/).first()).toBeVisible();
    await page.getByRole("tab", { name: "À louer" }).click();
    // Dans la liste, plus aucune carte « À vendre » (l'onglet du même nom n'est pas une carte).
    await expect(page.locator("article").getByText("À vendre", { exact: true })).toHaveCount(0);
    await expect(page.locator("article").getByText("À louer", { exact: true }).first()).toBeVisible();

    await page.getByRole("tab", { name: "Tous" }).click();
    await page.getByRole("link", { name: /Terrain agricole de 1 hectare/ }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("1 hectare");
    await expect(page.getByText("≈ 10 000 m²").first()).toBeVisible();
    await expect(page.getByText(/OBP-[A-Z0-9]{5}/).first()).toBeVisible();
    await expect(page.locator("iframe[src*='openstreetmap.org']")).toBeVisible();
    await expect(page.getByRole("button", { name: "Être rappelé(e)" })).toBeVisible();
  });

  test("le formulaire de visite exige un nom et un téléphone", async ({ page }) => {
    await page.goto("/immobilier");
    // Un bien disponible (le 500 m² de démonstration est « Réservé » et n'a donc pas de formulaire).
    await page.getByRole("link", { name: /Parcelle de 1 000 m²/ }).first().click();
    const form = page.locator("#visite form");
    await form.scrollIntoViewIfNeeded();
    await form.getByRole("button", { name: "Être rappelé(e)" }).click();
    // La validation du navigateur bloque l'envoi : on reste sur le formulaire, rien n'est créé.
    await expect(form).toBeVisible();
    await expect(page.getByText("Demande envoyée")).toHaveCount(0);
  });
});

test.describe("Vendeurs", () => {
  test("un visiteur voit la présentation du programme", async ({ page }) => {
    await page.goto("/vendeur");
    await expect(page.getByRole("heading", { name: "Vendez vos produits avec OBP Market" })).toBeVisible();
    await expect(page.locator("main").getByRole("link", { name: "Devenir vendeur" }).first()).toHaveAttribute("href", /connexion\?next=\/vendeur/);
  });
});

test.describe("Pages d'information", () => {
  for (const [path, title] of [
    ["/comment-ca-marche", "Comment ça marche"],
    ["/faq", "Questions fréquentes"],
    ["/contact", "Contact"],
    ["/mentions-legales", "Mentions légales"],
    ["/conditions", "Conditions d'utilisation"],
    ["/confidentialite", "Confidentialité"],
  ] as const) {
    test(`${path} s'affiche`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    });
  }

  test("les mentions légales nomment la société éditrice", async ({ page }) => {
    await page.goto("/mentions-legales");
    await expect(page.getByText("ONE BUILD PLUS GROUPE").first()).toBeVisible();
    await expect(page.getByText("3202683256845", { exact: true })).toBeVisible();
  });

  test("une adresse inconnue affiche la page 404", async ({ page }) => {
    const res = await page.goto("/cette-page-nexiste-pas");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  });
});

test.describe("Protection des pages privées", () => {
  test("les commandes renvoient vers la connexion", async ({ page }) => {
    await page.goto("/commandes");
    await expect(page).toHaveURL(/connexion/);
  });

  test("le back-office renvoie vers la connexion interne", async ({ page }) => {
    await page.goto("/backoffice/immobilier");
    await expect(page).toHaveURL(/connexion-interne/);
  });
});

test.describe("Mobile", () => {
  test("le menu latéral liste l'immobilier", async ({ page }) => {
    test.skip(!isMobile(page), "menu latéral : mobile uniquement");
    await page.goto("/");
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    await expect(page.getByRole("link", { name: "Immobilier", exact: true }).first()).toBeVisible();
  });
});
