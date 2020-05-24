const sql = require('mssql')

const poolKadry1C = new sql.ConnectionPool({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE_KADRY1C,
})

module.exports = poolKadry1C
