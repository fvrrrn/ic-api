const router = require('express').Router()
const sql = require('mssql')
const pool = require('../../../config/config_universityPROF').pool
const poolConnection = require('../../../config/config_universityPROF')
  .poolConnection
const { logger } = require('../../../lib/logger')

router.route('/teachers').get(async (req, res, next) => {
  await poolConnection
  try {
    const result = await pool.request().query(
      `select onec.oneccode, ateach.фио, ateach.категория, ateach.кафедра, ateach.стаж, ateach.ученаястепень
      from аср_преподаватели_с ateach
      left join vestra_код1с as onec on ateach.фио = onec.name`,
    )
    res.send(result.recordset)
  } catch (err) {
    logger.log('error', 'Get teachers error', {
      err,
    })
    res.sendStatus(400)
  }
})

router.route('/teachers/getById/:id').get(async (req, res, next) => {
  await poolConnection
  try {
    const result = await pool.request().input('id', sql.Int, req.params.id)
      .query(`
select top(1000) v.oneccode, t.фио, t.категория, t.кафедра, t.стаж, t.ученаястепень
from vestra_код1с v
left join аср_преподаватели_с t on t.фио = v.name
where v.oneccode = @id
`)
    res.send(result.recordset)
  } catch (err) {
    logger.log('error', 'Get teachers by id error', {
      err,
    })
    res.sendStatus(400)
  }
})

router.route('/teachers/getByFio/:fio').get(async (req, res, next) => {
  await poolConnection
  try {
    const result = await pool
      .request()
      .input('fio', sql.NVarChar, `%${req.params.fio}%`).query(`
select фио, категория, кафедра, стаж, ученаястепень
from аср_преподаватели_с 
where фио like @fio
`)
    res.send(result.recordset)
  } catch (err) {
    logger.log('error', 'Get teachers by id error', {
      err,
    })
    res.sendStatus(400)
  }
})

router.route('/teachers/getByBdate/:bdate').get(async (req, res, next) => {
  await poolConnection
  try {
    const result = await pool
      .request()
      .input('bdate', sql.NVarChar, `%${req.params.bdate}%`).query(`
select a.фио, iif(f.датарождения > getdate(), dateadd(year, -2000, f.датарождения), f.датарождения) as bdate, a.категория, a.кафедра, a.стаж, a.ученаястепень
from аср_преподаватели_с a, справочник_физическиелица f
where f.ссылка = a.физическоелицо_ссылка and (f.датарождения = @bdate or dateadd(year, -2000, f.датарождения) = @bdate)
`)
    res.send(result.recordset)
  } catch (err) {
    logger.log('error', 'Get teachers by id error', {
      err,
    })
    res.sendStatus(400)
  }
})

router.route('/teachers/getByFio/:fio/:bdate').get(async (req, res, next) => {
  await poolConnection
  try {
    const result = await pool
      .request()
      .input('fio', sql.NVarChar, `%${req.params.fio}%`)
      .input('bdate', sql.NVarChar, `%${req.params.bdate}%`).query(`
select фио, категория, кафедра, стаж, ученаястепень
from аср_преподаватели_с 
where фио like @fio
`)
    res.send(result.recordset)
  } catch (err) {
    logger.log('error', 'Get teachers by fio&date error', {
      err,
    })
    res.sendStatus(400)
  }
})

router.route('/students').get(async (req, res, next) => {
  await poolConnection
  try {
    const result = await pool.request().query(`
select top(1000) код_студента, наименование, дата_рождения, номер_зачетной_книжки from с_студенты_new_1
`)
    res.send(result.recordset)
  } catch (err) {
    logger.log('error', 'Get students error', {
      err,
    })
    res.sendStatus(400)
  }
})

router.route('/students/getById/:id').get(async (req, res, next) => {
  await poolConnection
  try {
    const result = await pool.request().input('id', sql.Int, req.params.id)
      .query(`
select код_студента, наименование, дата_рождения, номер_зачетной_книжки from с_студенты_new_1 where код_студента = @id
`)
    res.send(result.recordset)
  } catch (err) {
    console.log(err)
    logger.log('error', 'Get students by id error', {
      err,
    })
    res.sendStatus(400)
  }
})

