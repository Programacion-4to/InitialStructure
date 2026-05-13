import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useStore, DIAS_SEMANA } from "@/lib/store";
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
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/multiplicadores")({ component: Page });

function Page() {
  const { multiplicadores, addMultiplicador, removeMultiplicador } = useStore();
  const [f, setF] = useState({ dia_semana: 1, hora_desde: 7, hora_hasta: 10, factor: 1.5 });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      addMultiplicador(f);
      toast.success("Franja creada");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Nueva franja (HU11)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Día</Label>
              <Select
                value={String(f.dia_semana)}
                onValueChange={(v) => setF({ ...f, dia_semana: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIAS_SEMANA.map((d, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Desde (h)</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={f.hora_desde}
                  onChange={(e) => setF({ ...f, hora_desde: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Hasta (h)</Label>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={f.hora_hasta}
                  onChange={(e) => setF({ ...f, hora_hasta: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label>Factor (&gt; 1)</Label>
              <Input
                type="number"
                step="0.1"
                value={f.factor}
                onChange={(e) => setF({ ...f, factor: Number(e.target.value) })}
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
          <CardTitle>Franjas activas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Día</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Factor</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {multiplicadores.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{DIAS_SEMANA[m.dia_semana]}</TableCell>
                  <TableCell>
                    {m.hora_desde}:00 – {m.hora_hasta}:00
                  </TableCell>
                  <TableCell>×{m.factor}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => removeMultiplicador(m.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!multiplicadores.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Sin franjas
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
