import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/api-errors.js'

const enrollCourseSchema = z.object({
  curso_id: z.string().min(1)
})

const friendRequestSchema = z.object({
  usuario_receptor_id: z.string().min(1)
})

const respondFriendRequestSchema = z.object({
  aceptar: z.boolean()
})

export class UsuarioService {
  async enrollCourse(usuarioId: string, payload: unknown) {
    const input = enrollCourseSchema.parse(payload)

    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND')
    }

    const curso = await prisma.curso.findUnique({ where: { id: input.curso_id } })
    if (!curso) {
      throw new AppError('Curso no encontrado', 404, 'NOT_FOUND')
    }

    const existing = await prisma.usuarioCurso.findUnique({
      where: { usuario_id_curso_id: { usuario_id: usuarioId, curso_id: input.curso_id } }
    })

    if (existing) {
      throw new AppError('El usuario ya está inscripto a este curso', 409, 'CONFLICT')
    }

    return prisma.usuarioCurso.create({
      data: {
        usuario_id: usuarioId,
        curso_id: input.curso_id
      }
    })
  }

  async completeLesson(usuarioId: string, leccionId: string) {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND')
    }

    const leccion = await prisma.leccion.findUnique({
      where: { id: leccionId },
      include: { curso: true }
    })

    if (!leccion) {
      throw new AppError('Lección no encontrada', 404, 'NOT_FOUND')
    }

    if (leccion.orden > 1) {
      const anterior = await prisma.leccion.findFirst({
        where: {
          curso_id: leccion.curso_id,
          orden: leccion.orden - 1
        }
      })

      if (anterior) {
        const anteriorCompletada = await prisma.progreso.findFirst({
          where: {
            usuario_id: usuarioId,
            leccion_id: anterior.id,
            completada: true
          }
        })

        if (!anteriorCompletada) {
          throw new AppError('Debes completar la lección anterior antes de continuar', 400, 'BAD_REQUEST')
        }
      }
    }

    const preguntas = await prisma.pregunta.findMany({
      where: { leccion_id: leccionId },
      orderBy: { orden: 'asc' }
    })

    const visibles = preguntas.filter((pregunta) => usuario.es_premium || !pregunta.es_premium)
    const total = visibles.length
    const correctas = total === 0 ? 0 : (await prisma.respuestaUsuario.findMany({
      where: {
        usuario_id: usuarioId,
        pregunta: { leccion_id: leccionId }
      },
      orderBy: { fecha: 'desc' },
      include: { pregunta: true }
    })).filter((respuesta) => (usuario.es_premium || !respuesta.pregunta.es_premium)).slice(0, total).filter((respuesta) => respuesta.es_correcta).length

    const puntaje = total === 0 ? 0 : Math.round((correctas / total) * 100)
    const completada = puntaje >= 60

    const progreso = await prisma.progreso.create({
      data: {
        usuario_id: usuarioId,
        leccion_id: leccionId,
        puntaje,
        completada,
        fecha: new Date()
      }
    })

    if (completada) {
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: {
          xp_total: { increment: leccion.xp_recompensa },
          fecha_ultima_actividad: new Date()
        }
      })
    }

    return progreso
  }

  async getBadges(usuarioId: string) {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND')
    }

    return prisma.usuarioInsignia.findMany({
      where: { usuario_id: usuarioId },
      include: { insignia: true }
    })
  }

  async createFriendRequest(usuarioId: string, payload: unknown) {
    const input = friendRequestSchema.parse(payload)

    if (usuarioId === input.usuario_receptor_id) {
      throw new AppError('No puedes enviarte una solicitud a ti mismo', 400, 'BAD_REQUEST')
    }

    const receptor = await prisma.usuario.findUnique({ where: { id: input.usuario_receptor_id } })
    if (!receptor) {
      throw new AppError('Usuario receptor no encontrado', 404, 'NOT_FOUND')
    }

    const yaExiste = await prisma.solicitudAmistad.findUnique({
      where: {
        usuario_solicitante_id_usuario_receptor_id: {
          usuario_solicitante_id: usuarioId,
          usuario_receptor_id: input.usuario_receptor_id
        }
      }
    })

    if (yaExiste) {
      throw new AppError('Ya existe una solicitud de amistad', 409, 'CONFLICT')
    }

    const yaAmigos = await prisma.amigo.findFirst({
      where: {
        OR: [
          { usuario_a_id: usuarioId, usuario_b_id: input.usuario_receptor_id },
          { usuario_a_id: input.usuario_receptor_id, usuario_b_id: usuarioId }
        ]
      }
    })

    if (yaAmigos) {
      throw new AppError('Ya son amigos', 409, 'CONFLICT')
    }

    return prisma.solicitudAmistad.create({
      data: {
        usuario_solicitante_id: usuarioId,
        usuario_receptor_id: input.usuario_receptor_id,
        estado: 'pendiente'
      }
    })
  }

  async getFriendRequests(usuarioId: string) {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND')
    }

    return prisma.solicitudAmistad.findMany({
      where: {
        usuario_receptor_id: usuarioId,
        estado: 'pendiente'
      },
      include: {
        solicitante: true
      }
    })
  }

  async respondFriendRequest(usuarioId: string, solicitudId: string, payload: unknown) {
    const input = respondFriendRequestSchema.parse(payload)

    const solicitud = await prisma.solicitudAmistad.findUnique({ where: { id: solicitudId } })
    if (!solicitud) {
      throw new AppError('Solicitud no encontrada', 404, 'NOT_FOUND')
    }

    if (solicitud.usuario_receptor_id !== usuarioId) {
      throw new AppError('No puedes responder esta solicitud', 403, 'FORBIDDEN')
    }

    const updated = await prisma.solicitudAmistad.update({
      where: { id: solicitudId },
      data: { estado: input.aceptar ? 'aceptada' : 'rechazada' }
    })

    if (input.aceptar) {
      await prisma.amigo.createMany({
        data: [
          { usuario_a_id: usuarioId, usuario_b_id: solicitud.usuario_solicitante_id },
          { usuario_a_id: solicitud.usuario_solicitante_id, usuario_b_id: usuarioId }
        ],
        skipDuplicates: true
      })
    }

    return updated
  }

  async getFriends(usuarioId: string) {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND')
    }

    const amistades = await prisma.amigo.findMany({
      where: {
        OR: [{ usuario_a_id: usuarioId }, { usuario_b_id: usuarioId }]
      },
      include: {
        usuarioA: true,
        usuarioB: true
      }
    })

    return amistades.map((item) => {
      const friend = item.usuario_a_id === usuarioId ? item.usuarioB : item.usuarioA
      return {
        id: friend.id,
        nombre_usuario: friend.nombre_usuario,
        nombre: friend.nombre,
        xp_total: friend.xp_total,
        racha_dias: friend.racha_dias
      }
    })
  }

  async getRankingAmigos(usuarioId: string) {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND')
    }

    return {
      usuario: {
        id: usuario.id,
        nombre_usuario: usuario.nombre_usuario,
        nombre: usuario.nombre,
        xp_total: usuario.xp_total,
        racha_dias: usuario.racha_dias
      },
      amigos: [],
      posicion: 1
    }
  }

  async getCourseProgress(usuarioId: string, cursoId: string) {
    const inscripcion = await prisma.usuarioCurso.findUnique({
      where: { usuario_id_curso_id: { usuario_id: usuarioId, curso_id: cursoId } }
    })

    if (!inscripcion) {
      throw new AppError('Usuario no inscripto al curso', 404, 'NOT_FOUND')
    }

    const total = await prisma.leccion.count({ where: { curso_id: cursoId } })
    const completadas = await prisma.progreso.count({
      where: {
        usuario_id: usuarioId,
        leccion: { curso_id: cursoId },
        completada: true
      }
    })

    return {
      total_lecciones: total,
      completadas,
      porcentaje: total === 0 ? 0 : Math.round((completadas / total) * 100),
      proxima_leccion: null
    }
  }

  async getActivity(usuarioId: string, query: unknown) {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND')
    }

    const parsed = z.object({
      desde: z.string().optional(),
      hasta: z.string().optional()
    }).parse(query)

    const from = parsed.desde ? new Date(parsed.desde) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const to = parsed.hasta ? new Date(parsed.hasta) : new Date()

    return {
      usuarioId,
      desde: parsed.desde ?? from.toISOString(),
      hasta: parsed.hasta ?? to.toISOString(),
      data: []
    }
  }

  async activatePremium(usuarioId: string) {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND')
    }

    const updated = await prisma.usuario.update({
      where: { id: usuarioId },
      data: { es_premium: true }
    })

    const { password_hash: _passwordHash, ...safeUser } = updated
    return safeUser
  }

  async cancelPremium(usuarioId: string) {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND')
    }

    const updated = await prisma.usuario.update({
      where: { id: usuarioId },
      data: { es_premium: false }
    })

    const { password_hash: _passwordHash, ...safeUser } = updated
    return safeUser
  }
}
