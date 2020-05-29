const router = require('express').Router()
const sql = require('mssql')
const pool = require('../../../config/config_universityPROF')
const { logger } = require('../../../lib/logger')

router.route('/teachers').get((req, res, next) => {
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.query(
      `
      select onec.oneccode, ateach.фио, ateach.категория, ateach.кафедра, ateach.стаж, ateach.ученаястепень
      from аср_преподаватели_с ateach
      left join vestra_код1с as onec on ateach.фио = onec.name
      `,
      (err, result) => {
        if (err) {
          logger.log('error', 'Get teachers error', {
            err,
          })
          res.sendStatus(400)
        }

        pool.close()
        res.send(result.recordset)
      },
    )
  })
})

router.route('/teachers/getById/:id').get((req, res, next) => {
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.input('id', sql.NVarChar, req.params.id)
    request.query(
      `
      select top(100) v.oneccode, t.фио, t.категория, t.кафедра, t.стаж, t.ученаястепень
      from vestra_код1с v
      left join аср_преподаватели_с t on t.фио = v.name
      where v.oneccode = @id
      `,
      (err, result) => {
        if (err) {
          logger.log('error', 'Get teachers by id error', {
            err,
          })
          res.sendStatus(400)
        }

        pool.close()
        res.send(result.recordset)
      },
    )
  })
})

router.route('/teachers/getByFio/:fio').get((req, res, next) => {
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.input('fio', sql.NVarChar, `%${req.params.fio}%`)
    request.query(
      `
      select фио, категория, кафедра, стаж, ученаястепень
      from аср_преподаватели_с 
      where фио like @fio
      `,
      (err, result) => {
        if (err) {
          logger.log('error', 'Get teachers by fio error', {
            err,
          })
          res.sendStatus(400)
        }

        pool.close()
        res.send(result.recordset)
      },
    )
  })
})

router.route('/teachers/getByBdate/:bdate').get((req, res, next) => {
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.input('bdate', sql.NVarChar, `%${req.params.bdate}%`)
    request.query(
      `
      select a.фио, iif(f.датарождения > getdate(), dateadd(year, -2000, f.датарождения), f.датарождения) as bdate, a.категория, a.кафедра, a.стаж, a.ученаястепень
      from аср_преподаватели_с a, справочник_физическиелица f
      where f.ссылка = a.физическоелицо_ссылка and (f.датарождения = @bdate or dateadd(year, -2000, f.датарождения) = @bdate)
      `,
      (err, result) => {
        if (err) {
          logger.log('error', 'Get teachers by date error', {
            err,
          })
          res.sendStatus(400)
        }

        pool.close()
        res.send(result.recordset)
      },
    )
  })
})

router.route('/teachers/getByFio/:fio/:bdate').get((req, res, next) => {
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.input('fio', sql.NVarChar, `%${req.params.fio}%`)
    request.input('bdate', sql.NVarChar, `%${req.params.bdate}%`)
    request.query(
      `
      select a.фио, iif(f.датарождения > getdate(), dateadd(year, -2000, f.датарождения), f.датарождения) as bdate, a.категория, a.кафедра, a.стаж, a.ученаястепень
      from аср_преподаватели_с a, справочник_физическиелица f
      where f.ссылка = a.физическоелицо_ссылка and (f.датарождения = @bdate or dateadd(year, -2000, f.датарождения) = @bdate) and a.фио like @fio
      `,
      (err, result) => {
        if (err) {
          logger.log('error', 'Get teachers by fio&date error', {
            err,
          })
          res.sendStatus(400)
        }

        pool.close()
        res.send(result.recordset)
      },
    )
  })
})

router.route('/students').get((req, res, next) => {
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.query(
      `select top(1000) код_студента, наименование, дата_рождения, номер_зачетной_книжки from с_студенты_new_1`,
      (err, result) => {
        if (err) {
          logger.log('error', 'Get students error', {
            err,
          })
          res.sendStatus(400)
        }

        pool.close()
        res.send(result.recordset)
      },
    )
  })
})

router.route('/students/getById/:id').get((req, res, next) => {
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.input('id', sql.Int, req.params.id)
    request.query(
      `select код_студента, наименование, дата_рождения, номер_зачетной_книжки from с_студенты_new_1 where код_студента = @id`,
      (err, result) => {
        if (err) {
          logger.log('error', 'Get students by id error', {
            err,
          })
          res.sendStatus(400)
        }

        pool.close()
        res.send(result.recordset)
      },
    )
  })
})

router.route('/students/getByFio/:fio').get((req, res, next) => {
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.input('fio', sql.NVarChar, `%${req.params.fio}%`)
    request.query(
      `select код_студента, наименование, дата_рождения, номер_зачетной_книжки from с_студенты_new_1 where наименование like @fio`,
      (err, result) => {
        if (err) {
          logger.log('error', 'Get students by fio error', {
            err,
          })
          res.sendStatus(400)
        }

        pool.close()
        res.send(result.recordset)
      },
    )
  })
})

router.route('/students/getByBdate/:bdate').get((req, res, next) => {
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.input('bdate', sql.NVarChar, `%${req.params.bdate}%`)
    request.query(
      `select код_студента, наименование, дата_рождения, номер_зачетной_книжки from с_студенты_new_1 where дата_рождения = @bdate`,
      (err, result) => {
        if (err) {
          logger.log('error', 'Get students by bdate error', {
            err,
          })
          res.sendStatus(400)
        }

        pool.close()
        res.send(result.recordset)
      },
    )
  })
})

