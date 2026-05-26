"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { apiRequest, getStoredAccount, getSelectedProfile, setStoredAccount, setSelectedProfile, logout as logoutApi, isAuthenticated as isAuthenticatedApi } from "./api";
import type { AuthAccount, Profile } from "./types";

interface AuthContextType {
  account: AuthAccount | null;
  profile: { id: number; nombre: string; avatar?: string | null } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (account: AuthAccount) => void;
  selectProfile: (profile: { id: number; nombre: string; avatar?: string | null }) => void;
  logout: () => void;
  refreshAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<AuthAccount | null>(null);
  const [profile, setProfile] = useState<{ id: number; nombre: string; avatar?: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAccount = useCallback(async () => {
    if (!isAuthenticatedApi()) {
      setAccount(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentAccount = await apiRequest<AuthAccount>("/auth/me");
      setAccount(currentAccount);
      setStoredAccount({
        id: currentAccount.id,
        email: currentAccount.email,
        is_admin: currentAccount.is_admin,
      });
      
      const storedProfile = getSelectedProfile();
      if (storedProfile) {
        setProfile(storedProfile);
      }
    } catch {
      logoutApi();
      setAccount(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initialize from localStorage
    const storedAccount = getStoredAccount();
    const storedProfile = getSelectedProfile();
    
    if (storedAccount && isAuthenticatedApi()) {
      setAccount(storedAccount as AuthAccount);
      if (storedProfile) {
        setProfile(storedProfile);
      }
    }
    
    // Refresh account data from server
    refreshAccount();
  }, [refreshAccount]);

  const login = useCallback((newAccount: AuthAccount) => {
    setAccount(newAccount);
    setStoredAccount({
      id: newAccount.id,
      email: newAccount.email,
      is_admin: newAccount.is_admin,
    });
  }, []);

  const selectProfile = useCallback((newProfile: { id: number; nombre: string; avatar?: string | null }) => {
    setProfile(newProfile);
    setSelectedProfile(newProfile);
  }, []);

  const logout = useCallback(() => {
    logoutApi();
    setAccount(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        account,
        profile,
        isAuthenticated: isAuthenticatedApi() && !!account,
        isLoading,
        login,
        selectProfile,
        logout,
        refreshAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
