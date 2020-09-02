import { Router, Request, Response } from 'express'
import mssql from '../../loaders/mssql'
import LoggerInstance from '../../loaders/logger'
const route = Router()

export default (app: Router) => {
  app.use('/staff', route)

  route.get('/', async (req: Request, res: Response) => {
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
