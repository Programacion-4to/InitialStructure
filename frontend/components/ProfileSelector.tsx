"use client";

import { useState, useEffect } from "react";
import { BrandLogo } from "./BrandLogo";
import {
  getPerfilesByCuenta,
  getCuentaId,
  setSelectedProfile,
  authPerfil,
} from "@/lib/api";
import type { Perfil } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface ProfileSelectorProps {
  onProfileSelect: (profile: Perfil) => void;
}

export function ProfileSelector({ onProfileSelect }: ProfileSelectorProps) {
  const [profiles, setProfiles] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinModal, setPinModal] = useState<Perfil | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    async function fetchProfiles() {
      const cuentaId = getCuentaId();
      if (!cuentaId) {
        setLoading(false);
        return;
      }
      try {
        const data = await getPerfilesByCuenta(cuentaId);
        setProfiles(data);
      } catch {
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, []);

  const handleSelect = async (profile: Perfil) => {
    // Try auth without pin first; if profile has pin the backend will reject
    try {
      await authPerfil(profile.id, null);
      setSelectedProfile(profile);
      onProfileSelect(profile);
    } catch {
      // If failed, likely needs a PIN
      setPinModal(profile);
      setPinError(null);
      setPin("");
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinModal) return;
    setPinLoading(true);
    setPinError(null);
    try {
      await authPerfil(pinModal.id, pin);
      setSelectedProfile(pinModal);
      onProfileSelect(pinModal);
    } catch (err) {
      setPinError(
        err instanceof Error ? err.message : "PIN incorrecto"
      );
    } finally {
      setPinLoading(false);
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
      ) : profiles.length === 0 ? (
        <p className="text-muted-foreground">
          No hay perfiles creados para esta cuenta.
        </p>
      ) : (
        <div className="flex flex-wrap justify-center gap-6">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => handleSelect(profile)}
              className="group flex flex-col items-center gap-3 focus:outline-none"
            >
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-lg overflow-hidden border-2 border-transparent group-hover:border-tito-white group-focus:border-tito-white transition-all duration-200">
                <div
                  className="w-full h-full flex items-center justify-center text-4xl md:text-5xl font-bold text-white"
                  style={{
                    background: profile.es_infantil
                      ? "linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)"
                      : "linear-gradient(135deg, #009246 0%, #009246 33%, #ffffff 33%, #ffffff 66%, #ce2b37 66%, #ce2b37 100%)",
                  }}
                >
                  {profile.nombre.charAt(0).toUpperCase()}
                </div>
              </div>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors text-sm md:text-base">
                {profile.nombre}
                {profile.es_infantil && (
                  <span className="ml-1 text-xs text-tito-green">(Infantil)</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* PIN Modal */}
      {pinModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPinModal(null)}
        >
          <div
            className="bg-card rounded-lg p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Ingresa el PIN de {pinModal.nombre}
            </h3>
            <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN de 4 digitos"
                className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-center tracking-widest text-2xl placeholder:text-sm placeholder:tracking-normal"
                autoFocus
                disabled={pinLoading}
              />
              {pinError && (
                <p className="text-primary text-sm text-center">{pinError}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPinModal(null)}
                  className="flex-1 py-2.5 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pinLoading || pin.length < 4}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {pinLoading && <Loader2 size={16} className="animate-spin" />}
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
