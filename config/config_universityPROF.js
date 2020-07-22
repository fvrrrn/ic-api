const sql = require('mssql')

const pool = new sql.ConnectionPool({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE_PROF,
  requestTimeout: 60000,
})

const poolConnection = pool.connect()

module.exports.pool = pool
module.exports.poolConnection = poolConnection
