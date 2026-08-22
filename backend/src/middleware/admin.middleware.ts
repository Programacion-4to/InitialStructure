import { NextFunction, Request, Response } from 'express'
import { AppError } from '../utils/api-errors.js'

export function adminMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (!req.user || req.user.rol !== 'admin') {
    return next(new AppError('No tienes permisos de administrador', 403, 'FORBIDDEN'))
  }

  return next()
}
