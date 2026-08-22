import { prisma } from '../config/prisma.js'

export class CursoRepository {
  async create(input: { idiomaId: string; nivel: string }) {
    return prisma.curso.create({ data: { ...input, nivel: input.nivel as any } })
  }

  async getLessonsByCourse(cursoId: string) {
    return prisma.leccion.findMany({
      where: { cursoId },
      orderBy: { orden: 'asc' }
    })
  }

  async addLesson(input: { cursoId: string; orden: number; titulo: string; xpRecompensa: number }) {
    return prisma.leccion.create({ data: input })
  }

  async getCourseById(id: string) {
    return prisma.curso.findUnique({ where: { id } })
  }
}
