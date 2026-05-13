from datetime import datetime

from pydantic import BaseModel


class CreateViajeDTO(BaseModel):
    pasajero_id: int
    metodo_pago_id: int
    categoria: str
    origen: str
    destino: str
    distancia_km: float
    cupon_codigo: str | None = None


class CargoResponseDTO(BaseModel):
    id: int
    monto: float
    motivo: str

    model_config = {"from_attributes": True}


class ViajeResponseDTO(BaseModel):
    id: int
    pasajero_id: int
    conductor_id: int | None
    vehiculo_id: int | None
    metodo_pago_id: int
    cupon_id: int | None
    categoria: str
    origen: str
    destino: str
    distancia_km: float
    fecha_solicitud: datetime | None
    fecha_inicio: datetime | None
    fecha_fin: datetime | None
    estado: str
    tarifa_final: float
    multiplicador_aplicado: float
    cargos: list[CargoResponseDTO] = []

    model_config = {"from_attributes": True}


class HistorialResponseDTO(BaseModel):
    viajes: list[ViajeResponseDTO]
    total_gastado: float


class CalificacionDTO(BaseModel):
    puntaje_pasajero: int | None = None
    puntaje_conductor: int | None = None
    comentario: str | None = None


class CalificacionResponseDTO(BaseModel):
    id: int
    viaje_id: int
    puntaje_pasajero: int | None
    puntaje_conductor: int | None
    comentario: str | None

    model_config = {"from_attributes": True}


class ReporteMensualDTO(BaseModel):
    anio: int
    mes: int
    cantidad_viajes: int
    ingresos_totales: float
    kilometros_recorridos: float
    calificacion_promedio: float


class ConductorTopDTO(BaseModel):
    id: int
    nombre: str
    calificacion_promedio: float
    cantidad_viajes: int
