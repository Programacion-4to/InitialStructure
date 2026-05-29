"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Lock } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { PinModal } from "@/components/PinModal";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { apiRequest, setSelectedProfile, desbloquearPerfil } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Profile } from "@/lib/types";

const planLimits = {
  basico: 1,
  estandar: 2,
  premium: 5,
};

export default function ProfilesPage() {
  const router = useRouter();
  const { account, isAuthenticated, isLoading, selectProfile } = useAuth();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedProfileForPin, setSelectedProfileForPin] = useState<Profile | null>(null);

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
  }, [isAuthenticated, isLoading, account, router]);

  useEffect(() => {
    async function fetchProfiles() {
      if (!account?.id) return;
      
      try {
        const data = await apiRequest<Profile[]>(`/cuentas/${account.id}/perfiles`);
        if (!data || data.length === 0) {
          router.replace("/perfiles/crear");
          return;
        }
        setProfiles(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar los perfiles");
      } finally {
        setLoading(false);
      }
    }

    if (account?.id) {
      fetchProfiles();
    }
  }, [account, router]);

  const handleProfileSelect = (profile: Profile) => {
    if (profile.has_pin) {
      setSelectedProfileForPin(profile);
      return;
    }

    completeProfileSelection(profile);
  };

  const completeProfileSelection = (profile: Profile) => {
    const selectedProfileData = { id: profile.id, nombre: profile.nombre, avatar: profile.avatar };
    setSelectedProfile(selectedProfileData);
    selectProfile(selectedProfileData);
    router.push("/inicio");
  };

  // HU11: Handle PIN validation
  const handlePinSubmit = async (pin: string): Promise<{ success: boolean; error?: string; blockedUntil?: string }> => {
    if (!selectedProfileForPin) {
      return { success: false, error: "No hay perfil seleccionado" };
    }

    try {
      const result = await desbloquearPerfil(selectedProfileForPin.id, pin);
      if (result.success) {
        completeProfileSelection(selectedProfileForPin);
        return { success: true };
      }
      return {
        success: false,
        error: "PIN incorrecto",
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al validar PIN";
      const blockedUntil = err instanceof Error && "blockedUntil" in err
        ? (err as { blockedUntil?: string }).blockedUntil
        : undefined;
      return { success: false, error: errorMessage, blockedUntil };
    }
  };

  const handleCreateProfile = () => {
    if (!account) return;
    
    const canCreate = profiles.length < planLimits[account.plan];
    if (!canCreate) {
      setError("Si quieres crear un nuevo perfil, mejora tu plan");
      return;
    }
    router.push("/perfiles/crear");
  };

  if (isLoading || (loading && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4">
      <BrandLogo size="lg" className="mb-12" />
      
      <h2 className="text-3xl font-semibold text-foreground mb-10">
        Quien esta mirando?
      </h2>
      
      {error ? (
        <div className="rounded-lg border border-primary/60 bg-primary/10 px-4 py-3 text-sm text-primary">
          {error}
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-6">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => handleProfileSelect(profile)}
              className="group flex flex-col items-center gap-3 focus:outline-none"
            >
              <div className="relative rounded-lg border-2 border-transparent transition-all duration-200 group-hover:border-tito-white group-focus:border-tito-white">
                <ProfileAvatar profile={profile} size="lg" />
                {profile.has_pin && (
                  <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-background/90 flex items-center justify-center">
                    <Lock size={14} className="text-muted-foreground" />
                  </div>
                )}
              </div>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors text-sm md:text-base">
                {profile.nombre}
                {profile.es_infantil && (
                  <span className="ml-1 text-xs text-primary">(Infantil)</span>
                )}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={handleCreateProfile}
            className="group flex flex-col items-center gap-3 focus:outline-none"
          >
            <div className="flex w-28 h-28 md:w-36 md:h-36 items-center justify-center rounded-lg border-2 border-dashed border-border bg-card transition-all duration-200 group-hover:border-tito-white group-focus:border-tito-white">
              <Plus size={36} className="text-muted-foreground group-hover:text-foreground" />
            </div>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors text-sm md:text-base">
              Crear perfil
            </span>
          </button>
        </div>
      )}

      {/* HU11: PIN Modal */}
      {selectedProfileForPin && (
        <PinModal
          profileName={selectedProfileForPin.nombre}
          onSubmit={handlePinSubmit}
          onCancel={() => setSelectedProfileForPin(null)}
        />
      )}
    </div>
  );
}
