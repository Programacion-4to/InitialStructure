import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/historial")({ component: Page });

function Page() {
  const { pasajeros, viajes, conductores, cargos } = useStore();
  const [pid, setPid] = useState(pasajeros[0]?.id ?? "");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const list = viajes
    .filter((v) => v.pasajero_id === pid)
    .filter((v) => {
      if (desde && v.fecha_solicitud < new Date(desde).toISOString()) return false;
      if (hasta && v.fecha_solicitud > new Date(hasta + "T23:59:59").toISOString()) return false;
      return true;
    })
    .sort((a, b) => b.fecha_solicitud.localeCompare(a.fecha_solicitud));

  const totalGastado = list
    .filter((v) => v.estado === "finalizado")
    .reduce((a, v) => a + v.tarifa, 0);
  const cargosPas = cargos.filter((c) => list.some((v) => v.id === c.viaje_id));
  const totalCargos = cargosPas.reduce((a, c) => a + c.monto, 0);
  const nC = (id?: string) => (id ? conductores.find((c) => c.id === id)?.nombre : "—");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Historial del pasajero (HU9 / HU12)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Pasajero</Label>
              <Select value={pid} onValueChange={setPid}>
                <SelectTrigger><SelectValue placeholder="Elegir" /></SelectTrigger>
                <SelectContent>
                  {pasajeros.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Desde</Label>
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div>
              <Label>Hasta</Label>
              <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-5"><div className="text-2xl font-semibold">{list.length}</div><div className="text-xs text-muted-foreground">Viajes</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-2xl font-semibold">${totalGastado.toFixed(2)}</div><div className="text-xs text-muted-foreground">Total gastado</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-2xl font-semibold text-destructive">${totalCargos.toFixed(2)}</div><div className="text-xs text-muted-foreground">Cargos por penalidad</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Detalle</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Conductor</TableHead>
                <TableHead>Trayecto</TableHead>
                <TableHead>Tarifa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Penalidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="text-xs">{new Date(v.fecha_solicitud).toLocaleString()}</TableCell>
                  <TableCell>{nC(v.conductor_id)}</TableCell>
                  <TableCell className="text-xs">{v.origen} → {v.destino}</TableCell>
                  <TableCell>${v.tarifa.toFixed(2)}</TableCell>
                  <TableCell><Badge variant="secondary">{v.estado}</Badge></TableCell>
                  <TableCell>
                    {v.penalidad_cancelacion ? `$${v.penalidad_cancelacion}` : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {!list.length && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sin viajes</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
