import { config } from 'dotenv'

config()
import express from 'express'
const router = express.Router()
import errorhandler from 'errorhandler'
import cors from 'cors'
import { logger } from './lib/logger'

import bodyParser from 'body-parser'

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

const isProduction = process.env.NODE_ENV !== 'development'

if (!isProduction) {
  app.use(errorhandler())
}

app.use(require('./routes'))

app.use((req, res, next) => {
  let err = new Error('Not Found')
  err.status = 404
  logger.log('error', 'Error Not Found', {
    err,
  })
  next(err)
})

if (!isProduction) {
  app.use((err, req, res, next) => {
    console.log(err.stack)

    res.status(err.status || 500)

    res.json({
      errors: {
        message: err.message,
        error: err,
      },
    })
  })
} else {
  // production error handler
  // no stacktraces leaked to user
  app.use(function (err, req, res, next) {
    res.status(err.status || 500)
    res.json({
      errors: {
        message: err.message,
        error: {},
      },
    })
  })
}

// Т.к. nginx сам по себе пропускает только https,
// десь необязательно его включать, поэтому
// rocess.env.NODE_ENV === 'development' изменено на true

// http
if (true) {
  let server = app.listen(process.env.PORT || 3000, function () {
    console.log('HTTP: Listening on port ' + server.address().port)
  })
} else {
  const sslOptions = {
    key: readFileSync('/etc/ssl/uni/private.key'),
    cert: readFileSync('/etc/ssl/uni/cert.crt'),
  }

  createServer(sslOptions, app).listen(process.env.PORT || 3000, () => {
    console.log(`HTTPS: Listening on ${process.env.PORT}`)
  })
}
module.exports = router
module.exports = app
