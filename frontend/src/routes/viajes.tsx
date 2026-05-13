import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useStore, type EstadoViaje } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/viajes")({ component: Page });

const estadoColor: Record<EstadoViaje, string> = {
  pendiente: "bg-muted text-foreground",
  asignado: "bg-blue-500/20 text-blue-300",
  en_curso: "bg-amber-500/20 text-amber-300",
  finalizado: "bg-primary text-primary-foreground",
  cancelado: "bg-destructive/30 text-destructive-foreground",
  sin_conductor: "bg-orange-500/20 text-orange-300",
};

function Page() {
  const { viajes, pasajeros, conductores, iniciarViaje, finalizarViaje, cancelarViaje } = useStore();
  const sorted = [...viajes].sort((a, b) => b.fecha_solicitud.localeCompare(a.fecha_solicitud));
  const nP = (id: string) => pasajeros.find((p) => p.id === id)?.nombre ?? "?";
  const nC = (id?: string) => (id ? conductores.find((c) => c.id === id)?.nombre : "—");

  const wrap = (fn: () => void) => {
    try { fn(); toast.success("Estado actualizado"); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Viajes ({viajes.length}) — HU7</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Pasajero</TableHead>
              <TableHead>Conductor</TableHead>
              <TableHead>Trayecto</TableHead>
              <TableHead>Km</TableHead>
              <TableHead>Tarifa</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono text-xs">{v.id.slice(0, 6)}</TableCell>
                <TableCell>{nP(v.pasajero_id)}</TableCell>
                <TableCell>{nC(v.conductor_id)}</TableCell>
                <TableCell className="text-xs">
                  {v.origen} → {v.destino}
                </TableCell>
                <TableCell>{v.distancia_km}</TableCell>
                <TableCell>
                  ${v.tarifa.toFixed(2)}
                  {v.multiplicador_aplicado && v.multiplicador_aplicado > 1 && (
                    <span className="text-xs text-primary ml-1">×{v.multiplicador_aplicado}</span>
                  )}
                  {v.descuento_aplicado && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (-${v.descuento_aplicado})
                    </span>
                  )}
                  {v.penalidad_cancelacion && (
                    <div className="text-xs text-destructive">+ ${v.penalidad_cancelacion} penalidad</div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={estadoColor[v.estado]}>{v.estado}</Badge>
                </TableCell>
                <TableCell className="space-x-1">
                  {v.estado === "asignado" && (
                    <Button size="sm" onClick={() => wrap(() => iniciarViaje(v.id))}>
                      Iniciar
                    </Button>
                  )}
                  {v.estado === "en_curso" && (
                    <Button size="sm" onClick={() => wrap(() => finalizarViaje(v.id))}>
                      Finalizar
                    </Button>
                  )}
                  {(v.estado === "pendiente" || v.estado === "asignado") && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => wrap(() => cancelarViaje(v.id, "pasajero"))}
                    >
                      Cancelar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!viajes.length && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Sin viajes aún
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
