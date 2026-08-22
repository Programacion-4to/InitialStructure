import { NextFunction, Request, Response } from 'express'
import { AppError } from '../utils/api-errors.js'
import { prisma } from '../config/prisma.js'
import { verifyJwt } from '../lib/jwt.js'

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('Token no proporcionado', 401, 'UNAUTHORIZED')
    }

    const token = header.replace('Bearer ', '').trim()
    const payload = verifyJwt(token)

    const user = await prisma.usuario.findUnique({
      where: { id: payload.sub }
    })

    if (!user) {
      throw new AppError('Usuario no válido', 401, 'UNAUTHORIZED')
    }

    req.user = {
      id: user.id,
      nombre_usuario: user.nombre_usuario,
      email: user.email,
      rol: user.rol,
      es_premium: user.es_premium
    }

    next()
  } catch (error) {
    next(error)
  }
}
