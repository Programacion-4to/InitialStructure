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

export const Route = createFileRoute("/pasajeros")({ component: Page });

function Page() {
  const { pasajeros, addPasajero } = useStore();
  const [f, setF] = useState({ nombre: "", email: "", telefono: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      addPasajero(f);
      setF({ nombre: "", email: "", telefono: "" });
      toast.success("Pasajero creado");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo pasajero (HU1)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Nombre</Label>
              <Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required />
            </div>
            <div>
              <Label>Email (único)</Label>
              <Input
                type="email"
                value={f.email}
                onChange={(e) => setF({ ...f, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} required />
            </div>
            <Button type="submit" className="w-full">
              Crear
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pasajeros ({pasajeros.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pasajeros.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.nombre}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>{p.telefono}</TableCell>
                </TableRow>
              ))}
              {!pasajeros.length && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Sin pasajeros
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