router.route('/students/getByFio/:fio/:bdate').get((req, res, next) => {
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.input('fio', sql.NVarChar, `%${req.params.fio}%`)
    request.input('bdate', sql.NVarChar, `%${req.params.bdate}%`)
    request.query(
      `select код_студента, наименование, дата_рождения, номер_зачетной_книжки from с_студенты_new_1 where наименование like @fio and дата_рождения = @bdate`,
      (err, result) => {
        if (err) {
          logger.log('error', 'Get students by fio&bdate error', {
            err,
          })
          res.sendStatus(400)
        }

        pool.close()
        res.send(result.recordset)
      },
    )
  })
})

router.route('/students/getByNz/:nz').get((req, res, next) => {
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.input('nz', sql.NVarChar, req.params.nz)
    request.query(
      `select код_студента, наименование, дата_рождения, номер_зачетной_книжки from с_студенты_new_1 where номер_зачетной_книжки = @nz`,
      (err, result) => {
        if (err) {
          logger.log('error', 'Get students by id error', {
            err,
          })
          res.sendStatus(400)
        }

        pool.close()
        res.send(result.recordset)
      },
    )
  })
})

router.route('/groups').get((req, res, next) => {
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.query(
      `
      SELECT distinct [Caf], [Group]
      FROM (
		Select Case 
			when [Facutet] is null THEN 'Не указана'
			ELSE [Facutet]
			END as [Caf], [_Group] as [Group]
		From [UniASR].[dbo].[аср_Расписание]
		where GETDATE() between DATEADD(YEAR, -2000, DATEADD(DAY, -30, [start])) and DATEADD(YEAR, -2000, DATEADD(DAY, 60, [finish]))
	  ) as r
	order by [Caf], [Group]
    `,
      (err, result) => {
        if (err) {
          logger.log('error', 'Get groups error', {
            err,
          })
          res.sendStatus(400)
        }

        let getGroups = result.recordset

        let i
        let groupsAll = []
        try {
          for (i = 0; i < getGroups.length; i++) {
            let caf = []
            let cafNow = getGroups[i].Caf
            while (true) {
              let course = getGroups[i].Group.slice(0, 1)
              let groups = []
              while (true) {
                groups.push({
                  group: getGroups[i].Group,
                })
                if (
                  i + 1 >= getGroups.length ||
                  getGroups[i + 1].Group.slice(0, 1) !== course
                )
                  break
                else i++
              }
              caf.push({
                course,
                groups,
              })
              if (i + 1 >= getGroups.length || getGroups[i + 1].Caf !== cafNow)
                break
              else i++
            }
            groupsAll.push({
              caf: cafNow,
              courses: caf,
            })
          }
          pool.close()
          res.send(groupsAll)
        } catch (err) {
          res.sendStatus(400)
        }
      },
    )
  })
})

router.route('/groups/:group').get((req, res, next) => {
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.input('group', sql.NVarChar, req.params.group)
    request.query(
      `
      SELECT [Код] as code
        ,[Полное_Имя] as fio
        ,[Фамилия] as surname
        ,[Имя] as name
        ,[Отчество] as patronymic
        ,[Дата_Рождения] as birth
        ,[Пол] as sex
        ,[Форма_Обучения] as form
        ,[Факультет] as faculty
        ,[Направление] as dir
        ,[Профиль] as profile
        ,[Курс] as course
        ,[Группа] as [group]
        ,[Статус] as status
        ,[Основа] as basis
        ,[Вид_Образования] as form
        ,[Уровень_Подготовки] as level
        ,[Учебный_Год] as year
      FROM [UniversityPROF].[dbo].[су_ИнформацияОСтудентах]
      where [Группа] = @group
        and [Статус] = 'Является студентом'
      order by fio
    `,
      (err, result) => {
        if (err) {
          logger.log('error', 'Get group info error', { err })
          res.sendStatus(400)
        }

        logger.log('info', 'Get group info success', {
          result: req.params.group,
        })

        pool.close()
        res.send(result.recordset)
      },
    )
  })
})

router.route('/teacher/:fio').get((req, res, next) => {
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.input('fio', sql.NVarChar, req.params.fio)
    request.query(
      `
      SELECT [ФизическоеЛицо_Ссылка] as id
        ,[ФИО] as fio
        ,[УченаяСтепень] as degree
        ,[УченоеЗвание] as title
        ,[Кафедра] as caf
        ,[Должность] as position
        ,[Стаж] as [exp]
      FROM [UniversityPROF].[dbo].[су_СписокППС]
      where [ФИО] = @fio
      order by exp desc
    `,
      (err, result) => {
        if (err) {
          logger.log('error', 'Get teacher info error', { err })
          res.sendStatus(400)
        }

        logger.log('info', 'Get teacher info success', {
          result: req.params.fio,
        })

        pool.close()
        res.send(result.recordset)
      },
    )
  })
})

router.route('/IdFromOneC/:fio').get((req, res, next) => {
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.input('fio', sql.NVarChar, `%${req.params.fio}%`)
    request.query(
      `
      SELECT *
        FROM [UniversityPROF].[dbo].[Vestra_Код1С]
        where [Name] like @fio
    `,
      (err, result) => {
        if (err) {
          logger.log('error', 'Get "Id from 1C" error', {
            err,
          })
          res.sendStatus(400)
        }

        pool.close()
        res.send(result.recordset)
      },
    )
  })
})

module.exports = router
