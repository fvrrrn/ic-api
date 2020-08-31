import expressLoader from './express'
import mssqlLoader from './mssql'
import Logger from './logger'

export default async ({ expressApp }) => {
  await mssqlLoader.pool1.connect()
  Logger.info('✌️ DB1 loaded and connected!')

  await mssqlLoader.pool2.connect()
  Logger.info('✌️ DB2 loaded and connected!')

  await expressLoader({ app: expressApp })
  Logger.info('✌️ Express loaded')
}
