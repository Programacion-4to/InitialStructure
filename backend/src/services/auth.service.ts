import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/api-errors.js'
import { hashPassword, comparePassword } from '../lib/password.js'
import { signJwt } from '../lib/jwt.js'

const registerSchema = z.object({
  nombre_usuario: z.string().min(3).max(30),
  email: z.string().email(),
  nombre: z.string().min(2),
  password: z.string().min(6)
})

const loginSchema = z.object({
  nombre_usuario: z.string().min(3),
  password: z.string().min(6)
})

export class AuthService {
  async register(payload: unknown) {
    const input = registerSchema.parse(payload)

    const existingByUser = await prisma.usuario.findUnique({ where: { nombre_usuario: input.nombre_usuario } })
    if (existingByUser) {
      throw new AppError('El nombre de usuario ya existe', 409, 'CONFLICT')
    }

    const existingByEmail = await prisma.usuario.findUnique({ where: { email: input.email } })
    if (existingByEmail) {
      throw new AppError('El email ya existe', 409, 'CONFLICT')
    }

    const password_hash = await hashPassword(input.password)

    const usuario = await prisma.usuario.create({
      data: {
        nombre_usuario: input.nombre_usuario,
        email: input.email,
        nombre: input.nombre,
        password_hash,
        xp_total: 0,
        racha_dias: 0,
        rol: 'alumno'
      }
    })

    const { password_hash: _passwordHash, ...safeUser } = usuario
    return safeUser
  }

  async login(payload: unknown) {
    const input = loginSchema.parse(payload)

    const usuario = await prisma.usuario.findUnique({ where: { nombre_usuario: input.nombre_usuario } })
    if (!usuario) {
      throw new AppError('Credenciales inválidas', 401, 'UNAUTHORIZED')
    }

    const valid = await comparePassword(input.password, usuario.password_hash)
    if (!valid) {
      throw new AppError('Credenciales inválidas', 401, 'UNAUTHORIZED')
    }

    const token = signJwt({ sub: usuario.id, nombre_usuario: usuario.nombre_usuario, rol: usuario.rol })
    const { password_hash: _passwordHash, ...safeUser } = usuario

    return {
      token,
      usuario: safeUser
    }
  }

  async checkUsername(nombreUsuario: string) {
    if (!nombreUsuario || !nombreUsuario.trim()) {
      return { disponible: true }
    }

    const usuario = await prisma.usuario.findUnique({ where: { nombre_usuario: nombreUsuario.trim() } })
    return { disponible: !usuario }
  }
}
