import mssql from 'mssql'
const { ConnectionPool, NVarChar, Int } = mssql
import config from '../config/index.js'

const pool1 = new ConnectionPool({
  user: config.databaseUser,
  password: config.databasePassword,
  server: config.databaseHost,
  database: config.database1,
  requestTimeout: 300000,
  options: {
    encrypt: false,
    enableArithAbort: true,
    trustServerCertificate: true,
  },
})

const pool2 = new ConnectionPool({
  user: config.databaseUser,
  password: config.databasePassword,
  server: config.databaseHost,
  database: config.database2,
  options: {
    encrypt: false,
    enableArithAbort: true,
    trustServerCertificate: true,
  },
})

export default {
  pool1,
  pool2,
  types: {
    NVarChar,
    Int,
  },
}
