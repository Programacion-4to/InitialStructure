import { prisma } from '../config/prisma.js'

export class UsuarioRepository {
  async create(input: { email: string; nombre: string }) {
    return prisma.usuario.create({ data: input })
  }

  async findById(id: string) {
    return prisma.usuario.findUnique({ where: { id } })
  }

  async findByEmail(email: string) {
    return prisma.usuario.findUnique({ where: { email } })
  }

  async enrollUserInCourse(usuarioId: string, cursoId: string) {
    return prisma.usuarioCurso.create({
      data: {
        usuarioId,
        cursoId
      }
    })
  }

  async getBadges(usuarioId: string) {
    return prisma.usuarioInsignia.findMany({
      where: { usuarioId },
      include: { insignia: true }
    })
  }

  async getFriends(usuarioId: string) {
    return prisma.amistad.findMany({
      where: {
        OR: [{ usuarioAId: usuarioId }, { usuarioBId: usuarioId }]
      },
      include: {
        usuarioA: true,
        usuarioB: true
      }
    })
  }
}
