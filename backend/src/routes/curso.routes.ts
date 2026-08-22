import { Router } from 'express'
import { cursoController } from '../controllers/curso.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { adminMiddleware } from '../middleware/admin.middleware.js'

export const cursoRoutes = Router()

cursoRoutes.post('/', authMiddleware, adminMiddleware, cursoController.create.bind(cursoController))
cursoRoutes.delete('/:id', authMiddleware, adminMiddleware, cursoController.remove.bind(cursoController))
cursoRoutes.post('/:id/lecciones', authMiddleware, adminMiddleware, cursoController.createLesson.bind(cursoController))
cursoRoutes.get('/:id/lecciones', authMiddleware, cursoController.getLessons.bind(cursoController))
