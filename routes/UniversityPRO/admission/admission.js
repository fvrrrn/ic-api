const router = require('express').Router()
const sql = require('mssql')
const pool = require('../../../config/config_universityPROF')
const {loggerPriem} = require('../../../lib/logger')

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
    let {
        year = '2019',
        code1C = 'docs.code1C',
        is_doc_original = 'docs.is_doc_original',
        enroll_accepted = 'docs.enroll_accepted',
        dorm_required = 'docs.dorm_required',
        privileged = 'docs.privileged',
        spec_id = 'docs.spec_id',
        status_id = 'docs.status_id',
        ege_subject_id = 'docs.ege_subject_id',
        degree_type_id = 'docs.degree_type_id',
        admission_type_id = 'docs.admission_type_id',
        concurrency_type_id = 'docs.concurrency_type_id',
        sponsorship_type_id = 'docs.sponsorship_type_id',
    } = req.body
    if (!(is_doc_original === 'docs.is_doc_original')) {
        is_doc_original = is_doc_original === 'true' ? 1 : 0
    }
    if (!(dorm_required === 'docs.dorm_required')) {
        dorm_required = dorm_required === 'true' ? 1 : 0
    }
    if (!(enroll_accepted === 'docs.enroll_accepted')) {
        enroll_accepted = enroll_accepted === 'true' ? 1 : 0
    }
    if (!(privileged === 'docs.privileged')) {
        privileged = privileged === 'true' ? 1 : 0
    }
    pool.connect((err) => {
        if (err) {
            console.log(err)
            res.sendStatus(400)
        }

        const request = new sql.Request(pool)
        request.query(
            `select * from (SELECT top(50)
    fiz.Код code1C
     ,fiz.Фамилия surname
     ,fiz.Имя name
     ,fiz.Отчество patronymic
     ,isnull(ot_dost.Наименование, 0) extra_score
     ,iif(np.ВидДокумента_Ссылка = 0x8BAD2D90F32DA6BF4DE0752D2C86A672, 0, 1) is_doc_original
     ,iif(perecSoglName.EnumValue = 'Подано', 1, 0) enroll_accepted
     ,iif(kp.Наименование = 'Имеющие особое право', 1, 0) privileged
     ,iif(zaya.НеобходимостьВОбщежитии = 0x00, 0, 1) dorm_required
     ,iif(year(zaya.Дата) > year(getdate()), dateadd(year, -2000, zaya.Дата), zaya.Дата) date_applied
     ,spec.Наименование spec
     ,spec.код spec_id
     ,op.Наименование sponsorship_type
     ,op.код sponsorship_type_id
     ,kon.Наименование concurrency_type
     ,kon.код concurrency_type_id
     ,kp.Наименование admission_type
     ,kp.код admission_type_id
     ,urov.Наименование degree_type
     ,urov.код degree_type_id
     ,dis.Наименование ege_subject
     ,dis.код ege_subject_id
     ,ot.Наименование ege_score
    ,perecSostName.EnumValue status
    ,perecSostName.enumorder status_id
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
where urov.Наименование in ('Бакалавр','Специалист','Академический бакалавр','Прикладной бакалавр')) docs
where
      year(docs.date_applied) = ${year}
      AND docs.code1C = ${code1C}
  AND docs.admission_type_id = ${admission_type_id}
  AND docs.concurrency_type_id = ${concurrency_type_id}
  AND docs.sponsorship_type_id = ${sponsorship_type_id}
  AND docs.degree_type_id = ${degree_type_id}
  AND docs.ege_subject_id = ${ege_subject_id}
  AND docs.spec_id = ${spec_id}
  AND docs.status_id = ${status_id}
AND docs.is_doc_original = ${is_doc_original}
  AND docs.dorm_required = ${dorm_required}
  AND docs.enroll_accepted = ${enroll_accepted}
  AND docs.privileged = ${privileged}
  `,
            (err, result) => {
                if (err) {
                    console.log(err)
                    loggerPriem.log('error', 'Get admission/applicants error', {
                        err,
                    })
                    res.sendStatus(400)
                }

                pool.close()
                const output = []
                result.recordset.reduce((acc, cur) => {
                    if (acc.code1C !== cur.code1C ) {
                        output.push(acc)
                        return {
                            code1C: cur.code1C,
                            surname: cur.surname,
                            name: cur.name,
                            patronymic: cur.patronymic,
                            extra_score: +cur.extra_score,
                            is_doc_original: !!cur.is_doc_original,
                            enroll_accepted: !!cur.enroll_accepted,
                            privileged: !!cur.privileged,
                            dorm_required: !!cur.dorm_required,
                            date_applied: cur.date_applied,
                            sponsorship_type: {id: cur.sponsorship_type_id, name: cur.sponsorship_type},
                            admission_type: {id: cur.admission_type_id, name: cur.admission_type},
                            degree_type: {id: cur.degree_type_id, name: cur.degree_type},
                            ege: [{id: cur.ege_subject_id, name: cur.ege_subject, score: +cur.ege_score}],
                            specs: [{
                                id: cur.spec_id,
                                name: cur.spec,
                                concurrency_type: {
                                    id: cur.concurrency_type_id,
                                    name: cur.concurrency_type},
                                status: {
                                    id: cur.status_id,
                                    name: cur.status
                                }
                            }],
                        }
                    }
                    if (!(acc.ege.find(e => e.id === cur.ege_subject_id))) {
                        acc.ege.push({id: cur.ege_subject_id, name: cur.ege_subject, score: +cur.ege_score})
                    }
                    if (!(acc.specs.find(s => s.id === cur.spec_id))) {
                        acc.specs.push({
                            id: cur.spec_id,
                            name: cur.spec,
                            concurrency_type: {
                                id: cur.concurrency_type_id,
                                name: cur.concurrency_type
                            },
                            status: {
                                id: cur.status_id,
                                name: cur.status
                            }
                        })
                    }
                    return acc
                }, {})
                output.shift()
                res.send(output)
            },
        )
    })
})



router.route('/concurrency_types').get((req, res, next) => {
    pool.connect((err) => {
        if (err) res.sendStatus(400)

        const request = new sql.Request(pool)
        request.query(
            `select distinct Код id, Наименование name from Справочник_КонкурсныеГруппы`,
            (err, result) => {
                if (err) {
                    loggerPriem.log('error', 'Get concurrency_types error', {
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


router.route('/spec_types').get((req, res, next) => {
    pool.connect((err) => {
        if (err) res.sendStatus(400)

        const request = new sql.Request(pool)
        request.query(
            `SELECT DISTINCT Код id, Наименование name
                FROM Справочник_Специальности`,
            (err, result) => {
                if (err) {
                    loggerPriem.log('error', 'Get spec_types error', {
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

router.route('/sponsorship_types').get((req, res, next) => {
    pool.connect((err) => {
        if (err) res.sendStatus(400)

        const request = new sql.Request(pool)
        request.query(
            `SELECT Код id, Наименование name
                      FROM Справочник_ОснованияПоступления`,
            (err, result) => {
                if (err) {
                    loggerPriem.log('error', 'Get sponsorship_types error', {
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

router.route('/admission_types').get((req, res, next) => {
    pool.connect((err) => {
        if (err) res.sendStatus(400)

        const request = new sql.Request(pool)
        request.query(
            `SELECT Код id, Наименование name
                      FROM Справочник_Категорииприема`,
            (err, result) => {
                if (err) {
                    loggerPriem.log('error', 'Get admission_types error', {
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
