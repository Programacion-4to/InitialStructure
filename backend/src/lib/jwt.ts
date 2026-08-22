import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'

export function signJwt(payload: object) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' })
}

export function verifyJwt(token: string) {
  return jwt.verify(token, config.jwtSecret) as { sub: string; nombre_usuario?: string; rol?: string }
}
