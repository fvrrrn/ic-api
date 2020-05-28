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

router.route('/applicants').get((req, res, next) => {
  const {
    year,
    doc_type,
    enroll_accepted,
    admission_type,
    spec,
    sponsorship_type,
    concurrency_type,
  } = req.body
  pool.connect((err) => {
    if (err) {
      console.log(err)
      res.sendStatus(400)
    }

    const request = new sql.Request(pool)
    request.query(
      `select top(100)
      docs.code1C
     ,docs.surname
     ,docs.name
     ,docs.patronymic
     ,docs.extra_score
     ,docs.doc_type
     ,docs.enroll_accepted
     ,docs.priveleged
     ,docs.dorm_required
     ,docs.date_applied
     ,docs.spec
     ,docs.sponsorship_type
--      ,docs.status
     ,(0 + isnull(docs.[Английский язык], 0) + isnull(docs.Биология, 0) + isnull(docs.География, 0) + isnull(docs.[Информатика и ИКТ], 0) + isnull(docs.История, 0) + isnull(docs.Литература, 0) + isnull(docs.Математика, 0) + isnull(docs.Обществознание, 0)+ isnull(docs.[Русский язык], 0) + isnull(docs.Физика, 0) + isnull(docs.Химия, 0)) ege_all
     ,cast(isnull(docs.[Русский язык], 0) as int) ege_rus, cast(isnull(docs.Математика, 0) as int) ege_mat,cast(isnull(docs.[Информатика и ИКТ], 0) as int) ege_inf,cast(isnull(docs.Физика, 0) as int) ege_fiz,cast(isnull(docs.Обществознание, 0) as int) ege_obs,cast(isnull(docs.История, 0) as int) ege_ist,cast(isnull(docs.[Английский язык], 0) as int) ege_ang,cast(isnull(docs.Литература, 0) as int) ege_lit,cast(isnull(docs.Биология, 0) as int) ege_bio,cast(isnull(docs.Химия, 0) as int) ege_him,cast(isnull(docs.География, 0) as int) ege_geo
       from (SELECT
    fiz.Код code1C
    ,fiz.Фамилия surname
    ,fiz.Имя name
    ,fiz.Отчество patronymic
    ,isnull(ot_dost.Наименование, 0) extra_score
    ,iif(np.ВидДокумента_Ссылка = 0x8BAD2D90F32DA6BF4DE0752D2C86A672, 'Копия', 'Оригинал') doc_type
    ,perecSoglName.EnumValue enroll_accepted
    ,iif(kp.Наименование = 'Имеющие особое право', 1, 0) priveleged
    ,iif(zaya.НеобходимостьВОбщежитии = 0x00, 'Нет', 'Да') dorm_required
    ,iif(year(zaya.Дата) > year(getdate()), dateadd(year, -2000, zaya.Дата), zaya.Дата) date_applied
    ,spec.Наименование spec
    ,op.Наименование sponsorship_type
    ,kon.Наименование concurrency_type
    ,kp.Наименование admission_type
    ,urov.Наименование degree_type
    ,dis.Наименование Предмет
    ,ot.Наименование БаллЕГЭ
--     ,perecSostName.EnumValue status
FROM Справочник_ФизическиеЛица fiz
         LEFT JOIN РегистрСведений_СостояниеЗаявленийПоступающих sostZaya on fiz.Ссылка = sostZaya.ФизическоеЛицо_Ссылка
         LEFT JOIN Справочник_КонкурсныеГруппы kon on sostZaya.КонкурснаяГруппа_Ссылка = kon.Ссылка
         LEFT JOIN Справочник_УровеньПодготовки urov on kon.УровеньПодготовки_Ссылка = urov.Ссылка
         LEFT JOIN Документ_СвидетельствоЕГЭ ege on ege.ФизическоеЛицо_Ссылка = fiz.Ссылка
         LEFT JOIN Документ_СвидетельствоЕГЭ_РезультатыЕГЭ res on res.Ссылка = ege.Ссылка
         inner JOIN Справочник_Дисциплины dis on res.Предмет_Ссылка = dis.Ссылка
         LEFT JOIN Справочник_Отметки ot on res.Балл_Ссылка = ot.Ссылка
         LEFT JOIN Документ_УчетДостиженийАбитуриентов dost on dost.ФизическоеЛицо_Ссылка = fiz.Ссылка
         LEFT JOIN Документ_УчетДостиженийАбитуриентов_Достижения res_dost on dost.Ссылка = res_dost.Ссылка
         LEFT JOIN Справочник_Отметки ot_dost on res_dost.Балл_Ссылка = ot_dost.Ссылка
         LEFT JOIN Справочник_Специальности spec on spec.Ссылка = kon.Специальность_Ссылка
         LEFT JOIN Перечисление_СостоянияЗаявленийПоступающих perecSost on perecSost.Ссылка = sostZaya.Состояние_Ссылка
         LEFT JOIN п_СостоянияЗаявленийПоступающих perecSostName on perecSostName.EnumOrder = perecSost.Порядок
         left JOIN РегистрСведений_СогласияНаЗачисление sogl on sogl.ФизическоеЛицо_Ссылка = fiz.Ссылка
         left JOIN Перечисление_СостоянияСогласийНаЗачисление perecSogl on perecSogl.Ссылка = sogl.Состояние_Ссылка
         inner JOIN п_СостоянияСогласийНаЗачисление perecSoglName on perecSoglName.EnumOrder = perecSogl.Порядок
inner join
    (select ФизическоеЛицо_Ссылка
                , max(Дата) Дата
                , max(НеобходимостьВОбщежитии) НеобходимостьВОбщежитии
                , max(Ссылка) Ссылка
            from Документ_ЗаявлениеПоступающего
            group by ФизическоеЛицо_Ссылка)
    zaya on zaya.ФизическоеЛицо_Ссылка = fiz.Ссылка
inner join Документ_ЗаявлениеПоступающего_НаправленияПодготовки np on np.Ссылка = zaya.Ссылка
inner join dbo.Справочник_ОснованияПоступления op on np.ОснованиеПоступления_Ссылка = op.Ссылка
inner join dbo.Справочник_КатегорииПриема kp on np.КатегорияПриема_Ссылка = kp.Ссылка
where urov.Наименование in ('Бакалавр')
group by fiz.Код
       , fiz.Фамилия
       , fiz.Имя
       , fiz.Отчество
       , spec.Наименование
       , op.Наименование
       , kon.Наименование
       , kp.Наименование
       , urov.Наименование
       , isnull(ot_dost.Наименование, 0)
       , perecSoglName.EnumValue
       , iif(kp.Наименование = 'Имеющие особое право', 1, 0)
       , iif(zaya.НеобходимостьВОбщежитии = 0x00, 'Нет', 'Да')
       , zaya.Дата
       , ot.Наименование
       , dis.Наименование
       , iif(np.ВидДокумента_Ссылка = 0x8BAD2D90F32DA6BF4DE0752D2C86A672, 'Копия', 'Оригинал')
--        , perecSostName.EnumValue
           ) d
    pivot
                  (
                  max(d.БаллЕГЭ)
                  for d.Предмет in ([Английский язык],БИОГЕОГРАФИЯ,Биология,География,Информатика,[Информатика и ИКТ],История,Литература,Математика,[Математическая логика и теория алгоритмов],Обществознание,[Русский язык],Физика,Химия)
                  ) docs
where
      year(docs.date_applied) = ${!year ? '2019' : year}
      and docs.spec = ${!spec ? 'docs.spec' : spec}
      and docs.sponsorship_type = ${
        !sponsorship_type ? 'docs.sponsorship_type' : sponsorship_type
      }
      and docs.concurrency_type = ${
        !concurrency_type ? 'docs.concurrency_type' : concurrency_type
      }
      and docs.admission_type = ${
        !admission_type ? 'docs.admission_type' : admission_type
      }
      and docs.doc_type =  ${!doc_type ? 'docs.doc_type' : doc_type}
      and docs.enroll_accepted = ${
        !enroll_accepted ? 'docs.enroll_accepted' : enroll_accepted
      }
order by docs.spec, ege_all
  `,
      (err, result) => {
        if (err) {
          console.log(err)
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

router.route('/doctypes').get((req, res, next) => {
  res.send(['Копия', 'Оригинал'])
})

router.route('/enroll_types').get((req, res, next) => {
  res.send(['Подано', 'Отозвано'])
})

router.route('/concurrency_categories').get((req, res, next) => {
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.query(
      `select distinct Наименование from Справочник_КонкурсныеГруппы`,
      (err, result) => {
        if (err) {
          loggerPriem.log('error', 'Get concurrency_types error', {
            err,
          })
          res.sendStatus(400)
        }

        pool.close()
        const tmp = []
        for (e of result.recordset) {
          tmp.push(e['Наименование'])
        }
        res.send(tmp)
      },
    )
  })
})

router.route('/sponsorship_types').get((req, res, next) => {
  res.send(['Бюджетная основа', 'Полное возмещение затрат', 'Целевой прием'])
})

router.route('/admission_types').get((req, res, next) => {
  res.send([
    'Без вступительных испытаний',
    'Имеющие особое право',
    'На общих основаниях',
  ])
})

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

router.route('/applicants_obsolete').get((req, res, next) => {
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

module.exports = router
