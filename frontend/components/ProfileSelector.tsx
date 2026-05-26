"use client";

import { useState, useEffect } from "react";
import { Lock, Plus } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { apiRequest, desbloquearPerfil, setSelectedProfile } from "@/lib/api";
import { PinModal } from "./PinModal";
import { ProfileAvatar } from "./ProfileAvatar";
import type { Profile } from "@/lib/types";

interface ProfileSelectorProps {
  accountId: number;
  accountPlan: "basico" | "estandar" | "premium";
  onProfileSelect: (profile: { id: number; nombre: string }) => void;
  onNoProfiles: () => void;
  onCreateProfile: () => void;
}

const planLimits = {
  basico: 1,
  estandar: 2,
  premium: 5,
};

export function ProfileSelector({ accountId, accountPlan, onProfileSelect, onNoProfiles, onCreateProfile }: ProfileSelectorProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileForPin, setSelectedProfileForPin] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canCreateProfile = profiles.length < planLimits[accountPlan];

  useEffect(() => {
    async function fetchProfiles() {
      try {
        const data = await apiRequest<Profile[]>(`/cuentas/${accountId}/perfiles`);
        if (!data || data.length === 0) {
          onNoProfiles();
          return;
        }
        setProfiles(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar los perfiles");
      } finally {
        setLoading(false);
      }
    }

    fetchProfiles();
  }, [accountId, onNoProfiles]);

  const completeProfileSelection = (profile: Profile) => {
    const selectedProfile = { id: profile.id, nombre: profile.nombre };
    setSelectedProfile(selectedProfile);
    onProfileSelect(selectedProfile);
  };

  const handleProfileSelect = (profile: Profile) => {
    if (profile.has_pin) {
      setSelectedProfileForPin(profile);
      return;
    }
    completeProfileSelection(profile);
  };

  const handlePinSubmit = async (pin: string): Promise<{ success: boolean; error?: string; blockedUntil?: string }> => {
    if (!selectedProfileForPin) {
      return { success: false, error: "No hay perfil seleccionado" };
    }

    try {
      await desbloquearPerfil(selectedProfileForPin.id, pin);
      completeProfileSelection(selectedProfileForPin);
      return { success: true };
    } catch (err) {
      const blockedUntil = err instanceof Error && "blockedUntil" in err
        ? (err as { blockedUntil?: string }).blockedUntil
        : undefined;
      return {
        success: false,
        error: err instanceof Error ? err.message : "PIN invalido",
        blockedUntil,
      };
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4">
      <BrandLogo size="lg" className="mb-12" />
      
      <h2 className="text-3xl font-semibold text-foreground mb-10">
        Quien esta mirando?
      </h2>
      
      {loading ? (
        <div className="flex gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-lg bg-muted animate-pulse" />
              <div className="w-20 h-4 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : error ? (
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
                  <div className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90">
                    <Lock size={14} className="text-muted-foreground" />
                  </div>
                )}
              </div>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors text-sm md:text-base">
                {profile.nombre}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              if (!canCreateProfile) {
                setError("Si quieres crear un nuevo perfil, mejora tu plan");
                return;
              }
              onCreateProfile();
            }}
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
