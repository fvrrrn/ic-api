import express from 'express'
const { Router } = express
import admission from './routes/admission.js'
import info from './routes/info.js'
import schedule from './routes/schedule.js'
import staff from './routes/staff.js'

// guaranteed to get dependencies
export default () => {
  const app = Router()
  admission(app)
  info(app)
  schedule(app)
  staff(app)
  return app
}
