"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { BrowseHeader } from "@/components/BrowseHeader";

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { account, profile, isAuthenticated, isLoading, logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (account?.is_admin) {
      router.replace("/admin");
      return;
    }

    if (!profile) {
      router.replace("/perfiles");
      return;
    }
  }, [isAuthenticated, isLoading, account, profile, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleProfileChanged = () => {
    setRefreshKey((k) => k + 1);
  };

  const getActiveSection = () => {
    if (pathname.startsWith("/peliculas")) return "peliculas";
    if (pathname.startsWith("/series")) return "series";
    if (pathname.startsWith("/mi-lista")) return "mi-lista";
    if (pathname.startsWith("/buscar")) return "buscar";
    return "inicio";
  };

  if (isLoading || !account || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" key={refreshKey}>
      <BrowseHeader
        activeSection={getActiveSection()}
        account={account}
        onLogout={handleLogout}
        onProfileChanged={handleProfileChanged}
      />
      <main>{children}</main>
    </div>
  );
}
