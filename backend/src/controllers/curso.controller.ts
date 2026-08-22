import { NextFunction, Request, Response } from 'express'
import { CursoService } from '../services/curso.service.js'

const cursoService = new CursoService()

export class CursoController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const curso = await cursoService.create(req.body)
      res.status(201).json(curso)
    } catch (error) {
      next(error)
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await cursoService.remove(req.params.id)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  async createLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const leccion = await cursoService.createLesson(req.params.id, req.body)
      res.status(201).json(leccion)
    } catch (error) {
      next(error)
    }
  }

  async getLessons(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cursoService.getLessons(req.params.id)
      res.json(result)
    } catch (error) {
      next(error)
    }
  }
}

export const cursoController = new CursoController()
