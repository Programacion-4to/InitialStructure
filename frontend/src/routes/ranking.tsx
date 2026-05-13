import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/ranking")({ component: Page });

function Page() {
  const { conductores, viajes } = useStore();
  const ranking = conductores
    .map((c) => {
      const fin = viajes.filter((v) => v.conductor_id === c.id && v.estado === "finalizado");
      return { ...c, viajes_finalizados: fin.length };
    })
    .filter((c) => c.viajes_finalizados >= 5)
    .sort((a, b) => b.calificacion_promedio - a.calificacion_promedio)
    .slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" /> Top conductores (HU10)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Solo cuentan conductores con al menos 5 viajes finalizados.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Conductor</TableHead>
              <TableHead>★ Promedio</TableHead>
              <TableHead>Viajes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranking.map((c, i) => (
              <TableRow key={c.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{c.nombre}</TableCell>
                <TableCell>{c.calificacion_promedio.toFixed(1)}</TableCell>
                <TableCell>{c.viajes_finalizados}</TableCell>
              </TableRow>
            ))}
            {!ranking.length && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Aún no hay conductores con 5+ viajes finalizados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
