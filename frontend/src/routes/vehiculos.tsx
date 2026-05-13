import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/vehiculos")({ component: Page });

function Page() {
  const { vehiculos, conductores, addVehiculo } = useStore();
  const [f, setF] = useState<{
    conductor_id: string;
    patente: string;
    modelo: string;
    anio: number;
    categoria: CategoriaVehiculo;
  }>({ conductor_id: "", patente: "", modelo: "", anio: 2024, categoria: "economico" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.conductor_id) return toast.error("Elegí un conductor");
    try {
      addVehiculo(f);
      setF({ ...f, patente: "", modelo: "" });
      toast.success("Vehículo agregado");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const nombreConductor = (id: string) => conductores.find((c) => c.id === id)?.nombre ?? "?";

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo vehículo (HU2)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Conductor</Label>
              <Select value={f.conductor_id} onValueChange={(v) => setF({ ...f, conductor_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Elegir conductor" />
                </SelectTrigger>
                <SelectContent>
                  {conductores.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Patente</Label>
                <Input value={f.patente} onChange={(e) => setF({ ...f, patente: e.target.value })} required />
              </div>
              <div>
                <Label>Año</Label>
                <Input
                  type="number"
                  value={f.anio}
                  onChange={(e) => setF({ ...f, anio: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Modelo</Label>
              <Input value={f.modelo} onChange={(e) => setF({ ...f, modelo: e.target.value })} required />
            </div>
            <div>
              <Label>Categoría</Label>
              <Select
                value={f.categoria}
                onValueChange={(v) => setF({ ...f, categoria: v as CategoriaVehiculo })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economico">Económico</SelectItem>
                  <SelectItem value="confort">Confort</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Agregar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehículos ({vehiculos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patente</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Año</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Conductor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehiculos.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono">{v.patente}</TableCell>
                  <TableCell>{v.modelo}</TableCell>
                  <TableCell>{v.anio}</TableCell>
                  <TableCell className="capitalize">{v.categoria}</TableCell>
                  <TableCell>{nombreConductor(v.conductor_id)}</TableCell>
                </TableRow>
              ))}
              {!vehiculos.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Sin vehículos
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
