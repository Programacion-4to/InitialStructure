import { NextFunction, Request, Response } from 'express'
import { RankingService } from '../services/ranking.service.js'

const rankingService = new RankingService()

export class RankingController {
  async getRanking(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await rankingService.getRanking(req.query.periodo as string | undefined)
      res.json(result)
    } catch (error) {
      next(error)
    }
  }
}

export const rankingController = new RankingController()
