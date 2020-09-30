import swaggerUI from 'swagger-ui-express'
import swaggerJSDoc from 'swagger-jsdoc'

const options = swaggerJSDoc({
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Документация к 1C API',
      version: '1.0',
      license: {
        name: 'MIT',
        url: 'https://choosealicense.com/licenses/mit/',
      },
      contact: {
        name: 'Борис Чернышов, отдел АСУО',
        email: 'boris.chernystrand@gmail.com',
      },
    },
  },
  apis: ['api/routes/*.js'],
})

export default {
  swaggerUI,
  options,
}
