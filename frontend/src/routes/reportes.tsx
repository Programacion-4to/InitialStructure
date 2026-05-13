import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/reportes")({ component: Page });

function Page() {
  const { conductores, viajes, calificaciones } = useStore();
  const now = new Date();
  const [conductor_id, setC] = useState(conductores[0]?.id ?? "");
  const [anio, setA] = useState(now.getFullYear());
  const [mes, setM] = useState(now.getMonth() + 1);

  const finalizados = viajes.filter((v) => {
    if (v.conductor_id !== conductor_id || v.estado !== "finalizado" || !v.fecha_fin) return false;
    const d = new Date(v.fecha_fin);
    return d.getFullYear() === anio && d.getMonth() + 1 === mes;
  });
  const ingresos = finalizados.reduce((a, v) => a + v.tarifa, 0);
  const km = finalizados.reduce((a, v) => a + v.distancia_km, 0);
  const cals = calificaciones
    .filter((c) => finalizados.some((v) => v.id === c.viaje_id) && c.puntaje_conductor !== undefined)
    .map((c) => c.puntaje_conductor!);
  const prom = cals.length ? cals.reduce((a, b) => a + b, 0) / cals.length : 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Reporte mensual del conductor (HU14)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Conductor</Label>
              <Select value={conductor_id} onValueChange={setC}>
                <SelectTrigger>
                  <SelectValue placeholder="Elegir" />
                </SelectTrigger>
                <SelectContent>
                  {conductores.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Año</Label>
              <Input type="number" value={anio} onChange={(e) => setA(Number(e.target.value))} />
            </div>
            <div>
              <Label>Mes</Label>
              <Input type="number" min={1} max={12} value={mes} onChange={(e) => setM(Number(e.target.value))} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-5"><div className="text-2xl font-semibold">{finalizados.length}</div><div className="text-xs text-muted-foreground">Viajes finalizados</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-2xl font-semibold">${ingresos.toFixed(2)}</div><div className="text-xs text-muted-foreground">Ingresos</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-2xl font-semibold">{km.toFixed(1)} km</div><div className="text-xs text-muted-foreground">Kilómetros</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-2xl font-semibold">★ {prom.toFixed(1)}</div><div className="text-xs text-muted-foreground">Calif. del mes</div></CardContent></Card>
      </div>
    </div>
  );
}
