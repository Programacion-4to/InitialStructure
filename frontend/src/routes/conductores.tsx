import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/conductores")({ component: Page });

function Page() {
  const { conductores, addConductor } = useStore();
  const [f, setF] = useState({ nombre: "", licencia: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      addConductor(f);
      setF({ nombre: "", licencia: "" });
      toast.success("Conductor creado");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo conductor (HU1)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Nombre</Label>
              <Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required />
            </div>
            <div>
              <Label>Licencia (única)</Label>
              <Input value={f.licencia} onChange={(e) => setF({ ...f, licencia: e.target.value })} required />
            </div>
            <Button type="submit" className="w-full">
              Crear
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Conductores ({conductores.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Licencia</TableHead>
                <TableHead>★ Prom</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conductores.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.nombre}</TableCell>
                  <TableCell>{c.licencia}</TableCell>
                  <TableCell>{c.calificacion_promedio.toFixed(1)}</TableCell>
                  <TableCell>
                    {c.disponible ? (
                      <Badge className="bg-primary text-primary-foreground">Disponible</Badge>
                    ) : (
                      <Badge variant="secondary">Ocupado</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!conductores.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Sin conductores
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
