import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CategoriaVehiculo = "economico" | "confort" | "premium";
export type TipoPago = "tarjeta_credito" | "tarjeta_debito" | "efectivo" | "billetera_virtual";
export type EstadoViaje =
  | "pendiente"
  | "asignado"
  | "en_curso"
  | "finalizado"
  | "cancelado"
  | "sin_conductor";

export interface Pasajero {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
}
export interface Conductor {
  id: string;
  nombre: string;
  licencia: string;
  calificacion_promedio: number;
  disponible: boolean;
}
export interface Vehiculo {
  id: string;
  conductor_id: string;
  patente: string;
  modelo: string;
  anio: number;
  categoria: CategoriaVehiculo;
}
export interface MetodoPago {
  id: string;
  pasajero_id: string;
  tipo: TipoPago;
  ultimos_digitos?: string;
}
export interface Tarifa {
  id: string;
  categoria: CategoriaVehiculo;
  precio_base: number;
  precio_por_km: number;
  activa: boolean;
}
export interface MultiplicadorHorario {
  id: string;
  dia_semana: number; // 0=Dom..6=Sab
  hora_desde: number; // 0..23
  hora_hasta: number; // 1..24
  factor: number;
}
export interface Cupon {
  id: string;
  codigo: string;
  porcentaje_descuento: number;
  fecha_vencimiento: string; // ISO
  usado_por: string[]; // pasajero ids
}
export interface Cargo {
  id: string;
  viaje_id: string;
  motivo: string;
  monto: number;
}
export interface Calificacion {
  id: string;
  viaje_id: string;
  puntaje_pasajero?: number; // del conductor al pasajero
  puntaje_conductor?: number; // del pasajero al conductor
  comentario?: string;
}
export interface Viaje {
  id: string;
  pasajero_id: string;
  conductor_id?: string;
  vehiculo_id?: string;
  metodo_pago_id: string;
  origen: string;
  destino: string;
  distancia_km: number;
  categoria: CategoriaVehiculo;
  fecha_solicitud: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado: EstadoViaje;
  tarifa: number;
  multiplicador_aplicado?: number;
  cupon_id?: string;
  descuento_aplicado?: number;
  penalidad_cancelacion?: number;
}

const PENALIDAD_CANCELACION = 500;

const uid = () => Math.random().toString(36).slice(2, 10);

interface State {
  pasajeros: Pasajero[];
  conductores: Conductor[];
  vehiculos: Vehiculo[];
  metodosPago: MetodoPago[];
  tarifas: Tarifa[];
  multiplicadores: MultiplicadorHorario[];
  cupones: Cupon[];
  viajes: Viaje[];
  calificaciones: Calificacion[];
  cargos: Cargo[];

  // HU1
  addPasajero: (p: Omit<Pasajero, "id">) => string;
  addConductor: (c: Omit<Conductor, "id" | "calificacion_promedio" | "disponible">) => string;
  // HU2
  addVehiculo: (v: Omit<Vehiculo, "id">) => string;
  // HU3
  addMetodoPago: (m: Omit<MetodoPago, "id">) => string;
  // HU4
  upsertTarifa: (t: Omit<Tarifa, "id" | "activa">) => string;
  // HU11
  addMultiplicador: (m: Omit<MultiplicadorHorario, "id">) => string;
  removeMultiplicador: (id: string) => void;
  // HU13
  addCupon: (c: Omit<Cupon, "id" | "usado_por">) => string;
  // HU5/6/11/13
  solicitarViaje: (input: {
    pasajero_id: string;
    metodo_pago_id: string;
    origen: string;
    destino: string;
    distancia_km: number;
    categoria: CategoriaVehiculo;
    cupon_codigo?: string;
  }) => { viaje: Viaje; warning?: string };
  // HU7
  iniciarViaje: (id: string) => void;
  finalizarViaje: (id: string) => void;
  cancelarViaje: (id: string, por: "pasajero" | "conductor") => void;
  // HU8
  calificar: (
    viaje_id: string,
    data: { puntaje_conductor?: number; puntaje_pasajero?: number; comentario?: string },
  ) => void;
}

