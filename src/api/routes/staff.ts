import { Router, Request, Response } from 'express'
import mssql from '../../loaders/mssql'
import LoggerInstance from '../../loaders/logger'
const route = Router()

export default (app: Router) => {
  app.use('/staff', route)

  route.get('/', async (req: Request, res: Response) => {
    let { code1C = 'code1C', snp = 'snp' } = req.body
    try {
      const result = await mssql.pool2.request().query(
        `select код, наименование, датарождения
        from kadry1c.dbo.справочник_физическиелица
        where наименование like '%${snp}%'`,
      )
      res.send(result.recordset).status(200)
    } catch (error) {
      LoggerInstance.error('info/teachers error: ', error)
      res.sendStatus(500)
    }
  })
}
