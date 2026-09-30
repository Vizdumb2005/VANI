"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";

export type UserRole = "viewer" | "operator" | "admin";

export interface AuthUser {
  sub: string;
  email: string | null;
  name: string | null;
  role: UserRole;
  authenticated: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isConfigured: boolean;
  authError: string | null;
  signOut: () => void;
  refreshIdentity: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshIdentity = useCallback(async (nextToken: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${nextToken}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Unable to resolve identity");
      const identity = (await response.json()) as AuthUser;
      setToken(nextToken);
      setUser(identity);
    } catch (error) {
      setToken(null);
      setUser(null);
      setAuthError(error instanceof Error ? error.message : "Google sign-in failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isConfigured: Boolean(GOOGLE_CLIENT_ID),
      authError,
      signOut: () => {
        const google = (window as any).google;
        google?.accounts?.id?.disableAutoSelect?.();
        setToken(null);
        setUser(null);
        setAuthError(null);
      },
      refreshIdentity,
    }),
    [user, token, isLoading, authError, refreshIdentity],
  );

  return (
    <AuthContext.Provider value={value}>
      {GOOGLE_CLIENT_ID && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={() => window.dispatchEvent(new Event("google-gsi-ready"))}
        />
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

export function GoogleSignInButton() {
  const { isConfigured, user, signOut, refreshIdentity, authError, isLoading } = useAuth();
  const buttonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const render = () => {
      const google = (window as any).google;
      if (!isConfigured || user || !google?.accounts?.id || !buttonRef.current) return;
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: ({ credential }: { credential?: string }) => {
          if (!credential) return;
          void refreshIdentity(credential).catch(() => undefined);
        },
      });
      google.accounts.id.renderButton(buttonRef.current, { theme: "outline", size: "medium" });
    };
    window.addEventListener("google-gsi-ready", render);
    render();
    return () => window.removeEventListener("google-gsi-ready", render);
  }, [isConfigured, user, refreshIdentity]);

  if (user) {
    return (
      <button
        type="button"
        onClick={signOut}
        className="rounded border border-border bg-surface px-3 py-1.5 text-xs text-secondary hover:text-charcoal"
        title="Sign out of the VAANI operator session"
      >
        {user.email || "Signed in"} · Sign out
      </button>
    );
  }
  if (!isConfigured) {
    return <span className="text-[11px] text-secondary">Viewer mode · Google login not configured</span>;
  }
  return (
    <div className="flex flex-col items-end gap-1">
      <div ref={buttonRef} aria-label="Sign in with Google" />
      {isLoading && <span className="text-[11px] text-secondary">Checking Google identity…</span>}
      {authError && <span className="text-[11px] text-red-700">Sign-in unavailable; try again.</span>}
    </div>
  );
}
