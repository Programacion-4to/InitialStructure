"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { apiRequest, setToken, register, setCuentaId } from "@/lib/api";
import type { TokenResponse } from "@/lib/types";

type Mode = "login" | "register";
type PlanType = "basico" | "estandar" | "premium";

function parseJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return {};
  }
}

const PLANS: { id: PlanType; label: string; description: string; features: string[] }[] = [
  {
    id: "basico",
    label: "Basico",
    description: "Para empezar",
    features: ["1 perfil", "Calidad HD", "Sin descargas"],
  },
  {
    id: "estandar",
    label: "Estandar",
    description: "Lo mas popular",
    features: ["2 perfiles", "Calidad 1440p", "Descargas incluidas con tope"],
  },
  {
    id: "premium",
    label: "Premium",
    description: "La mejor experiencia",
    features: ["4 perfiles", "Calidad 4K + HDR", "Descargas ilimitadas"],
  },
];

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>("login");

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register fields
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("estandar");
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setRegisterSuccess(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiRequest<TokenResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      setToken(response.access_token);
      // Extract cuenta_id from JWT payload
      const payload = parseJwtPayload(response.access_token);
      if (payload.sub) {
        setCuentaId(Number(payload.sub));
      }
      onLoginSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesion");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (regPassword !== regConfirm) {
      setError("Las contrasenas no coinciden");
      return;
    }
    if (regPassword.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    try {
      await register(regEmail, regPassword, selectedPlan);
      setRegisterSuccess(true);
      // Pre-fill login email for convenience
      setEmail(regEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center py-10">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.75), rgba(0,0,0,0.92)),
            url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&q=80')`,
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-card/95 backdrop-blur-sm rounded-xl p-8 flex flex-col gap-6">
          {/* Logo */}
          <div className="flex justify-center">
            <BrandLogo size="lg" />
          </div>

          {/* Tabs */}
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                mode === "login"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Iniciar sesion
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                mode === "register"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {/* ---- LOGIN FORM ---- */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                  placeholder="tu@email.com"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-foreground mb-2">
                  Contrasena
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground pr-12"
                    placeholder="Tu contrasena"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-primary text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </button>

              <p className="text-center text-sm text-muted-foreground">
                {"No tenes cuenta? "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="text-primary hover:underline font-medium"
                >
                  Registrate
                </button>
              </p>
            </form>
          )}

          {/* ---- REGISTER FORM ---- */}
          {mode === "register" && !registerSuccess && (
            <form onSubmit={handleRegister} className="flex flex-col gap-5">
              {/* Plan selector */}
              <div>
                <p className="text-sm font-medium text-foreground mb-3">Elegí tu plan</p>
                <div className="grid grid-cols-3 gap-2">
                  {PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-left ${
                        selectedPlan === plan.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary hover:border-primary/50"
                      }`}
                    >
                      <span className="text-sm font-semibold text-foreground">{plan.label}</span>
                      <span className="text-xs text-muted-foreground text-center leading-tight">{plan.description}</span>
                    </button>
                  ))}
                </div>
                {/* Plan features */}
                <ul className="mt-3 flex flex-col gap-1">
                  {PLANS.find((p) => p.id === selectedPlan)?.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check size={12} className="text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                  placeholder="tu@email.com"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-foreground mb-2">
                  Contrasena
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showRegPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground pr-12"
                    placeholder="Minimo 8 caracteres"
                    required
                    minLength={8}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showRegPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                  >
                    {showRegPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="reg-confirm" className="block text-sm font-medium text-foreground mb-2">
                  Confirmar contrasena
                </label>
                <input
                  id="reg-confirm"
                  type={showRegPassword ? "text" : "password"}
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                  placeholder="Repeti tu contrasena"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-primary text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </button>

              <p className="text-center text-sm text-muted-foreground">
                {"Ya tenes cuenta? "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-primary hover:underline font-medium"
                >
                  Inicia sesion
                </button>
              </p>
            </form>
          )}

          {/* ---- REGISTER SUCCESS ---- */}
          {mode === "register" && registerSuccess && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
                <Check size={28} className="text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">Cuenta creada</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Tu cuenta fue creada con el plan{" "}
                  <span className="text-foreground font-medium capitalize">{selectedPlan}</span>.
                  Ya podes iniciar sesion.
                </p>
              </div>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Ir a iniciar sesion
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
