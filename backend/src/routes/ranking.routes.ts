import { Router } from 'express'
import { rankingController } from '../controllers/ranking.controller.js'

export const rankingRoutes = Router()

rankingRoutes.get('/', rankingController.getRanking.bind(rankingController))
