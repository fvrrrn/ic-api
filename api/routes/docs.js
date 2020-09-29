import express from 'express'
const { Router } = express
import middlewares from '../middlewares/index.js'
const { swagger } = middlewares
const route = Router()

export default (app) => {
  app.use('/', swagger.swaggerUI.serve)
  app.use('/', route)
  route.get('/', swagger.swaggerUI.setup(swagger.options))
}
