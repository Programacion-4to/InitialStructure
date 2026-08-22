import express from 'express'\nimport { usuarioRoutes } from './routes/usuario.routes.js'
import { cursoRoutes } from './routes/curso.routes.js'
import { rankingRoutes } from './routes/ranking.routes.js'
import { errorHandler } from './middleware/error.middleware.js'

const app = express()
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'duolingo-backend' })
})

app.use('/usuarios', usuarioRoutes)
app.use('/cursos', cursoRoutes)
app.use('/ranking', rankingRoutes)

app.use(errorHandler)

export default app
