import { Router } from 'express'
import admission from './routes/admission'
import info from './routes/info'
import schedule from './routes/schedule'
import staff from './routes/staff'

// guaranteed to get dependencies
export default () => {
  const app = Router()
  admission(app)
  info(app)
  schedule(app)
  staff(app)
  return app
}
