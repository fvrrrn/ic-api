import express from 'express'
const { Router } = express
import mssql from '../../loaders/mssql.js'
import LoggerInstance from '../../loaders/logger.js'
const route = Router()

export default (app) => {
  app.use('/staff', route)

  route.get('/', async (req, res) => {
    const { code1C = 'code1C', snp = 'snp' } = req.body
    try {
      const result = await mssql.pool2
        .request()
        .input('snp', mssql.types.NVarChar, `%${snp}%`)
        .query(
          `select Фамилия surname,
          Имя name,
          Отчество patronymic,
          ДатаРождения birth_date,
        from kadry1c.dbo.справочник_физическиелица
        where наименование like isnull(@snp, наименование)`,
        )
      res.send(result.recordset).status(200)
    } catch (error) {
      LoggerInstance.error('staff/ error: ', error)
      res.sendStatus(500)
    }
  })
}
