import app from './app.js'
import { config } from './config/env.js'

app.listen(config.port, () => {
  console.log(`Servidor levantado en http://localhost:${config.port}`)
})
