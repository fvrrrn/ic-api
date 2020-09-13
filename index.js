import config from './config/index.js'
import express from 'express'

import expressLoader from './loaders/express.js'
import mssqlLoader from './loaders/mssql.js'
import Logger from './loaders/logger.js'

async function startServer() {
  const app = express()

  await mssqlLoader.pool1.connect()
  Logger.info('✌️ DB1 loaded and connected!')

  await mssqlLoader.pool2.connect()
  Logger.info('✌️ DB2 loaded and connected!')

  await expressLoader({ app })
  Logger.info('✌️ Express loaded')

  app.listen(config.port, (err) => {
    if (err) {
      Logger.error(err)
      process.exit(1)
      return
    }
    Logger.info(`Server listening on port: ${config.port}`)
  })
}

startServer()
