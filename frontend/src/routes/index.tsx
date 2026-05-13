import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, IdCard, Car, ListOrdered, DollarSign, Star } from "lucide-react";

export const Route = createFileRoute("/")({ component: Dashboard });

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const s = useStore();
  const finalizados = s.viajes.filter((v) => v.estado === "finalizado");
  const ingresos = finalizados.reduce((acc, v) => acc + v.tarifa, 0);
  const promedio =
    s.conductores.reduce((a, c) => a + c.calificacion_promedio, 0) /
    (s.conductores.length || 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel UBER</h1>
        <p className="text-sm text-muted-foreground">
          Mock de la app de viajes — todas las HU funcionando en memoria del navegador.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Stat label="Pasajeros" value={s.pasajeros.length} icon={Users} />
        <Stat label="Conductores" value={s.conductores.length} icon={IdCard} />
        <Stat label="Vehículos" value={s.vehiculos.length} icon={Car} />
        <Stat label="Viajes" value={s.viajes.length} icon={ListOrdered} />
        <Stat label="Ingresos" value={`$${ingresos.toFixed(0)}`} icon={DollarSign} />
        <Stat label="★ Prom." value={promedio.toFixed(1)} icon={Star} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cómo usarlo</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Cargá pasajeros, conductores y vehículos.</p>
          <p>2. Definí tarifas por categoría (HU4) y opcionalmente multiplicadores y cupones.</p>
          <p>
            3. Como pasajero, agregá un método de pago y solicitá un viaje. El sistema asigna un
            conductor disponible automáticamente.
          </p>
          <p>4. En "Viajes" avanzás el estado: iniciar, finalizar o cancelar.</p>
          <p>5. Calificá al finalizar y mirá el ranking y los reportes mensuales.</p>
        </CardContent>
      </Card>
    </div>
  );
}
