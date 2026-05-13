import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useStore, type CategoriaVehiculo } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export const Route = createFileRoute("/tarifas")({ component: Page });

function Page() {
  const { tarifas, upsertTarifa } = useStore();
  const [f, setF] = useState<{
    categoria: CategoriaVehiculo;
    precio_base: number;
    precio_por_km: number;
  }>({ categoria: "economico", precio_base: 500, precio_por_km: 200 });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      upsertTarifa(f);
      toast.success("Tarifa actualizada");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Definir tarifa (HU4)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
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
            <div>
              <Label>Precio base</Label>
              <Input
                type="number"
                value={f.precio_base}
                onChange={(e) => setF({ ...f, precio_base: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Precio por km</Label>
              <Input
                type="number"
                value={f.precio_por_km}
                onChange={(e) => setF({ ...f, precio_por_km: Number(e.target.value) })}
              />
            </div>
            <Button type="submit" className="w-full">
              Guardar (reemplaza la activa)
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tarifas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead>Base</TableHead>
                <TableHead>Por km</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tarifas.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="capitalize">{t.categoria}</TableCell>
                  <TableCell>${t.precio_base}</TableCell>
                  <TableCell>${t.precio_por_km}</TableCell>
                  <TableCell>
                    {t.activa ? (
                      <Badge className="bg-primary text-primary-foreground">Activa</Badge>
                    ) : (
                      <Badge variant="secondary">Histórica</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!tarifas.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Sin tarifas
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
