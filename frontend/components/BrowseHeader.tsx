"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Crown, Loader2, Lock, LogOut, Menu, Plus, Search, Settings, X } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { PinModal } from "./PinModal";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileCreateScreen } from "./ProfileCreateScreen";
import { apiRequest, desbloquearPerfil, getAssetUrl, getSelectedProfile, logout, setSelectedProfile, MAX_UPLOAD_SIZE } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { AuthAccount, Profile } from "@/lib/types";

interface BrowseHeaderProps {
  activeSection: string;
  account: AuthAccount;
  onLogout: () => void;
  onProfileChanged: () => void;
}

const navItems = [
  { id: "inicio", label: "Inicio", href: "/inicio" },
  { id: "peliculas", label: "Peliculas", href: "/peliculas" },
  { id: "series", label: "Series", href: "/series" },
  { id: "mi-lista", label: "Mi lista", href: "/mi-lista" },
];

// Inline search state lives here so it works from any browse page

const planLimits: Record<string, number> = {
  basico: 1,
  estandar: 2,
  premium: 5,
};

export function BrowseHeader({ activeSection, account, onLogout, onProfileChanged }: BrowseHeaderProps) {
  const router = useRouter();
  const { selectProfile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileState, setSelectedProfileState] = useState(getSelectedProfile());
  const [pinProfile, setPinProfile] = useState<Profile | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const currentProfile = profiles.find((profile) => profile.id === selectedProfileState?.id) || selectedProfileState;
  const canCreateProfile = profiles.length < planLimits[account.plan || ""] || !account.plan;

  const loadProfiles = async () => {
    const data = await apiRequest<Profile[]>(`/cuentas/${account.id}/perfiles`);
    setProfiles(data);
    const stored = getSelectedProfile();
    const freshSelected = data.find((profile) => profile.id === stored?.id);
    if (freshSelected) {
      selectProfileLocally(freshSelected);
    }
  };

  useEffect(() => {
    loadProfiles().catch(() => setProfiles([]));
  }, [account.id]);

  const selectProfileLocally = (profile: Profile) => {
    const storedProfile = { id: profile.id, nombre: profile.nombre, avatar: profile.avatar };
    setSelectedProfile(storedProfile);
    setSelectedProfileState(storedProfile);
    selectProfile(storedProfile);
  };

  const handleProfileClick = (profile: Profile) => {
    setMessage(null);
    if (profile.id === selectedProfileState?.id) return;
    if (profile.has_pin) {
      setPinProfile(profile);
      return;
    }
    selectProfileLocally(profile);
    setProfileMenuOpen(false);
    onProfileChanged();
  };

  const handlePinSubmit = async (pin: string): Promise<{ success: boolean; error?: string; blockedUntil?: string }> => {
    if (!pinProfile) {
      return { success: false, error: "No hay perfil seleccionado" };
    }

    try {
      await desbloquearPerfil(pinProfile.id, pin);
      selectProfileLocally(pinProfile);
      setPinProfile(null);
      setProfileMenuOpen(false);
      onProfileChanged();
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

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background to-transparent">
      <div className="px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/inicio" className="shrink-0">
            <BrandLogo size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-6 ml-10">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-foreground ${
                  activeSection === item.id ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {/* Search button */}
            <Link
              href="/buscar"
              className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-secondary ${
                activeSection === "buscar" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Buscar"
            >
              <Search size={18} />
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-md px-2 py-1 text-foreground transition-colors hover:bg-secondary"
              >
                <ProfileAvatar profile={currentProfile} size="sm" />
                <span className="text-sm">{currentProfile?.nombre || "Perfil"}</span>
              </button>
              {profileMenuOpen && (
                <ProfileMenu
                  account={account}
                  profiles={profiles}
                  selectedProfileId={selectedProfileState?.id}
                  canCreateProfile={canCreateProfile}
                  message={message}
                  onProfileClick={handleProfileClick}
                  onCreate={() => {
                    setMessage(null);
                    if (!canCreateProfile) {
                      setMessage("Si quieres crear un nuevo perfil, mejora tu plan");
                      return;
                    }
                    setCreateOpen(true);
                    setProfileMenuOpen(false);
                  }}
                  onSettings={() => {
                    setSettingsOpen(true);
                    setProfileMenuOpen(false);
                  }}
                  onUpgrade={() => {
                    setUpgradeOpen(true);
                    setProfileMenuOpen(false);
                  }}
                  onLogout={handleLogout}
                />
              )}
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-foreground p-2"
            aria-label={mobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border">
            <nav className="flex flex-col gap-2 mt-4">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-left px-4 py-2 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/buscar"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeSection === "buscar"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Search size={16} />
                Buscar
              </Link>
            </nav>
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              <button
                onClick={() => setProfileMenuOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-foreground"
              >
                <ProfileAvatar profile={currentProfile} size="sm" />
                <span className="text-sm">{currentProfile?.nombre || "Perfil"}</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-foreground hover:text-primary transition-colors w-full"
              >
                <LogOut size={18} />
                Salir
              </button>
            </div>
          </div>
        )}
      </div>

      {pinProfile && (
        <PinModal
          profileName={pinProfile.nombre}
          onSubmit={handlePinSubmit}
          onCancel={() => setPinProfile(null)}
        />
      )}

      {createOpen && (
        <Modal title="Crear perfil" onClose={() => setCreateOpen(false)}>
          <ProfileCreateScreen
            accountId={account.id}
            compact
            onCancel={() => setCreateOpen(false)}
            onProfileCreated={(profile) => {
              setSelectedProfileState(profile);
              selectProfile(profile);
              setCreateOpen(false);
              loadProfiles().finally(onProfileChanged);
            }}
          />
        </Modal>
      )}

      {settingsOpen && (
        <AccountSettingsModal
          account={account}
          profile={profiles.find((profile) => profile.id === selectedProfileState?.id) || null}
          onClose={() => setSettingsOpen(false)}
          onSaved={() => {
            loadProfiles().finally(onProfileChanged);
          }}
        />
      )}

      {upgradeOpen && (
        <PlanUpgradeModal
          account={account}
          onClose={() => setUpgradeOpen(false)}
          onUpgraded={() => {
            setUpgradeOpen(false);
            window.location.reload();
          }}
        />
      )}
    </header>
  );
}

function ProfileMenu({
  account,
  profiles,
  selectedProfileId,
  canCreateProfile,
  message,
  onProfileClick,
  onCreate,
  onSettings,
  onUpgrade,
  onLogout,
}: {
  account: AuthAccount;
  profiles: Profile[];
  selectedProfileId?: number;
  canCreateProfile: boolean;
  message: string | null;
  onProfileClick: (profile: Profile) => void;
  onCreate: () => void;
  onSettings: () => void;
  onUpgrade: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-card p-3 shadow-2xl">
      <div className="mb-2 px-2 text-xs text-muted-foreground">{account.email}</div>
      <div className="grid gap-1">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => onProfileClick(profile)}
            className="flex items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-secondary"
          >
            <ProfileAvatar profile={profile} size="sm" />
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{profile.nombre}</span>
            {profile.has_pin && <Lock size={14} className="text-muted-foreground" />}
            {profile.id === selectedProfileId && <Check size={16} className="text-primary" />}
          </button>
        ))}
      </div>
      {message && <p className="mt-2 rounded-md bg-primary/10 px-2 py-2 text-xs text-primary">{message}</p>}
      <div className="mt-3 grid gap-1 border-t border-border pt-3">
        <button
          type="button"
          onClick={onCreate}
          className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors ${
            canCreateProfile ? "text-foreground hover:bg-secondary" : "text-muted-foreground"
          }`}
        >
          <Plus size={16} />
          Crear perfil nuevo
        </button>
        <button
          type="button"
          onClick={onSettings}
          className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
        >
          <Settings size={16} />
          Ajustes de cuenta
        </button>
        <button
          type="button"
          onClick={onUpgrade}
          className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
        >
          <Crown size={16} />
          Mejorar plan
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
        >
          <LogOut size={16} />
          Cerrar sesion
        </button>
      </div>
    </div>
  );
}

const plans = [
  {
    id: "basico",
    name: "Basico",
    limit: "1 perfil",
    quality: "FHD",
    description: "Para mirar sin complicarte.",
  },
  {
    id: "estandar",
    name: "Estandar",
    limit: "2 perfiles",
    quality: "QHD",
    description: "Mas perfiles y mejor calidad.",
  },
  {
    id: "premium",
    name: "Premium",
    limit: "5 perfiles",
    quality: "4K",
    description: "La experiencia completa.",
  },
] as const;

function PlanUpgradeModal({
  account,
  onClose,
  onUpgraded,
}: {
  account: AuthAccount;
  onClose: () => void;
  onUpgraded: () => void;
}) {
  const [selectedPlan, setSelectedPlan] = useState(account.plan);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savePlan = async () => {
    setError(null);
    setSaving(true);
    try {
      await apiRequest(`/cuentas/${account.id}`, {
        method: "PUT",
        body: JSON.stringify({ plan: selectedPlan }),
      });
      onUpgraded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo mejorar el plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Mejorar plan" onClose={onClose}>
      <div className="grid gap-3">
        {plans.map((plan) => {
          const selected = selectedPlan === plan.id;
          const current = account.plan === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.id)}
              className={`rounded-lg border p-4 text-left transition-colors ${
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/40 hover:bg-secondary"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{plan.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
                </div>
                {current && (
                  <span className="rounded bg-secondary px-2 py-1 text-xs font-semibold text-muted-foreground">
                    Actual
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded bg-background px-2 py-1">{plan.limit}</span>
                <span className="rounded bg-background px-2 py-1">Calidad {plan.quality}</span>
              </div>
            </button>
          );
        })}

        {error && <p className="text-sm text-primary">{error}</p>}

        <button
          type="button"
          onClick={savePlan}
          disabled={saving || selectedPlan === account.plan}
          className="admin-button justify-center disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Crown size={18} />}
          {selectedPlan === account.plan ? "Plan actual" : "Confirmar cambio"}
        </button>
      </div>
    </Modal>
  );
}

