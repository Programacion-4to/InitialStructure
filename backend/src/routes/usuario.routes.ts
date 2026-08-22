import { Router } from 'express'
import { usuarioController } from '../controllers/usuario.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

export const usuarioRoutes = Router()

usuarioRoutes.post('/:id/cursos', authMiddleware, usuarioController.enrollCourse.bind(usuarioController))
usuarioRoutes.post('/:id/lecciones/:leccionId/completar', authMiddleware, usuarioController.completeLesson.bind(usuarioController))
usuarioRoutes.get('/:id/insignias', authMiddleware, usuarioController.getBadges.bind(usuarioController))
usuarioRoutes.post('/:id/amigos/solicitudes', authMiddleware, usuarioController.createFriendRequest.bind(usuarioController))
usuarioRoutes.get('/:id/amigos/solicitudes', authMiddleware, usuarioController.getFriendRequests.bind(usuarioController))
usuarioRoutes.post('/:id/amigos/solicitudes/:solicitudId/responder', authMiddleware, usuarioController.respondFriendRequest.bind(usuarioController))
usuarioRoutes.get('/:id/amigos', authMiddleware, usuarioController.getFriends.bind(usuarioController))
usuarioRoutes.get('/:id/ranking-amigos', authMiddleware, usuarioController.getRankingAmigos.bind(usuarioController))
usuarioRoutes.get('/:id/cursos/:cursoId/progreso', authMiddleware, usuarioController.getCourseProgress.bind(usuarioController))
usuarioRoutes.get('/:id/actividad', authMiddleware, usuarioController.getActivity.bind(usuarioController))
usuarioRoutes.post('/:id/premium/activar', authMiddleware, usuarioController.activatePremium.bind(usuarioController))
usuarioRoutes.post('/:id/premium/cancelar', authMiddleware, usuarioController.cancelPremium.bind(usuarioController))
