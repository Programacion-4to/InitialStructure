import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/api-errors.js'

const cursoSchema = z.object({
  idioma_id: z.string().min(1),
  nivel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1'])
})

const leccionSchema = z.object({
  orden: z.number().int().min(1),
  titulo: z.string().min(1),
  xp_recompensa: z.number().int().min(5).max(50)
})

export class CursoService {
  async create(payload: unknown) {
    const input = cursoSchema.parse(payload)

    const idioma = await prisma.idioma.findUnique({ where: { id: input.idioma_id } })
    if (!idioma) {
      throw new AppError('Idioma no encontrado', 404, 'NOT_FOUND')
    }

    return prisma.curso.create({ data: input })
  }

  async remove(cursoId: string) {
    const curso = await prisma.curso.findUnique({ where: { id: cursoId } })
    if (!curso) {
      throw new AppError('Curso no encontrado', 404, 'NOT_FOUND')
    }

    await prisma.curso.delete({ where: { id: cursoId } })
  }

  async createLesson(cursoId: string, payload: unknown) {
    const input = leccionSchema.parse(payload)

    const curso = await prisma.curso.findUnique({ where: { id: cursoId } })
    if (!curso) {
      throw new AppError('Curso no encontrado', 404, 'NOT_FOUND')
    }

    const exists = await prisma.leccion.findUnique({
      where: {
        curso_id_orden: {
          curso_id: cursoId,
          orden: input.orden
        }
      }
    })

    if (exists) {
      throw new AppError('El orden de la lección ya existe en este curso', 409, 'CONFLICT')
    }

    return prisma.leccion.create({
      data: {
        curso_id: cursoId,
        orden: input.orden,
        titulo: input.titulo,
        xp_recompensa: input.xp_recompensa
      }
    })
  }

  async getLessons(cursoId: string) {
    const curso = await prisma.curso.findUnique({ where: { id: cursoId } })
    if (!curso) {
      throw new AppError('Curso no encontrado', 404, 'NOT_FOUND')
    }

    return prisma.leccion.findMany({
      where: { curso_id: cursoId },
      orderBy: { orden: 'asc' }
    })
  }
}
