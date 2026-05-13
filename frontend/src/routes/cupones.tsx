import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/cupones")({ component: Page });

function Page() {
  const { cupones, addCupon } = useStore();
  const [f, setF] = useState({
    codigo: "",
    porcentaje_descuento: 10,
    fecha_vencimiento: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      addCupon({ ...f, fecha_vencimiento: new Date(f.fecha_vencimiento).toISOString() });
      setF({ ...f, codigo: "" });
      toast.success("Cupón creado");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo cupón (HU13)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Código</Label>
              <Input
                value={f.codigo}
                onChange={(e) => setF({ ...f, codigo: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div>
              <Label>Descuento %</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={f.porcentaje_descuento}
                onChange={(e) => setF({ ...f, porcentaje_descuento: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Vencimiento</Label>
              <Input
                type="date"
                value={f.fecha_vencimiento}
                onChange={(e) => setF({ ...f, fecha_vencimiento: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full">
              Crear
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Cupones</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descuento</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Usos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cupones.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono">{c.codigo}</TableCell>
                  <TableCell>{c.porcentaje_descuento}%</TableCell>
                  <TableCell>{new Date(c.fecha_vencimiento).toLocaleDateString()}</TableCell>
                  <TableCell>{c.usado_por.length}</TableCell>
                </TableRow>
              ))}
              {!cupones.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Sin cupones
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
