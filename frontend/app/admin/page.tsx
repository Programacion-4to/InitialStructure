"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AdminDashboard } from "@/components/AdminDashboard";
import { useAuth } from "@/lib/auth-context";

export default function AdminPage() {
  const router = useRouter();
  const { account, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!account?.is_admin) {
      router.replace("/inicio");
      return;
    }
  }, [isAuthenticated, isLoading, account, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isLoading || !account?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
