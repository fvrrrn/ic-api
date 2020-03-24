const router = require('express').Router();
const sql = require('mssql');
const pool = require('../config/config_Kadry1C');
const {
  logger
} = require('../lib/logger');

router.route('/getStaffByFio/:fio').get((req, res, next) => {
  pool.connect(err => {
    if (err) res.sendStatus(400);

    const request = new sql.Request(pool);
    request.input('fio', sql.NVarChar, `%${req.params.fio}%`);
    request.query(
      `select код, наименование, датарождения
      from kadry1c.dbo.справочник_физическиелица
      where наименование like @fio
    `,
      (err, result) => {
        if (err) {
          logger.log('error', 'Get staff from Kadry1C error', {
            err
          });
          res.sendStatus(400);
        }
        pool.close();
        res.send(result.recordset);
      },
    );
  });
});

router.route('/getStaffByBirthDate/:bdate').get((req, res, next) => {
  pool.connect(err => {
    if (err) res.sendStatus(400);

    const request = new sql.Request(pool);
    request.input('fio', sql.NVarChar, `%${req.params.fio}%`);
    request.query(
      `select наименование, датарождения
      from kadry1c.dbo.справочник_физическиелица
      where датарождения like @bdate
    `,
      (err, result) => {
        if (err) {
          logger.log('error', 'Get staff from Kadry1C error', {
            err
          });
          res.sendStatus(400);
        }
        pool.close();
        res.send(result.recordset);
      },
    );
  });
});

module.exports = router;