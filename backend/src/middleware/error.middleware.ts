import { NextFunction, Request, Response } from 'express'
import { AppError } from '../utils/api-errors.js'

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      code: error.code,
      statusCode: error.statusCode
    })
  }

  console.error(error)

  return res.status(500).json({
    message: 'Error interno del servidor',
    code: 'INTERNAL_SERVER_ERROR',
    statusCode: 500
  })
}
