import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const nav = useNavigate();
  const { loginUser, loginAdmin, registerPasajero, registerConductor } = useAuth();
  const [tab, setTab] = useState<"user" | "admin">("user");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [regKind, setRegKind] = useState<"pasajero" | "conductor">("pasajero");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [licencia, setLicencia] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const session =
          tab === "admin" ? await loginAdmin(email, password) : await loginUser(email, password);
        toast.success(`Bienvenido (${session.role})`);
        nav({ to: "/" });
      } else {
        const session =
          regKind === "pasajero"
            ? await registerPasajero({ email, password, nombre, telefono })
            : await registerConductor({ email, password, nombre, licencia });
        toast.success(`Cuenta creada (${session.role})`);
        nav({ to: "/" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>UBER · Acceso</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "user" | "admin")}>
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="user">Usuario</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="user">
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={mode === "login" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("login")}
                >
                  Ingresar
                </Button>
                <Button
                  type="button"
                  variant={mode === "register" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("register")}
                >
                  Crear cuenta
                </Button>
              </div>

              {mode === "register" && (
                <div className="flex gap-2 mb-4 text-sm">
                  <Button
                    type="button"
                    variant={regKind === "pasajero" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRegKind("pasajero")}
                  >
                    Pasajero
                  </Button>
                  <Button
                    type="button"
                    variant={regKind === "conductor" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRegKind("conductor")}
                  >
                    Conductor
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="admin">
              <p className="text-sm text-muted-foreground mb-3">
                Solo cuentas con rol <strong>admin</strong> pueden ingresar acá.
              </p>
            </TabsContent>
          </Tabs>

          <form onSubmit={submit} className="space-y-3 mt-2">
            {mode === "register" && tab === "user" && (
              <>
                <div>
                  <Label>Nombre</Label>
                  <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                </div>
                {regKind === "pasajero" ? (
                  <div>
                    <Label>Teléfono</Label>
                    <Input
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <Label>Licencia</Label>
                    <Input
                      value={licencia}
                      onChange={(e) => setLicencia(e.target.value)}
                      required
                    />
                  </div>
                )}
              </>
            )}
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "..."
                : mode === "login"
                  ? tab === "admin"
                    ? "Ingresar como admin"
                    : "Ingresar"
                  : `Crear cuenta de ${regKind}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
