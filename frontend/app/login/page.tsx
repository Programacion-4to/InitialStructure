"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { apiRequest, register, setStoredAccount, setToken, isAuthenticated } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { AuthResponse } from "@/lib/types";

type Mode = "login" | "register";
type RegisterStep = "data" | "plan";
type PlanType = "basico" | "estandar" | "premium";

const PLANS: { id: PlanType; label: string; description: string; features: string[] }[] = [
  {
    id: "basico",
    label: "Basico",
    description: "Para empezar",
    features: ["1 perfil", "Calidad FHD", "Sin descargas"],
  },
  {
    id: "estandar",
    label: "Estandar",
    description: "Lo mas popular",
    features: ["2 perfiles", "Calidad QHD", "Descargas incluidas con tope"],
  },
  {
    id: "premium",
    label: "Premium",
    description: "La mejor experiencia",
    features: ["5 perfiles", "Calidad 4K + HDR", "Descargas ilimitadas"],
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated: authIsAuthenticated, isLoading: authLoading, account } = useAuth();
  
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [registerStep, setRegisterStep] = useState<RegisterStep>("data");
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("estandar");
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (authLoading) return;
    
    if (authIsAuthenticated && account) {
      if (account.is_admin) {
        router.replace("/admin");
      } else {
        router.replace("/perfiles");
      }
    }
  }, [authIsAuthenticated, authLoading, account, router]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setRegisterStep("data");
    setRegisterSuccess(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      setToken(response.access_token);
      setStoredAccount({
        id: response.id,
        email: response.email || email,
        is_admin: Boolean(response.is_admin),
      });
      
      login({
        id: response.id!,
        email: response.email || email,
        plan: "basico",
        is_admin: Boolean(response.is_admin),
      });

      if (response.is_admin) {
        router.push("/admin");
      } else {
        router.push("/perfiles");
      }
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

    setRegisterStep("plan");
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(regEmail, regPassword, selectedPlan);
      setRegisterSuccess(true);
      setEmail(regEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminLoading(true);

    try {
      const response = await apiRequest<AuthResponse>("/auth/admin-login", {
        method: "POST",
        body: JSON.stringify({ password: adminPassword }),
      });

      setToken(response.access_token);
      setStoredAccount({
        id: response.id,
        email: response.email || "admin",
        is_admin: true,
      });
      
      login({
        id: response.id!,
        email: response.email || "admin",
        plan: "premium",
        is_admin: true,
      });

      router.push("/admin");
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "Error al iniciar como admin");
    } finally {
      setAdminLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center py-10">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.75), rgba(0,0,0,0.92)),
            url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&q=80')`,
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-card/95 backdrop-blur-sm rounded-xl p-8 flex flex-col gap-6">
          <div className="flex justify-center">
            <BrandLogo size="lg" />
          </div>

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

              {error && <p className="text-primary text-sm text-center">{error}</p>}

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

          {mode === "register" && registerStep === "data" && !registerSuccess && (
            <form onSubmit={handleRegister} className="flex flex-col gap-5">
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

              {error && <p className="text-primary text-sm text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continuar
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

          {mode === "register" && registerStep === "plan" && !registerSuccess && (
            <form onSubmit={handlePlanSubmit} className="flex flex-col gap-5">
              <div>
                <p className="text-sm font-medium text-foreground mb-3">Elegi tu plan</p>
                <div className="grid grid-cols-3 gap-2">
                  {PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-left transition-all ${
                        selectedPlan === plan.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary hover:border-primary/50"
                      }`}
                    >
                      <span className="text-sm font-semibold text-foreground">{plan.label}</span>
                      <span className="text-center text-xs leading-tight text-muted-foreground">{plan.description}</span>
                    </button>
                  ))}
                </div>
                <ul className="mt-3 flex flex-col gap-1">
                  {PLANS.find((plan) => plan.id === selectedPlan)?.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check size={12} className="shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {error && <p className="text-primary text-sm text-center">{error}</p>}

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
                  "Confirmar plan"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setRegisterStep("data");
                }}
                disabled={loading}
                className="w-full rounded-lg bg-secondary px-4 py-3 font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
              >
                Volver
              </button>
            </form>
          )}

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

      <div className="fixed bottom-4 left-4 z-20 w-[min(320px,calc(100vw-2rem))]">
        {!adminOpen ? (
          <button
            type="button"
            onClick={() => {
              setAdminOpen(true);
              setAdminError(null);
            }}
            className="rounded-lg border border-border bg-card/90 px-4 py-2 text-sm font-semibold text-muted-foreground shadow-lg backdrop-blur transition-colors hover:text-foreground"
          >
            Acceso admin
          </button>
        ) : (
          <form
            onSubmit={handleAdminLogin}
            className="rounded-lg border border-border bg-card/95 p-4 shadow-2xl backdrop-blur"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">Inicio admin</h2>
              <button
                type="button"
                onClick={() => setAdminOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cerrar
              </button>
            </div>

            <label htmlFor="admin-password" className="mb-1 block text-xs text-muted-foreground">
              Contrasena
            </label>
            <input
              id="admin-password"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="mb-3 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              placeholder="Contrasena"
              disabled={adminLoading}
              required
            />

            {adminError && <p className="mb-3 text-xs text-primary">{adminError}</p>}

            <button
              type="submit"
              disabled={adminLoading}
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {adminLoading ? "Entrando..." : "Entrar como admin"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
