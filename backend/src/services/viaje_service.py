from datetime import datetime, date
from typing import Optional

from sqlalchemy.orm import Session

from src.db.models.conductores_model import Conductores
from src.db.models.vehiculo_model import Vehiculo
from src.db.models.viaje_model import Viaje
from src.dtos.viaje_dto import (
    CalificacionDTO,
    CalificacionResponseDTO,
    CargoResponseDTO,
    ConductorTopDTO,
    CreateViajeDTO,
    HistorialResponseDTO,
    ReporteMensualDTO,
    ViajeResponseDTO,
)
from src.repositories.calificacion_repository import CalificacionRepository
from src.repositories.conductores_repository import ConductoresRepository
from src.repositories.cupon_repository import CuponRepository
from src.repositories.metodo_pago_repository import MetodoPagoRepository
from src.repositories.multiplicador_horario_repository import MultiplicadorHorarioRepository
from src.repositories.tarifa_repository import TarifaRepository
from src.repositories.vehiculo_repository import VehiculoRepository
from src.repositories.viaje_repository import ViajeRepository
from src.utils.errors import AppError, ConflictError, NotFoundError


PENALIDAD_CANCELACION = 500.0


class ViajeService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ViajeRepository(db)
        self.tarifa_repo = TarifaRepository(db)
        self.metodo_repo = MetodoPagoRepository(db)
        self.cupon_repo = CuponRepository(db)
        self.mult_repo = MultiplicadorHorarioRepository(db)
        self.conductor_repo = ConductoresRepository(db)
        self.vehiculo_repo = VehiculoRepository(db)
        self.calif_repo = CalificacionRepository(db)

    def _to_response(self, v: Viaje) -> ViajeResponseDTO:
        cargos = [
            CargoResponseDTO(id=c.id, monto=float(c.monto), motivo=c.motivo)
            for c in self.repo.cargos_por_viaje(v.id)
        ]
        return ViajeResponseDTO(
            id=v.id,
            pasajero_id=v.pasajero_id,
            conductor_id=v.conductor_id,
            vehiculo_id=v.vehiculo_id,
            metodo_pago_id=v.metodo_pago_id,
            cupon_id=v.cupon_id,
            categoria=v.categoria,
            origen=v.origen,
            destino=v.destino,
            distancia_km=float(v.distancia_km),
            fecha_solicitud=v.fecha_solicitud,
            fecha_inicio=v.fecha_inicio,
            fecha_fin=v.fecha_fin,
            estado=v.estado,
            tarifa_final=float(v.tarifa_final),
            multiplicador_aplicado=float(v.multiplicador_aplicado),
            cargos=cargos,
        )

    def create(self, dto: CreateViajeDTO) -> ViajeResponseDTO:
        metodo = self.metodo_repo.get_by_id(dto.metodo_pago_id)
        if metodo is None or metodo.pasajero_id != dto.pasajero_id:
            raise ConflictError("Método de pago inválido para el pasajero")

        tarifa = self.tarifa_repo.get_by_categoria(dto.categoria)
        if tarifa is None:
            raise NotFoundError("No hay tarifa para la categoría")

        ahora = datetime.now()
        base = float(tarifa.precio_base) + float(tarifa.precio_por_km) * dto.distancia_km

        # HU11: multiplicador horario
        dia_semana = (ahora.weekday() + 1) % 7  # python: lunes=0; sql: domingo=0
        mult = self.mult_repo.find_active(dia_semana, ahora.time())
        factor = float(mult.factor) if mult else 1.0
        precio = base * factor

        # HU13: cupón
        cupon_id = None
        if dto.cupon_codigo:
            cupon = self.cupon_repo.get_by_codigo(dto.cupon_codigo)
            if cupon is None:
                raise NotFoundError("Cupón inexistente")
            if cupon.fecha_vencimiento < date.today():
                raise ConflictError("Cupón vencido")
            if self.cupon_repo.usado_por(dto.pasajero_id, cupon.id):
                raise ConflictError("El cupón ya fue usado por este pasajero")
            precio = precio * (1 - cupon.porcentaje_descuento / 100.0)
            cupon_id = cupon.id
            self.cupon_repo.marcar_usado(dto.pasajero_id, cupon.id)

        v = self.repo.create(
            pasajero_id=dto.pasajero_id,
            metodo_pago_id=dto.metodo_pago_id,
            cupon_id=cupon_id,
            categoria=dto.categoria,
            origen=dto.origen,
            destino=dto.destino,
            distancia_km=dto.distancia_km,
            estado="pendiente",
            tarifa_final=round(precio, 2),
            multiplicador_aplicado=factor,
        )
        return self._to_response(v)

    def get(self, viaje_id: int) -> ViajeResponseDTO:
        v = self.repo.get_by_id(viaje_id)
        if v is None:
            raise NotFoundError("Viaje no encontrado")
        return self._to_response(v)

    # HU6
    def asignar(self, viaje_id: int) -> ViajeResponseDTO:
        v = self.repo.get_by_id(viaje_id)
        if v is None:
            raise NotFoundError("Viaje no encontrado")
        if v.estado != "pendiente":
            raise ConflictError("Solo se asignan viajes en estado pendiente")

        conductores_disponibles = (
            self.db.query(Conductores).filter(Conductores.disponible == True).all()  # noqa: E712
        )
        for c in conductores_disponibles:
            veh = self.vehiculo_repo.find_available_for_conductor(c.id, v.categoria)
            if veh:
                v.conductor_id = c.id
                v.vehiculo_id = veh.id
                v.estado = "asignado"
                c.disponible = False
                self.conductor_repo.update(c)
                self.repo.save(v)
                return self._to_response(v)

        v.estado = "sin_conductor"
        self.repo.save(v)
        return self._to_response(v)

    # HU7
    def iniciar(self, viaje_id: int) -> ViajeResponseDTO:
        v = self.repo.get_by_id(viaje_id)
        if v is None:
            raise NotFoundError("Viaje no encontrado")
        if v.estado != "asignado":
            raise ConflictError("Solo se inicia un viaje en estado asignado")
        v.estado = "en_curso"
        v.fecha_inicio = datetime.now()
        self.repo.save(v)
        return self._to_response(v)

    def finalizar(self, viaje_id: int) -> ViajeResponseDTO:
        v = self.repo.get_by_id(viaje_id)
        if v is None:
            raise NotFoundError("Viaje no encontrado")
        if v.estado != "en_curso":
            raise ConflictError("Solo se finaliza un viaje en curso")
        v.estado = "finalizado"
        v.fecha_fin = datetime.now()
        if v.conductor_id:
            c = self.conductor_repo.get_by_id(v.conductor_id)
            if c:
                c.disponible = True
                self.conductor_repo.update(c)
        self.repo.save(v)
        return self._to_response(v)

    # HU7 + HU12
    def cancelar(self, viaje_id: int) -> ViajeResponseDTO:
        v = self.repo.get_by_id(viaje_id)
        if v is None:
            raise NotFoundError("Viaje no encontrado")
        if v.estado not in ("pendiente", "asignado"):
            raise ConflictError("Solo se cancelan viajes pendientes o asignados")

        aplicar_penalidad = v.estado == "asignado"
        v.estado = "cancelado"

        if v.conductor_id:
            c = self.conductor_repo.get_by_id(v.conductor_id)
            if c:
                c.disponible = True
                self.conductor_repo.update(c)

        self.repo.save(v)

        if aplicar_penalidad:
            self.repo.crear_cargo(v.id, PENALIDAD_CANCELACION, "Penalidad por cancelación tardía")

        return self._to_response(v)

    # HU8
    def calificar(self, viaje_id: int, dto: CalificacionDTO) -> CalificacionResponseDTO:
        v = self.repo.get_by_id(viaje_id)
        if v is None:
            raise NotFoundError("Viaje no encontrado")
        if v.estado != "finalizado":
            raise ConflictError("Solo se califican viajes finalizados")
        if self.calif_repo.get_by_viaje(viaje_id) is not None:
            raise ConflictError("El viaje ya tiene calificación")

        c = self.calif_repo.create(
            viaje_id=viaje_id,
            puntaje_pasajero=dto.puntaje_pasajero,
            puntaje_conductor=dto.puntaje_conductor,
            comentario=dto.comentario,
        )

        if dto.puntaje_conductor is not None and v.conductor_id:
            puntajes = self.calif_repo.puntajes_conductor(v.conductor_id)
            if puntajes:
                promedio = sum(puntajes) / len(puntajes)
                conductor = self.conductor_repo.get_by_id(v.conductor_id)
                if conductor:
                    conductor.calificacion_promedio = round(promedio, 2)
                    self.conductor_repo.update(conductor)

        return CalificacionResponseDTO.model_validate(c)

    # HU9
    def historial_pasajero(
        self,
        pasajero_id: int,
        desde: Optional[datetime] = None,
        hasta: Optional[datetime] = None,
    ) -> HistorialResponseDTO:
        viajes = self.repo.list_by_pasajero(pasajero_id, desde, hasta)
        responses = [self._to_response(v) for v in viajes]
        total = sum(r.tarifa_final for r in responses if r.estado == "finalizado")
        total += sum(c.monto for r in responses for c in r.cargos)
        return HistorialResponseDTO(viajes=responses, total_gastado=round(total, 2))

    # HU10
    def top_conductores(self) -> list[ConductorTopDTO]:
        from sqlalchemy import func

        from src.db.models.viaje_model import Viaje as ViajeModel

        rows = (
            self.db.query(Conductores, func.count(ViajeModel.id).label("cnt"))
            .join(ViajeModel, ViajeModel.conductor_id == Conductores.id)
            .filter(ViajeModel.estado == "finalizado")
            .group_by(Conductores.id)
            .having(func.count(ViajeModel.id) >= 5)
            .order_by(Conductores.calificacion_promedio.desc())
            .limit(10)
            .all()
        )
        return [
            ConductorTopDTO(
                id=c.id,
                nombre=c.nombre,
                calificacion_promedio=float(c.calificacion_promedio),
                cantidad_viajes=cnt,
            )
            for (c, cnt) in rows
        ]

    # HU14
    def reporte_mensual(self, conductor_id: int, anio: int, mes: int) -> ReporteMensualDTO:
        if self.conductor_repo.get_by_id(conductor_id) is None:
            raise NotFoundError("Conductor no encontrado")

        viajes = self.repo.list_finalizados_conductor(conductor_id, anio, mes)
        cantidad = len(viajes)
        ingresos = sum(float(v.tarifa_final) for v in viajes)
        km = sum(float(v.distancia_km) for v in viajes)
        puntajes = self.calif_repo.puntajes_conductor_mes(conductor_id, anio, mes)
        promedio = sum(puntajes) / len(puntajes) if puntajes else 0.0

        return ReporteMensualDTO(
            anio=anio,
            mes=mes,
            cantidad_viajes=cantidad,
            ingresos_totales=round(ingresos, 2),
            kilometros_recorridos=round(km, 2),
            calificacion_promedio=round(promedio, 2),
        )
