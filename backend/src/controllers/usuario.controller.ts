import { Request, Response, NextFunction } from 'express'
import { UsuarioService } from '../services/usuario.service.js'

const usuarioService = new UsuarioService()

export class UsuarioController {
  async enrollCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usuarioService.enrollCourse(req.params.id, req.body)
      res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  }

  async completeLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usuarioService.completeLesson(req.params.id, req.params.leccionId)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }

  async getBadges(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usuarioService.getBadges(req.params.id)
      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  async createFriendRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usuarioService.createFriendRequest(req.params.id, req.body)
      res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  }

  async getFriendRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usuarioService.getFriendRequests(req.params.id)
      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  async respondFriendRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usuarioService.respondFriendRequest(req.params.id, req.params.solicitudId, req.body)
      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  async getFriends(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usuarioService.getFriends(req.params.id)
      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  async getRankingAmigos(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usuarioService.getRankingAmigos(req.params.id)
      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  async getCourseProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usuarioService.getCourseProgress(req.params.id, req.params.cursoId)
      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  async getActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usuarioService.getActivity(req.params.id, req.query)
      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  async activatePremium(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usuarioService.activatePremium(req.params.id)
      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  async cancelPremium(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usuarioService.cancelPremium(req.params.id)
      res.json(result)
    } catch (error) {
      next(error)
    }
  }
}

export const usuarioController = new UsuarioController()