function AccountSettingsModal({
  account,
  profile,
  onClose,
  onSaved,
}: {
  account: AuthAccount;
  profile: Profile | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { selectProfile } = useAuth();
  const [email, setEmail] = useState(account.email);
  const [password, setPassword] = useState("");
  const [name, setName] = useState(profile?.nombre || "");
  const [pin, setPin] = useState("");
  const [avatar, setAvatar] = useState<string | null>(profile?.avatar || null);
  const [esInfantil, setEsInfantil] = useState(profile?.es_infantil || false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAvatarChange = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_SIZE) {
      const allowedMB = Math.round((MAX_UPLOAD_SIZE / 1024 / 1024) * 10) / 10;
      setError(`El archivo es demasiado grande. Tamano maximo: ${allowedMB}MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (pin && !/^\d{4}$/.test(pin)) {
      setError("El PIN debe tener 4 digitos");
      return;
    }
    setSaving(true);
    try {
      await apiRequest(`/cuentas/${account.id}`, {
        method: "PUT",
        body: JSON.stringify({
          email,
          password: password || undefined,
        }),
      });
      if (profile) {
        const updated = await apiRequest<Profile>(`/cuentas/perfiles/${profile.id}`, {
          method: "PUT",
          body: JSON.stringify({
            nombre: name,
            pin: pin || undefined,
            avatar,
            es_infantil: esInfantil,
          }),
        });
        const updatedProfile = { id: updated.id, nombre: updated.nombre, avatar: updated.avatar };
        setSelectedProfile(updatedProfile);
        selectProfile(updatedProfile);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar los ajustes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Ajustes de cuenta" onClose={onClose}>
      <form onSubmit={save} className="grid gap-4">
        <label className="grid gap-2 text-sm text-foreground">
          Email
          <input className="admin-input" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="grid gap-2 text-sm text-foreground">
          Nueva contrasena
          <input
            className="admin-input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Dejar vacia para conservar"
          />
        </label>
        {profile && (
          <>
            <div className="border-t border-border pt-4" />
            <label className="grid gap-2 text-sm text-foreground">
              Nombre del perfil
              <input className="admin-input" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm text-foreground">
              Nuevo PIN del perfil
              <input
                className="admin-input"
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Dejar vacio para conservar"
                inputMode="numeric"
              />
            </label>
            <div className="flex items-center gap-3">
              <input
                id="settings-es-infantil"
                type="checkbox"
                checked={esInfantil}
                onChange={(e) => setEsInfantil(e.target.checked)}
                className="h-5 w-5 rounded border-border bg-secondary text-primary focus:ring-primary"
              />
              <label htmlFor="settings-es-infantil" className="text-sm text-foreground">
                Es un perfil infantil (solo contenido ATP)
              </label>
            </div>
            <label className="grid gap-2 text-sm text-foreground">
              Avatar del perfil
              <input type="file" accept="image/*" onChange={(event) => handleAvatarChange(event.target.files?.[0])} />
            </label>
            {avatar && <img src={getAssetUrl(avatar) || ""} alt="" className="h-20 w-20 rounded-lg object-cover" />}
          </>
        )}
        {error && <p className="text-sm text-primary">{error}</p>}
        <button className="admin-button justify-center" disabled={saving}>
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
          Guardar
        </button>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

