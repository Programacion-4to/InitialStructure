import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
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

export const Route = createFileRoute("/calificaciones")({ component: Page });

function Page() {
  const { viajes, calificaciones, pasajeros, conductores, calificar } = useStore();
  const finalizados = viajes.filter((v) => v.estado === "finalizado");
  const [viaje_id, setVid] = useState("");
  const [conductor, setC] = useState(5);
  const [pasajero, setP] = useState(5);
  const [comentario, setCom] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      calificar(viaje_id, {
        puntaje_conductor: conductor,
        puntaje_pasajero: pasajero,
        comentario,
      });
      toast.success("Calificación guardada");
      setCom("");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const nP = (id: string) => pasajeros.find((p) => p.id === id)?.nombre ?? "?";
  const nC = (id?: string) => (id ? conductores.find((c) => c.id === id)?.nombre : "—");

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Calificar viaje (HU8)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Viaje finalizado</Label>
              <Select value={viaje_id} onValueChange={setVid}>
                <SelectTrigger>
                  <SelectValue placeholder="Elegir" />
                </SelectTrigger>
                <SelectContent>
                  {finalizados.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.id.slice(0, 6)} · {nP(v.pasajero_id)} → {nC(v.conductor_id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>★ Al conductor</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={conductor}
                  onChange={(e) => setC(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>★ Al pasajero</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={pasajero}
                  onChange={(e) => setP(Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <Label>Comentario</Label>
              <Input value={comentario} onChange={(e) => setCom(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={!viaje_id}>
              Guardar
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Calificaciones ({calificaciones.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {calificaciones.map((c) => {
            const v = viajes.find((x) => x.id === c.viaje_id);
            return (
              <div key={c.id} className="rounded-md border p-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-mono text-xs">{c.viaje_id.slice(0, 6)}</span>
                  <span>
                    Conductor ★{c.puntaje_conductor ?? "—"} · Pasajero ★{c.puntaje_pasajero ?? "—"}
                  </span>
                </div>
                {v && (
                  <div className="text-xs text-muted-foreground">
                    {nP(v.pasajero_id)} → {nC(v.conductor_id)}
                  </div>
                )}
                {c.comentario && <div className="mt-1 text-muted-foreground">"{c.comentario}"</div>}
              </div>
            );
          })}
          {!calificaciones.length && (
            <div className="text-center text-sm text-muted-foreground">Sin calificaciones</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
