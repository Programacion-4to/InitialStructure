import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useStore, type TipoPago } from "@/lib/store";
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

export const Route = createFileRoute("/metodos-pago")({ component: Page });

const TIPOS: { value: TipoPago; label: string }[] = [
  { value: "tarjeta_credito", label: "Tarjeta de crédito" },
  { value: "tarjeta_debito", label: "Tarjeta de débito" },
  { value: "efectivo", label: "Efectivo" },
  { value: "billetera_virtual", label: "Billetera virtual" },
];

function Page() {
  const { pasajeros, metodosPago, addMetodoPago } = useStore();
  const [pasajero_id, setP] = useState("");
  const [tipo, setTipo] = useState<TipoPago>("tarjeta_credito");
  const [num, setNum] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasajero_id) return toast.error("Elegí pasajero");
    try {
      addMetodoPago({ pasajero_id, tipo, ultimos_digitos: num });
      setNum("");
      toast.success("Método agregado");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const list = pasajero_id ? metodosPago.filter((m) => m.pasajero_id === pasajero_id) : metodosPago;
  const nombrePas = (id: string) => pasajeros.find((p) => p.id === id)?.nombre ?? "?";

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo método de pago (HU3)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Pasajero</Label>
              <Select value={pasajero_id} onValueChange={setP}>
                <SelectTrigger>
                  <SelectValue placeholder="Elegir" />
                </SelectTrigger>
                <SelectContent>
                  {pasajeros.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoPago)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {tipo.startsWith("tarjeta") && (
              <div>
                <Label>Número (solo se guardan últimos 4)</Label>
                <Input value={num} onChange={(e) => setNum(e.target.value)} placeholder="•••• •••• •••• 1234" />
              </div>
            )}
            <Button type="submit" className="w-full">
              Agregar
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Métodos {pasajero_id ? `de ${nombrePas(pasajero_id)}` : `(${list.length})`}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pasajero</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Últimos 4</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{nombrePas(m.pasajero_id)}</TableCell>
                  <TableCell>{TIPOS.find((t) => t.value === m.tipo)?.label}</TableCell>
                  <TableCell className="font-mono">{m.ultimos_digitos ?? "—"}</TableCell>
                </TableRow>
              ))}
              {!list.length && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Sin métodos
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
