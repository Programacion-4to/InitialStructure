import { NextFunction, Request, Response } from 'express'
import { AuthService } from '../services/auth.service.js'

const authService = new AuthService()

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.register(req.body)
      res.status(201).json(user)
    } catch (error) {
      next(error)
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body)
      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  async checkUsername(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.checkUsername(String(req.query.nombre_usuario ?? ''))
      res.json(result)
    } catch (error) {
      next(error)
    }
  }
}

export const authController = new AuthController()
