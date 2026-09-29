/**
 * Champs sûrs à exposer pour un utilisateur référencé (agent, client, vendeur, gestionnaire…).
 * Ne jamais inclure `passwordHash` dans une réponse API, même pour les comptes de démo —
 * corrigé après avoir constaté que plusieurs endpoints renvoyaient le User complet.
 */
export const SAFE_USER_SELECT = {
  id: true,
  fullName: true,
  phone: true,
  role: true,
} as const;