function calcularMultiplicador(state: State, fecha: Date): number {
  const dia = fecha.getDay();
  const hora = fecha.getHours();
  const m = state.multiplicadores.find(
    (x) => x.dia_semana === dia && hora >= x.hora_desde && hora < x.hora_hasta,
  );
  return m ? m.factor : 1;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      pasajeros: [],
      conductores: [],
      vehiculos: [],
      metodosPago: [],
      tarifas: [],
      multiplicadores: [],
      cupones: [],
      viajes: [],
      calificaciones: [],
      cargos: [],

      addPasajero: (p) => {
        if (get().pasajeros.some((x) => x.email === p.email))
          throw new Error("Email ya registrado");
        const id = uid();
        set((s) => ({ pasajeros: [...s.pasajeros, { ...p, id }] }));
        return id;
      },
      addConductor: (c) => {
        if (get().conductores.some((x) => x.licencia === c.licencia))
          throw new Error("Licencia ya registrada");
        const id = uid();
        set((s) => ({
          conductores: [
            ...s.conductores,
            { ...c, id, calificacion_promedio: 0, disponible: true },
          ],
        }));
        return id;
      },
      addVehiculo: (v) => {
        if (get().vehiculos.some((x) => x.patente === v.patente))
          throw new Error("Patente ya registrada");
        const id = uid();
        set((s) => ({ vehiculos: [...s.vehiculos, { ...v, id }] }));
        return id;
      },
      addMetodoPago: (m) => {
        const ud = m.tipo.startsWith("tarjeta") ? (m.ultimos_digitos ?? "").slice(-4) : undefined;
        const id = uid();
        set((s) => ({
          metodosPago: [...s.metodosPago, { ...m, ultimos_digitos: ud, id }],
        }));
        return id;
      },
      upsertTarifa: (t) => {
        if (t.precio_base <= 0 || t.precio_por_km <= 0)
          throw new Error("Precios deben ser > 0");
        const id = uid();
        set((s) => ({
          tarifas: [
            ...s.tarifas.map((x) => (x.categoria === t.categoria ? { ...x, activa: false } : x)),
            { ...t, id, activa: true },
          ],
        }));
        return id;
      },
      addMultiplicador: (m) => {
        if (m.factor <= 1) throw new Error("Factor debe ser > 1");
        if (m.hora_desde >= m.hora_hasta) throw new Error("Rango horario inválido");
        const overlap = get().multiplicadores.some(
          (x) =>
            x.dia_semana === m.dia_semana &&
            !(m.hora_hasta <= x.hora_desde || m.hora_desde >= x.hora_hasta),
        );
        if (overlap) throw new Error("Franja superpuesta para ese día");
        const id = uid();
        set((s) => ({ multiplicadores: [...s.multiplicadores, { ...m, id }] }));
        return id;
      },
      removeMultiplicador: (id) =>
        set((s) => ({ multiplicadores: s.multiplicadores.filter((x) => x.id !== id) })),
      addCupon: (c) => {
        if (c.porcentaje_descuento < 1 || c.porcentaje_descuento > 100)
          throw new Error("Porcentaje 1-100");
        if (get().cupones.some((x) => x.codigo === c.codigo))
          throw new Error("Código ya existe");
        const id = uid();
        set((s) => ({ cupones: [...s.cupones, { ...c, id, usado_por: [] }] }));
        return id;
      },

      solicitarViaje: (input) => {
        const state = get();
        const mp = state.metodosPago.find(
          (x) => x.id === input.metodo_pago_id && x.pasajero_id === input.pasajero_id,
        );
        if (!mp) throw new Error("Método de pago inválido");
        const tarifa = state.tarifas.find((t) => t.categoria === input.categoria && t.activa);
        if (!tarifa) throw new Error(`No hay tarifa activa para ${input.categoria}`);

        const fecha = new Date();
        const factor = calcularMultiplicador(state, fecha);
        let total = (tarifa.precio_base + tarifa.precio_por_km * input.distancia_km) * factor;

        let cupon: Cupon | undefined;
        let descuento = 0;
        if (input.cupon_codigo) {
          cupon = state.cupones.find((x) => x.codigo === input.cupon_codigo);
          if (!cupon) throw new Error("Cupón inexistente");
          if (new Date(cupon.fecha_vencimiento) < fecha) throw new Error("Cupón vencido");
          if (cupon.usado_por.includes(input.pasajero_id))
            throw new Error("Ya usaste ese cupón");
          descuento = (total * cupon.porcentaje_descuento) / 100;
          total -= descuento;
        }

        // HU6: intentar asignar
        const candidatos = state.conductores.filter(
          (c) =>
            c.disponible &&
            state.vehiculos.some((v) => v.conductor_id === c.id && v.categoria === input.categoria),
        );
        const elegido = candidatos[0];
        const vehiculoElegido =
          elegido &&
          state.vehiculos.find(
            (v) => v.conductor_id === elegido.id && v.categoria === input.categoria,
          );

        const viaje: Viaje = {
          id: uid(),
          pasajero_id: input.pasajero_id,
          metodo_pago_id: input.metodo_pago_id,
          origen: input.origen,
          destino: input.destino,
          distancia_km: input.distancia_km,
          categoria: input.categoria,
          fecha_solicitud: fecha.toISOString(),
          tarifa: Math.round(total * 100) / 100,
          multiplicador_aplicado: factor,
          cupon_id: cupon?.id,
          descuento_aplicado: descuento ? Math.round(descuento * 100) / 100 : undefined,
          estado: elegido ? "asignado" : "sin_conductor",
          conductor_id: elegido?.id,
          vehiculo_id: vehiculoElegido?.id,
        };

        set((s) => ({
          viajes: [...s.viajes, viaje],
          conductores: elegido
            ? s.conductores.map((c) => (c.id === elegido.id ? { ...c, disponible: false } : c))
            : s.conductores,
          cupones: cupon
            ? s.cupones.map((x) =>
                x.id === cupon!.id ? { ...x, usado_por: [...x.usado_por, input.pasajero_id] } : x,
              )
            : s.cupones,
        }));

        return {
          viaje,
          warning: elegido ? undefined : "No hay conductor disponible (estado: sin_conductor)",
        };
      },

      iniciarViaje: (id) => {
        const v = get().viajes.find((x) => x.id === id);
        if (!v) throw new Error("Viaje no encontrado");
        if (v.estado !== "asignado") throw new Error("Solo se inicia desde 'asignado'");
        set((s) => ({
          viajes: s.viajes.map((x) =>
            x.id === id
              ? { ...x, estado: "en_curso", fecha_inicio: new Date().toISOString() }
              : x,
          ),
        }));
      },
      finalizarViaje: (id) => {
        const v = get().viajes.find((x) => x.id === id);
        if (!v) throw new Error("Viaje no encontrado");
        if (v.estado !== "en_curso") throw new Error("Solo se finaliza desde 'en_curso'");
        set((s) => ({
          viajes: s.viajes.map((x) =>
            x.id === id
              ? { ...x, estado: "finalizado", fecha_fin: new Date().toISOString() }
              : x,
          ),
          conductores: s.conductores.map((c) =>
            c.id === v.conductor_id ? { ...c, disponible: true } : c,
          ),
        }));
      },
      cancelarViaje: (id, por) => {
        const v = get().viajes.find((x) => x.id === id);
        if (!v) throw new Error("Viaje no encontrado");
        if (!["pendiente", "asignado"].includes(v.estado))
          throw new Error("Solo se cancela en 'pendiente' o 'asignado'");
        const aplicarPenalidad = por === "pasajero" && v.estado === "asignado";
        set((s) => ({
          viajes: s.viajes.map((x) =>
            x.id === id
              ? {
                  ...x,
                  estado: "cancelado",
                  penalidad_cancelacion: aplicarPenalidad ? PENALIDAD_CANCELACION : undefined,
                }
              : x,
          ),
          conductores: v.conductor_id
            ? s.conductores.map((c) => (c.id === v.conductor_id ? { ...c, disponible: true } : c))
            : s.conductores,
          cargos: aplicarPenalidad
            ? [
                ...s.cargos,
                {
                  id: uid(),
                  viaje_id: id,
                  motivo: "Penalidad por cancelación tardía",
                  monto: PENALIDAD_CANCELACION,
                },
              ]
            : s.cargos,
        }));
      },
      calificar: (viaje_id, data) => {
        const v = get().viajes.find((x) => x.id === viaje_id);
        if (!v) throw new Error("Viaje no encontrado");
        if (v.estado !== "finalizado") throw new Error("Solo se califica un viaje finalizado");
        for (const p of [data.puntaje_conductor, data.puntaje_pasajero]) {
          if (p !== undefined && (p < 1 || p > 5)) throw new Error("Puntaje 1-5");
        }
        const existing = get().calificaciones.find((c) => c.viaje_id === viaje_id);
        const nueva: Calificacion = existing
          ? { ...existing, ...data }
          : { id: uid(), viaje_id, ...data };
        set((s) => ({
          calificaciones: existing
            ? s.calificaciones.map((c) => (c.viaje_id === viaje_id ? nueva : c))
            : [...s.calificaciones, nueva],
        }));
        // recalcular promedio del conductor
        if (data.puntaje_conductor !== undefined && v.conductor_id) {
          const all = get().calificaciones.filter((c) => c.puntaje_conductor !== undefined);
          const ofConductor = all.filter((c) => {
            const vv = get().viajes.find((x) => x.id === c.viaje_id);
            return vv?.conductor_id === v.conductor_id;
          });
          const prom =
            ofConductor.reduce((acc, c) => acc + (c.puntaje_conductor ?? 0), 0) /
            (ofConductor.length || 1);
          set((s) => ({
            conductores: s.conductores.map((c) =>
              c.id === v.conductor_id ? { ...c, calificacion_promedio: Math.round(prom * 10) / 10 } : c,
            ),
          }));
        }
      },
    }),
    { name: "uber-mock-store" },
  ),
);

export const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const PENALIDAD = PENALIDAD_CANCELACION;
