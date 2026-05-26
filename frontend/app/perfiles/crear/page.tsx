"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { apiRequest, getAssetUrl, setSelectedProfile, MAX_UPLOAD_SIZE } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Profile } from "@/lib/types";

export default function CreateProfilePage() {
  const router = useRouter();
  const { account, isAuthenticated, isLoading, selectProfile } = useAuth();
  
  const [nombre, setNombre] = useState("");
  const [pin, setPin] = useState("");
  const [esInfantil, setEsInfantil] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleAvatarChange = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("El avatar debe ser una imagen");
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      const allowedMB = Math.round((MAX_UPLOAD_SIZE / 1024 / 1024) * 10) / 10;
      setError(`El archivo es demasiado grande. Tamano maximo: ${allowedMB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatar(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const cleanName = nombre.trim();
    const cleanPin = pin.trim();
    if (!cleanName) {
      setError("Ingresa un nombre para el perfil");
      return;
    }
    if (cleanPin && !/^\d{4}$/.test(cleanPin)) {
      setError("El PIN debe tener 4 digitos");
      return;
    }

    setLoading(true);
    try {
      const profile = await apiRequest<Profile>("/cuentas/perfiles", {
        method: "POST",
        body: JSON.stringify({
          nombre: cleanName,
          pin: cleanPin || null,
          avatar,
          es_infantil: esInfantil,
        }),
      });
      const selectedProfileData = { id: profile.id, nombre: profile.nombre, avatar: profile.avatar };
      setSelectedProfile(selectedProfileData);
      selectProfile(selectedProfileData);
      router.push("/inicio");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo crear el perfil";
      setError(message.toLowerCase().includes("plan") ? "Si quieres crear un nuevo perfil, mejora tu plan" : message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-2xl"
      >
        <div className="mb-8 flex justify-center">
          <BrandLogo size="lg" />
        </div>
        <h1 className="mb-2 text-center text-2xl font-bold text-foreground">Crear perfil</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Necesitas al menos un perfil para empezar a mirar.
        </p>

        <div className="mb-5 flex justify-center">
          <label className="group flex cursor-pointer flex-col items-center gap-2">
            <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary text-3xl font-bold text-foreground">
              {avatar ? (
                <img src={getAssetUrl(avatar) || ""} alt="" className="h-full w-full object-cover" />
              ) : (
                (nombre.trim().charAt(0) || "?").toUpperCase()
              )}
            </span>
            <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground">
              Subir avatar
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={loading}
              onChange={(event) => handleAvatarChange(event.target.files?.[0])}
            />
          </label>
        </div>

        <label htmlFor="profile-name" className="mb-2 block text-sm font-medium text-foreground">
          Nombre
        </label>
        <input
          id="profile-name"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          className="mb-4 w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary"
          placeholder="Tu perfil"
          maxLength={50}
          disabled={loading}
          required
        />

        <label htmlFor="profile-pin" className="mb-2 block text-sm font-medium text-foreground">
          PIN opcional
        </label>
        <input
          id="profile-pin"
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
          className="mb-2 w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary"
          placeholder="4 digitos"
          inputMode="numeric"
          maxLength={4}
          disabled={loading}
        />
        <p className="mb-4 text-xs text-muted-foreground">Dejalo vacio si no queres proteger este perfil.</p>

        <div className="mb-5 flex items-center gap-3">
          <input
            id="es-infantil"
            type="checkbox"
            checked={esInfantil}
            onChange={(e) => setEsInfantil(e.target.checked)}
            className="h-5 w-5 rounded border-border bg-secondary text-primary focus:ring-primary"
            disabled={loading}
          />
          <label htmlFor="es-infantil" className="text-sm text-foreground">
            Es un perfil infantil (solo contenido ATP)
          </label>
        </div>

        {error && <p className="mb-4 text-center text-sm text-primary">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
          {loading ? "Creando..." : "Crear perfil"}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="mt-3 w-full rounded-lg bg-secondary px-4 py-3 font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
        >
          Cancelar
        </button>
      </form>
    </div>
  );
}