router.route('/students/getByFio/:fio').get(async (req, res, next) => {
  await poolConnection
  try {
    const result = await pool
      .request()
      .input('fio', sql.NVarChar, `%${req.params.fio}%`).query(`
select код_студента, наименование, дата_рождения, номер_зачетной_книжки from с_студенты_new_1 where наименование like @fio
`)
    res.send(result.recordset)
  } catch (err) {
    logger.log('error', 'Get students by id error', {
      err,
    })
    res.sendStatus(400)
  }
})

router.route('/students/getByBdate/:bdate').get(async (req, res, next) => {
  await poolConnection
  try {
    const result = await pool
      .request()
      .input('fio', sql.NVarChar, `%${req.params.fio}%`).query(`
select код_студента, наименование, дата_рождения, номер_зачетной_книжки from с_студенты_new_1 where дата_рождения = @bdate
`)
    res.send(result.recordset)
  } catch (err) {
    logger.log('error', 'Get students by bdate error', {
      err,
    })
    res.sendStatus(400)
  }
})

router.route('/students/getByFio/:fio/:bdate').get(async (req, res, next) => {
  await poolConnection
  try {
    const result = await pool
      .request()
      .input('fio', sql.NVarChar, `%${req.params.fio}%`)
      .input('bdate', sql.NVarChar, `%${req.params.bdate}%`).query(`
select код_студента, наименование, дата_рождения, номер_зачетной_книжки from с_студенты_new_1 where наименование like @fio and дата_рождения = @bdate
`)
    res.send(result.recordset)
  } catch (err) {
    logger.log('error', 'Get students by bdate error', {
      err,
    })
    res.sendStatus(400)
  }
})

router.route('/students/getByNz/:nz').get(async (req, res, next) => {
  await poolConnection
  try {
    const result = await pool.request().input('nz', sql.NVarChar, req.params.nz)
      .query(`
select код_студента, наименование, дата_рождения, номер_зачетной_книжки from с_студенты_new_1 where номер_зачетной_книжки = @nz
`)
    res.send(result.recordset)
  } catch (err) {
    logger.log('error', 'Get students by id error', {
      err,
    })
    res.sendStatus(400)
  }
})

router.route('/groups').get(async (req, res, next) => {
  await poolConnection
  try {
    const result = await pool.request().input('nz', sql.NVarChar, req.params.nz)
      .query(`
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
`)
    let getGroups = result.recordset

    let i
    let groupsAll = []
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
        if (i + 1 >= getGroups.length || getGroups[i + 1].Caf !== cafNow) break
        else i++
      }
      groupsAll.push({
        caf: cafNow,
        courses: caf,
      })
    }
    res.send(groupsAll)
  } catch (err) {
    logger.log('error', 'Get groups error', { err })
    res.sendStatus(400)
  }
})

router.route('/groups/:group').get(async (req, res, next) => {
  await poolConnection
  try {
    const result = await pool
      .request()
      .input('group', sql.NVarChar, req.params.group).query(`
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
`)
    res.send(result.recordset)
  } catch (err) {
    logger.log('error', 'Get group info error', { err })
    res.sendStatus(400)
  }
})

router.route('/teacher/:fio').get(async (req, res, next) => {
  await poolConnection
  try {
    const result = await pool
      .request()
      .input('fio', sql.NVarChar, `%${req.params.fio}%`).query(`
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
`)
    res.send(result.recordset)
  } catch (err) {
    logger.log('error', 'Get group info error', { err })
    res.sendStatus(400)
  }
})

router.route('/IdFromOneC/:fio').get(async (req, res, next) => {
  await poolConnection
  try {
    const result = await pool
      .request()
      .input('fio', sql.NVarChar, `%${req.params.fio}%`).query(`
 SELECT *
        FROM [UniversityPROF].[dbo].[Vestra_Код1С]
        where [Name] like @fio
`)
    res.send(result.recordset)
  } catch (err) {
    logger.log('error', 'Get "Id from 1C" error', {
      err,
    })
    res.sendStatus(400)
  }
})

module.exports = router
