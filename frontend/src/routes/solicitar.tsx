import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore, type CategoriaVehiculo } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPicker } from "@/components/MapPicker";
import type { LatLng } from "@/lib/geo";

export const Route = createFileRoute("/solicitar")({ component: Page });

function Page() {
  const { pasajeros, metodosPago, tarifas, multiplicadores, solicitarViaje } = useStore();
  const nav = useNavigate();
  const [pasajero_id, setPas] = useState("");
  const [metodo_pago_id, setMP] = useState("");
  const [origen, setOrigen] = useState<LatLng | null>(null);
  const [destino, setDestino] = useState<LatLng | null>(null);
  const [origenLabel, setOrigenLabel] = useState("");
  const [destinoLabel, setDestinoLabel] = useState("");
  const [distancia_km, setKm] = useState<number | null>(null);
  const [categoria, setCat] = useState<CategoriaVehiculo>("economico");
  const [cupon, setCupon] = useState("");

  const metodos = pasajero_id ? metodosPago.filter((m) => m.pasajero_id === pasajero_id) : [];

  const preview = useMemo(() => {
    if (distancia_km == null) return null;
    const t = tarifas.find((x) => x.categoria === categoria && x.activa);
    if (!t) return null;
    const now = new Date();
    const m = multiplicadores.find(
      (x) =>
        x.dia_semana === now.getDay() &&
        now.getHours() >= x.hora_desde &&
        now.getHours() < x.hora_hasta,
    );
    const factor = m?.factor ?? 1;
    const base = (t.precio_base + t.precio_por_km * distancia_km) * factor;
    return { base, factor };
  }, [tarifas, multiplicadores, categoria, distancia_km]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (distancia_km == null) {
      toast.error("Marcá origen y destino en el mapa");
      return;
    }
    try {
      const r = solicitarViaje({
        pasajero_id,
        metodo_pago_id,
        origen: origenLabel,
        destino: destinoLabel,
        distancia_km,
        categoria,
        cupon_codigo: cupon || undefined,
      });
      if (r.warning) toast.warning(r.warning);
      else toast.success(`Viaje #${r.viaje.id.slice(0, 6)} asignado`);
      nav({ to: "/viajes" });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Solicitar viaje (HU5 / HU6 / HU11 / HU13)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pasajero</Label>
                <Select value={pasajero_id} onValueChange={(v) => { setPas(v); setMP(""); }}>
                  <SelectTrigger><SelectValue placeholder="Elegir" /></SelectTrigger>
                  <SelectContent>
                    {pasajeros.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Método de pago</Label>
                <Select value={metodo_pago_id} onValueChange={setMP} disabled={!pasajero_id}>
                  <SelectTrigger><SelectValue placeholder="Elegir" /></SelectTrigger>
                  <SelectContent>
                    {metodos.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.tipo}{m.ultimos_digitos ? ` ••${m.ultimos_digitos}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <MapPicker
              origen={origen}
              destino={destino}
              origenLabel={origenLabel}
              destinoLabel={destinoLabel}
              onOrigenChange={(p, l) => {
                setOrigen(p);
                setOrigenLabel(l);
              }}
              onDestinoChange={(p, l) => {
                setDestino(p);
                setDestinoLabel(l);
              }}
              onDistanciaChange={setKm}
            />

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Distancia (km)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={distancia_km ?? ""}
                  readOnly
                  placeholder="Marcá origen y destino"
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={categoria} onValueChange={(v) => setCat(v as CategoriaVehiculo)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economico">Económico</SelectItem>
                    <SelectItem value="confort">Confort</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cupón (opcional)</Label>
                <Input value={cupon} onChange={(e) => setCupon(e.target.value.toUpperCase())} />
              </div>
            </div>
            {preview ? (
              <div className="rounded-md border p-3 text-sm bg-muted/30">
                Tarifa estimada: <strong>${preview.base.toFixed(2)}</strong>
                {preview.factor > 1 && (
                  <span className="text-primary"> · Horario pico ×{preview.factor}</span>
                )}
              </div>
            ) : distancia_km == null ? (
              <div className="rounded-md border p-3 text-sm text-muted-foreground">
                Marcá origen y destino en el mapa para calcular la tarifa.
              </div>
            ) : (
              <div className="rounded-md border p-3 text-sm text-destructive">
                No hay tarifa activa para {categoria}. Definila en la pestaña "Tarifas".
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={!preview || !metodo_pago_id || distancia_km == null}
            >
              Pedir viaje
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
