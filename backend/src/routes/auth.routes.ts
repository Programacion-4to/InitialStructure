import { Router } from 'express'
import { authController } from '../controllers/auth.controller.js'

export const authRoutes = Router()

authRoutes.post('/login', authController.login.bind(authController))
authRoutes.get('/usuarios/verificar-nombre-usuario', authController.checkUsername.bind(authController))
authRoutes.post('/usuarios', authController.register.bind(authController))
