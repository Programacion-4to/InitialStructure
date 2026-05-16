"use client";

import { useState } from "react";
import { Menu, X, LogOut, User, Check, Plus, Settings, Crown, Loader2 } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { ProfileCreateScreen } from "./ProfileCreateScreen";
import { apiRequest, getAssetUrl, getSelectedProfile, logout, setSelectedProfile, MAX_UPLOAD_SIZE } from "@/lib/api";
import type { CuentaResponse, Perfil } from "@/lib/types";

interface HeaderProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  onLogout: () => void;
}

const navItems = [
  { id: "inicio", label: "Inicio" },
  { id: "catalogo", label: "Catalogo" },
  { id: "peliculas", label: "Peliculas" },
  { id: "series", label: "Series" },
  { id: "mi-lista", label: "Mi lista" },
];

export function Header({ activeSection, onNavigate, onLogout }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profile = getSelectedProfile();

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background to-transparent">
      <div className="px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => onNavigate("inicio")} className="shrink-0">
            <BrandLogo size="md" />
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 ml-10">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`text-sm font-medium transition-colors hover:text-foreground ${
                  activeSection === item.id ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right side - Profile & Logout */}
          <div className="hidden md:flex items-center gap-4">
            {profile && (
              <div className="flex items-center gap-2 text-foreground">
                <div 
                  className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, #009246 0%, #009246 33%, #ffffff 33%, #ffffff 66%, #ce2b37 66%, #ce2b37 100%)`,
                  }}
                >
                  {profile.nombre.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm">{profile.nombre}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:text-primary transition-colors"
            >
              <LogOut size={18} />
              Salir
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-foreground p-2"
            aria-label={mobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border">
            <nav className="flex flex-col gap-2 mt-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-4 py-2 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t border-border">
              {profile && (
                <div className="flex items-center gap-2 px-4 py-2 text-foreground">
                  <User size={18} />
                <span className="text-sm">
                  {profile.nombre}
                  {profile.es_infantil && (
                    <span className="ml-1 text-xs text-tito-green">(Infantil)</span>
                  )}
                </span>
                </div>
              )}
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 text-foreground hover:text-primary transition-colors w-full"
              >
                <LogOut size={18} />
                Salir
              </button>
            </div>
          </div>
        )}
      </div>
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
  account: CuentaResponse;
  profiles: Perfil[];
  selectedProfileId?: number;
  canCreateProfile: boolean;
  message: string | null;
  onProfileClick: (profile: Perfil) => void;
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
  account: CuentaResponse;
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
  account: CuentaResponse;
  profile: Perfil | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [email, setEmail] = useState(account.email);
  const [password, setPassword] = useState("");
  const [name, setName] = useState(profile?.nombre || "");
  const [pin, setPin] = useState("");
  const [avatar, setAvatar] = useState<string | null>(profile?.avatar || null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAvatarChange = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_SIZE) {
      const allowedMB = Math.round((MAX_UPLOAD_SIZE / 1024 / 1024) * 10) / 10;
      setError(`El archivo es demasiado grande. Tamaño máximo: ${allowedMB}MB.`);
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
        const updated = await apiRequest<Perfil>(`/cuentas/perfiles/${profile.id}`, {
          method: "PUT",
          body: JSON.stringify({
            nombre: name,
            pin: pin || undefined,
            avatar,
          }),
        });
        setSelectedProfile(updated);
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ProfileAvatar({ profile, size }: { profile?: { nombre: string; avatar?: string | null } | null; size: "sm" | "lg" }) {
  const className = size === "sm" ? "h-8 w-8 text-sm" : "h-24 w-24 text-3xl";
  const avatarUrl = getAssetUrl(profile?.avatar);
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded bg-secondary font-bold text-foreground ${className}`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : profile?.nombre ? (
        profile.nombre.charAt(0).toUpperCase()
      ) : (
        <User size={18} />
      )}
    </span>
  );
}
