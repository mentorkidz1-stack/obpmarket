"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

/**
 * Protège un écran back-office : redirige vers /connexion-interne si personne n'est
 * connecté ou si le rôle ne fait pas partie de ceux autorisés pour cet écran —
 * docs/decisions/0006-connexion-interne.md.
 */
export function useStaffSession(allowedRoles: string[]) {
  const router = useRouter();
  const { user, token, ready, logout } = useAuth();

  const authorized = ready && !!token && !!user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!ready) return;
    if (!token || !user || !allowedRoles.includes(user.role)) {
      router.replace("/connexion-interne");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token, user?.role]);

  return { user, token, ready, authorized, logout };
}
