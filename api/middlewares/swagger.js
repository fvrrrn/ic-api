import swaggerUI from 'swagger-ui-express'
import swaggerJSDoc from 'swagger-jsdoc'
import config from '../../config/index.js'

const swaggerDoc = {
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
  paths: {
    '/admission/applicants/{degree_type_name}&{enroll_accepted}': {
      get: {
        operationId: 'admission/applicants',
        summary: 'Приемная кампания / Абитуриенты',
        parameters: [
          {
            in: 'query',
            name: 'degree_type_name',
            schema: {
              type: 'string',
            },
            default: 'Бакалавр',
            description:
              'Название уровня подготовки (Бакалавр, Магистр и т.д.)',
          },
          {
            in: 'query',
            name: 'enroll_accepted',
            schema: {
              type: 'boolean',
            },
            description: 'Согласен ли абитурент на зачисление.',
          },
        ],
        produces: ['application/json'],
        responses: {
          200: {
            description: 'OK',
            schema: {
              $ref: '#/definitions/Applicant',
            },
            examples: {
              'application/json':
                '{\n  "code1C":"100090393",\n  "surname":"Гадирова",\n  "name":"Гюнай",\n  "patronymic":"Фаризовна",\n  "extra_score":5,\n  "is_doc_original":false,\n  "privileged":false,\n  "dorm_required":false,\n  "date_applied":"2020-07-13T14:23:57.000Z",\n  "exams":{\n    "ege":[{"id":"000000014","name":"Информатика и ИКТ","score":44}],\n    "vi":[\n      {"id":"000000002","name":"Математика","score":79},\n      {"id":"000000001","name":"Русский язык","score":67},\n      {"id":"000000014","name":"Информатика и ИКТ","score":46}\n    ]\n  },\n  "specs":[\n    {\n      "id":"230",\n      "name":"Прикладная информатика",\n      "enroll_accepted":false,\n      "concurrency_type":{"id":"000001144","name":"Прикладная информатика"},\n      "sponsorship_type":{"id":"000000003","name":"Бюджетная основа"},\n      "admission_type":{"id":"000000003","name":"На общих основаниях"},\n      "degree_type":{"id":"000000001","name":"Бакалавр"},\n      "status":{"id":0,"name":"Подано"}\n    },\n    {\n      "id":"195",\n      "name":"Информатика и вычислительная техника",\n      "enroll_accepted":false,\n      "concurrency_type":{"id":"000001136","name":"Информатика и вычислительная техника"},\n      "sponsorship_type":{"id":"000000003","name":"Бюджетная основа"},\n      "admission_type":{"id":"000000003","name":"На общих основаниях"},\n      "degree_type":{"id":"000000001","name":"Бакалавр"},\n      "status":{"id":0,"name":"Подано"}\n    },\n    {\n      "id":"231",\n      "name":"Фундаментальная информатика и информационные технологии",\n      "enroll_accepted":false,\n      "concurrency_type":{\n        "id":"000001132",\n        "name":"Фундаментальная информатика и информационные технологии"\n      },\n      "sponsorship_type":{"id":"000000003","name":"Бюджетная основа"},\n      "admission_type":{"id":"000000003","name":"На общих основаниях"},\n      "degree_type":{"id":"000000001","name":"Бакалавр"},\n      "status":{"id":0,"name":"Подано"}\n    }\n  ],\n  "update_time":"10:44:15"\n}',
            },
          },
        },
      },
    },
    '/admission/concurrency_types': {
      get: {
        operationId: 'admission/concurrency_types{name}&{degree_type_name}',
        summary: 'Приемная кампания / Конкурсные группы',
        parameters: [
          {
            in: 'query',
            name: 'name',
            schema: {
              type: 'string',
            },
            description: 'Название конкурсной группы.',
          },
          {
            in: 'query',
            name: 'degree_type_name',
            schema: {
              type: 'boolean',
            },
            description:
              'Название уровня подготовки (Бакалавр, Магистр и т.д.)',
          },
        ],
        produces: ['application/json'],
        responses: {
          200: {
            description: 'OK',
            schema: {
              type: 'object',
              properties: {
                code1C: {
                  type: 'number',
                },
                snp: {
                  type: 'string',
                },
              },
            },
            examples: {
              'application/json':
                '{\n  "code1C":"100090393",\n  "surname":"Гадирова",\n  "name":"Гюнай",\n  "patronymic":"Фаризовна",\n  "extra_score":5,\n  "is_doc_original":false,\n  "privileged":false,\n  "dorm_required":false,\n  "date_applied":"2020-07-13T14:23:57.000Z",\n  "exams":{\n    "ege":[{"id":"000000014","name":"Информатика и ИКТ","score":44}],\n    "vi":[\n      {"id":"000000002","name":"Математика","score":79},\n      {"id":"000000001","name":"Русский язык","score":67},\n      {"id":"000000014","name":"Информатика и ИКТ","score":46}\n    ]\n  },\n  "specs":[\n    {\n      "id":"230",\n      "name":"Прикладная информатика",\n      "enroll_accepted":false,\n      "concurrency_type":{"id":"000001144","name":"Прикладная информатика"},\n      "sponsorship_type":{"id":"000000003","name":"Бюджетная основа"},\n      "admission_type":{"id":"000000003","name":"На общих основаниях"},\n      "degree_type":{"id":"000000001","name":"Бакалавр"},\n      "status":{"id":0,"name":"Подано"}\n    },\n    {\n      "id":"195",\n      "name":"Информатика и вычислительная техника",\n      "enroll_accepted":false,\n      "concurrency_type":{"id":"000001136","name":"Информатика и вычислительная техника"},\n      "sponsorship_type":{"id":"000000003","name":"Бюджетная основа"},\n      "admission_type":{"id":"000000003","name":"На общих основаниях"},\n      "degree_type":{"id":"000000001","name":"Бакалавр"},\n      "status":{"id":0,"name":"Подано"}\n    },\n    {\n      "id":"231",\n      "name":"Фундаментальная информатика и информационные технологии",\n      "enroll_accepted":false,\n      "concurrency_type":{\n        "id":"000001132",\n        "name":"Фундаментальная информатика и информационные технологии"\n      },\n      "sponsorship_type":{"id":"000000003","name":"Бюджетная основа"},\n      "admission_type":{"id":"000000003","name":"На общих основаниях"},\n      "degree_type":{"id":"000000001","name":"Бакалавр"},\n      "status":{"id":0,"name":"Подано"}\n    }\n  ],\n  "update_time":"10:44:15"\n}',
            },
          },
        },
      },
    },
  },
  consumes: ['application/json'],
  definitions: {
    Teacher: {
      type: 'object',
      properties: {
        code1C: {
          type: 'number',
        },
        snp: {
          type: 'string',
        },
      },
    },
    Applicant: {
      type: 'object',
      properties: {
        code1C: {
          type: 'number',
        },
        snp: {
          type: 'string',
        },
      },
    },
  },
}

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
  swaggerDoc,
  options,
}
