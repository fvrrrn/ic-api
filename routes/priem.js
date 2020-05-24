const router = require('express').Router()
const sql = require('mssql')
const pool = require('../config/config_universityPROF')
const { loggerPriem } = require('../lib/logger')

const getSpecialityInfo = (req, res, year) => {
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.input('code', sql.NVarChar, req.params.code)
    request.query(
      `
      SELECT [КонкурснаяГруппа] as [group]
        ,[ФормаОбучения] as [form]
        ,[УровеньПодготовки] as [level]
        ,[ОснованиеПоступления] as [osnov]
        ,[Специальность] as [spec]
        ,[КодСпециальности] as [code]
        ,[КоличествоМест] as [places]
      FROM [UniversityPROF].[dbo].[Vestra_прием_ПланыНабора_${year}]
      where [КодСпециальности] = @code and [КоличествоМест] != 0
      order by [КоличествоМест] desc
    `,
      (err, result) => {
        if (err) {
          loggerPriem.log('error', 'Get speciality info error', {
            err,
          })
          res.sendStatus(400)
        }

        loggerPriem.log('info', 'Get speciality info success', {
          result: req.params.code,
        })

        pool.close()
        res.send(result.recordset)
      },
    )
  })
}

router.route('/specialities').get((req, res, next) => {
  let year = getYearForCurrentSpecialities()
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.query(
      `
      SELECT distinct [Специальность] as spec
      ,[КодСпециальности] as code
      ,[Всего] as allZaya
      ,[Оригинал] as origZaya
      FROM [UniversityPROF].[dbo].[Vestra_прием_ПланыНабора_${year}]
      where [УровеньПодготовки] != 'Магистр'
      order by [Специальность]
    `,
      (err, result) => {
        if (err) {
          loggerPriem.log('error', 'Get specialities error', {
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

router.route('/specialities/info/:code').get((req, res, next) => {
  return getSpecialityInfo(req, res, getYearForCurrentSpecialities())
})

router.route('/specialities/people/:code').get((req, res, next) => {
  let year = getYearForCurrentSpecialities()

  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.input('code', sql.NVarChar, req.params.code)
    request.query(
      `
      Select [fio]
        ,[konkursGroup]
        ,[code]
        ,[indiv]
        ,sum([ege]) as [ege]
        ,[indiv] + sum([ege]) as [sum]
        FROM
      (SELECT docs.[Наименование] as [fio]
            ,docs.[КонкурснаяГруппа] as [konkursGroup]
            ,docs.[КодСпециальности] as [code]
          ,CASE WHEN docs.[БаллИндивидуальноеДостижение] is null THEN 0 ELSE docs.[БаллИндивидуальноеДостижение] END as [indiv]
          ,docs.[Предмет] as [pred]
          ,max(cast(docs.[БаллЕГЭ] as INT)) as [ege]
        FROM [UniversityPROF].[dbo].[Vestra_прием_ПоданныеДокументы_${year}] as docs
        INNER JOIN [UniversityPROF].[dbo].[Vestra_прием_ПредметыВКонкурснойГруппе_${year}] as pred on pred.[КонкурснаяГруппа] = docs.[КонкурснаяГруппа] and pred.[Предмет] = docs.[Предмет]
        where docs.[УровеньПодготовки] in ('Бакалавр','Специалист','Академический бакалавр','Прикладной бакалавр') and docs.[СостояниеАбитуриента] = 'Зачислен' and docs.[ЕГЭДействительно] = 'Да' and docs.[КодСпециальности] = @code
        GROUP BY docs.[Наименование],
            docs.[КонкурснаяГруппа],
            docs.[КодСпециальности],
            docs.[БаллИндивидуальноеДостижение],
            docs.[Предмет]
            ) as sumDiffEge
        GROUP BY [fio],
            [konkursGroup],
            [code],
            [indiv]
        ORDER BY [sum] desc
    `,
      (err, result) => {
        if (err) {
          loggerPriem.log('error', 'Get speciality people error', {
            err,
          })
          res.sendStatus(400)
        }

        loggerPriem.log('info', 'Get speciality people success', {
          result: req.params.code,
        })

        pool.close()
        res.send(result.recordset)
      },
    )
  })
})

router.route('/newSpecialities').get((req, res, next) => {
  //вставляешь селект сюда
  // ладно попробую сяп)
  //давай, удачи)
  if (!admissionCommitteeInProcess())
    return res.send('AdmissionCommitteeHasNotStarted')
  let year = getCurrentDate().year

  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.query(
      `
      SELECT [Специальность] as spec, SUM([Всего]) as numberOfApplications, SUM([Оригинал]) as numberOfOriginals, [КодСпециальности] as code
      FROM [UniversityPROF].[dbo].[Vestra_прием_ПланыНабора_2019]
	    Group by [Специальность], [КодСпециальности]
	    Order by spec
    `,
      (err, result) => {
        if (err) {
          loggerPriem.log('error', 'Get specialities error', {
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
router.route('/newSpecialities/info/:code').get((req, res, next) => {
  if (!admissionCommitteeInProcess())
    return res.send('AdmissionCommitteeHasNotStarted')
  return getSpecialityInfo(req, res, getCurrentDate().year)
})

router.route('/newSpecialities/people/:code').get((req, res, next) => {
  if (!admissionCommitteeInProcess())
    res.send('AdmissionCommitteeHasNotStarted')
  let year = getCurrentDate().year
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.input('code', sql.NVarChar, req.params.code)
    request.query(
      `
      Select 
      [id],
      [fio]
        ,[konkursGroup]
        ,[code]
        ,[indiv]
        ,sum([ege]) as [ege]
        ,[indiv] + sum([ege]) as [sum]
        ,[credited]
        ,[documentType]
        FROM
      (SELECT docs.[Наименование] as [fio]
            ,docs.[Код] as [id]
            ,docs.[КонкурснаяГруппа] as [konkursGroup]
            ,docs.[КодСпециальности] as [code]
            ,CASE WHEN docs.[СостояниеАбитуриента] = 'Зачислен' THEN 'true' ELSE 'false' END as [credited]
          ,CASE WHEN docs.[БаллИндивидуальноеДостижение] is null THEN 0 ELSE docs.[БаллИндивидуальноеДостижение] END as [indiv]
          ,docs.[Предмет] as [pred]
          ,max(CASE WHEN docs.[БаллЕГЭ] IS NULL THEN 0 ELSE docs.[БаллЕГЭ] END) as [ege]          
          ,docs.[ВидДокумента] as [documentType]
        FROM [UniversityPROF].[dbo].[Vestra_прием_ПоданныеДокументы_${year}] as docs
        LEFT JOIN [UniversityPROF].[dbo].[Vestra_прием_ПредметыВКонкурснойГруппе_${year}] as pred on pred.[КонкурснаяГруппа] = docs.[КонкурснаяГруппа] and pred.[Предмет] = docs.[Предмет]
        where docs.[УровеньПодготовки] in ('Бакалавр','Специалист','Академический бакалавр','Прикладной бакалавр') and docs.[СостояниеАбитуриента] in ('Подано','Зачислен') and docs.[КодСпециальности] = @code
        GROUP BY docs.[Код],
            docs.[Наименование],
            docs.[КонкурснаяГруппа],
            docs.[КодСпециальности],
            docs.[БаллИндивидуальноеДостижение],
            docs.[Предмет],
            docs.[СостояниеАбитуриента],
            docs.[ВидДокумента]
            ) as sumDiffEge
        GROUP BY [id],
            [fio],
            [konkursGroup],
            [code],
            [indiv],
            [credited],
            [documentType]
        ORDER BY [sum] desc
    `,
      (err, result) => {
        if (err) {
          loggerPriem.log('error', 'Get speciality people error', {
            err,
          })
          res.sendStatus(400)
        }

        loggerPriem.log('info', 'Get speciality people success', {
          result: req.params.code,
        })

        pool.close()
        res.send(result.recordset)
      },
    )
  })
})

router.route('/people').get((req, res, next) => {
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.query(
      `select
          docs.Код code1C
          ,docs.Наименование fio
          ,(0 + isnull(docs.[Английский язык], 0) + isnull(docs.[Биология], 0) + isnull(docs.[География], 0) + isnull(docs.[Информатика и ИКТ], 0) + isnull(docs.[История], 0) + isnull(docs.[Литература], 0) + isnull(docs.[Математика], 0) + isnull(docs.[Обществознание], 0)+ isnull(docs.[Русский язык], 0) + isnull(docs.[Физика], 0) + isnull(docs.[Химия], 0)) ege_all
          ,cast(isnull(docs.[Русский язык], 0) as int) ege_rus, cast(isnull(docs.[Математика], 0) as int) ege_mat,cast(isnull(docs.[Информатика и ИКТ], 0) as int) ege_inf,cast(isnull(docs.[Физика], 0) as int) ege_fiz,cast(isnull(docs.[Обществознание], 0) as int) ege_obs,cast(isnull(docs.[История], 0) as int) ege_ist,cast(isnull(docs.[Английский язык], 0) as int) ege_ang,cast(isnull(docs.[Литература], 0) as int) ege_lit,cast(isnull(docs.[Биология], 0) as int) ege_bio,cast(isnull(docs.[Химия], 0) as int) ege_him,cast(isnull(docs.[География], 0) as int) ege_geo
          ,cast(isnull(docs.[БаллИндивидуальноеДостижение], 0) as int) indiv
          ,docs.ВидДокумента doctype
          ,iif(docs.ПоданоСогласиеНаЗачисление = 'Подано', 1, 0) agrees_enroll
          ,iif(docs.КатегорияПриема = 'На общих основаниях', 1, 0) has_privelege
          ,iif(year(docs.ДатаЗаявления) > year(getdate()), dateadd(year, -2000, docs.ДатаЗаявления), docs.ДатаЗаявления)  date_applied
          ,docs.Специальность spec
          ,docs.ОснованиеПоступления osnovanie
          ,docs.КонкурснаяГруппа concurrent_group
          ,docs.КатегорияПриема priem_category
      from (
          select  priem.Код, priem.Наименование, priem.Специальность, priem.КонкурснаяГруппа, priem.ВидДокумента, priem.ДатаЗаявления, priem.КатегорияПриема, priem.ОснованиеПоступления, priem.НуждаемостьВОбщежитии, priem.УровеньПодготовки, priem.Предмет, priem.БаллЕГЭ, priem.БаллИндивидуальноеДостижение, priem.КодСпециальности, priem.СостояниеАбитуриента, priem.ПоданоСогласиеНаЗачисление
          from Vestra_прием_ПоданныеДокументы_2019 priem
      ) d
      pivot
      (
          max(d.БаллЕГЭ)
          for d.Предмет in ([Английский язык],[БИОГЕОГРАФИЯ],[Биология],[География],[Информатика],[Информатика и ИКТ],[История],[Литература],[Математика],[Математическая логика и теория алгоритмов],[Обществознание],[Русский язык],[Физика],[Химия])
      ) docs
    `,
      (err, result) => {
        if (err) {
          loggerPriem.log('error', 'Get people error', {
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

function getCurrentDate() {
  let currentTime = new Date()
  return {
    month: currentTime.getMonth() + 1,
    day: currentTime.getDate(),
    year: currentTime.getFullYear(),
  }
}

//возврящает true, когда приемка работает (с 20 июня по 1 ноября)
function admissionCommitteeInProcess() {
  return true
  let currentDate = getCurrentDate()
  if (currentDate.month < 6 || currentDate.month > 11) return false
  if (currentDate.month == 6 && currentDate.day < 20) return false
  if (currentDate.month == 11 && currentDate.day > 1) return false
  return true
}

//возврящает предыдущий год до тех пор, пока не закончится приемка (1 ноября)
function getYearForCurrentSpecialities() {
  let currentDate = getCurrentDate()
  if (currentDate.month < 11) return currentDate.year - 1
  if (currentDate.month == 11 && currentDate.day <= 1)
    return currentDate.year - 1
  return currentDate.year
}

router.route('/applicants').get((req, res, next) => {
  if (!admissionCommitteeInProcess())
    res.send('AdmissionCommitteeHasNotStarted')
  let year = getCurrentDate().year
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.query(
      `
      Select distinct [fio],
        [id]
        FROM
      (SELECT docs.[Наименование] as [fio]
            ,docs.[Код] as [id]
            ,docs.[КонкурснаяГруппа] as [konkursGroup]
            ,CASE WHEN docs.[СостояниеАбитуриента] = 'Зачислен' THEN 'true' ELSE 'false' END as [credited]
          ,docs.[Предмет] as [pred]
          ,max(CASE WHEN docs.[БаллЕГЭ] IS NULL THEN 0 ELSE docs.[БаллЕГЭ] END) as [ege]
        FROM [UniversityPROF].[dbo].[Vestra_прием_ПоданныеДокументы_${year}] as docs
        LEFT JOIN [UniversityPROF].[dbo].[Vestra_прием_ПредметыВКонкурснойГруппе_${year}] as pred on pred.[КонкурснаяГруппа] = docs.[КонкурснаяГруппа] and pred.[Предмет] = docs.[Предмет]
        where docs.[УровеньПодготовки] in ('Бакалавр','Специалист','Академический бакалавр','Прикладной бакалавр') and docs.[СостояниеАбитуриента] in ('Подано','Зачислен')
        GROUP BY docs.[Код],
            docs.[Наименование],
            docs.[КонкурснаяГруппа],
            docs.[Предмет],
            docs.[СостояниеАбитуриента]
            ) as sumDiffEge
        ORDER BY [fio]
    `,
      (err, result) => {
        if (err) {
          loggerPriem.log('error', 'Get specialities error', {
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

router.route('/applicants/info/:id').get((req, res, next) => {
  if (!admissionCommitteeInProcess())
    res.send('AdmissionCommitteeHasNotStarted')
  let year = getCurrentDate().year
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)

    request.input('id', sql.NVarChar, req.params.id)
    request.query(
      `
      Select [fio]
        ,[konkursGroup]
        ,[code]
        ,[indiv]
        ,sum([ege]) as [ege]
        ,[indiv] + sum([ege]) as [sum]
        ,[credited]
        ,[documentType]
        FROM
      (SELECT docs.[Наименование] as [fio]
            ,docs.[КонкурснаяГруппа] as [konkursGroup]
            ,docs.[КодСпециальности] as [code]
            ,CASE WHEN docs.[СостояниеАбитуриента] = 'Зачислен' THEN 'true' ELSE 'false' END as [credited]
          ,CASE WHEN docs.[БаллИндивидуальноеДостижение] is null THEN 0 ELSE docs.[БаллИндивидуальноеДостижение] END as [indiv]
          ,docs.[Предмет] as [pred]
          ,max(CASE WHEN docs.[БаллЕГЭ] IS NULL THEN 0 ELSE docs.[БаллЕГЭ] END) as [ege]
          ,docs.[ВидДокумента] as [documentType]
        FROM [UniversityPROF].[dbo].[Vestra_прием_ПоданныеДокументы_${year}] as docs
        LEFT JOIN [UniversityPROF].[dbo].[Vestra_прием_ПредметыВКонкурснойГруппе_${year}] as pred on pred.[КонкурснаяГруппа] = docs.[КонкурснаяГруппа] and pred.[Предмет] = docs.[Предмет]
        where docs.[УровеньПодготовки] in ('Бакалавр','Специалист','Академический бакалавр','Прикладной бакалавр') and docs.[СостояниеАбитуриента] in ('Подано','Зачислен') and docs.[Код] = @id
        GROUP BY docs.[Наименование],
            docs.[КонкурснаяГруппа],
            docs.[КодСпециальности],
            docs.[БаллИндивидуальноеДостижение],
            docs.[Предмет],
            docs.[СостояниеАбитуриента],
            docs.[ВидДокумента]
            ) as sumDiffEge
        GROUP BY [fio],
            [konkursGroup],
            [code],
            [indiv],
            [credited],
            [documentType]
        ORDER BY [sum] desc
    `,
      (err, result) => {
        if (err) {
          loggerPriem.log('error', 'Get specialities error', {
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
