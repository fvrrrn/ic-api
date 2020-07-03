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
        code1C = 'docs.code1C',
        is_doc_original = 'docs.is_doc_original',
        enroll_accepted = 'docs.enroll_accepted',
        dorm_required = 'docs.dorm_required',
        privileged = 'docs.privileged',
        spec_id = 'docs.spec_id',
        status_id = 'docs.status_id',
        subject_id = 'docs.ege_subject_id',
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
            `
            select * from (SELECT top(5000)
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
                        inner JOIN Справочник_КонкурсныеГруппы kon on sostZaya.КонкурснаяГруппа_Ссылка = kon.Ссылка and kon.ПриемнаяКампания_Ссылка = 0x81246C626D51EA7011E9E5E0CDC97253
                        LEFT JOIN Справочник_УровеньПодготовки urov on kon.УровеньПодготовки_Ссылка = urov.Ссылка
                        LEFT JOIN Документ_СвидетельствоЕГЭ ege on ege.ФизическоеЛицо_Ссылка = fiz.Ссылка
                        LEFT JOIN Документ_СвидетельствоЕГЭ_РезультатыЕГЭ res on res.Ссылка = ege.Ссылка
                        left JOIN Справочник_Дисциплины dis on res.Предмет_Ссылка = dis.Ссылка
                        LEFT JOIN Справочник_Отметки ot on res.Балл_Ссылка = ot.Ссылка
                        LEFT JOIN Документ_УчетДостиженийАбитуриентов dost on dost.ФизическоеЛицо_Ссылка = fiz.Ссылка
                        LEFT JOIN Документ_УчетДостиженийАбитуриентов_Достижения res_dost on dost.Ссылка = res_dost.Ссылка
                        LEFT JOIN Справочник_Отметки ot_dost on res_dost.Балл_Ссылка = ot_dost.Ссылка
                        LEFT JOIN Справочник_Специальности spec on spec.Ссылка = kon.Специальность_Ссылка
                        LEFT JOIN Перечисление_СостоянияЗаявленийПоступающих perecSost on perecSost.Ссылка = sostZaya.Состояние_Ссылка
                        LEFT JOIN п_СостоянияЗаявленийПоступающих perecSostName on perecSostName.EnumOrder = perecSost.Порядок
                        left JOIN РегистрСведений_СогласияНаЗачисление sogl on sogl.ФизическоеЛицо_Ссылка = fiz.Ссылка
                        left JOIN Перечисление_СостоянияСогласийНаЗачисление perecSogl on perecSogl.Ссылка = sogl.Состояние_Ссылка
                        left JOIN п_СостоянияСогласийНаЗачисление perecSoglName on perecSoglName.EnumOrder = perecSogl.Порядок
                        left join
                    Документ_ЗаявлениеПоступающего
                        zaya on zaya.ФизическоеЛицо_Ссылка = fiz.Ссылка
                        left join Документ_ЗаявлениеПоступающего_НаправленияПодготовки np on np.Ссылка = zaya.Ссылка
                        left join dbo.Справочник_ОснованияПоступления op on np.ОснованиеПоступления_Ссылка = op.Ссылка
                        left join dbo.Справочник_КатегорииПриема kp on np.КатегорияПриема_Ссылка = kp.Ссылка) docs
where
      docs.code1C = ${code1C}
  AND docs.admission_type_id = ${admission_type_id}
  AND docs.concurrency_type_id = ${concurrency_type_id}
  AND docs.sponsorship_type_id = ${sponsorship_type_id}
  AND docs.degree_type_id = ${degree_type_id}
  AND docs.ege_subject_id = ${subject_id}
  AND docs.spec_id = ${spec_id}
  AND docs.status_id = ${status_id}
AND docs.is_doc_original = ${is_doc_original}
  AND docs.dorm_required = ${dorm_required}
  AND docs.enroll_accepted = ${enroll_accepted}
  AND docs.privileged = ${privileged}
  order by docs.code1C
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
                let last = null
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
                            exams: {
                                ege: [{id: cur.ege_subject_id, name: cur.ege_subject, score: +cur.ege_score}],
                                vi: []
                            },
                            specs: [{
                                id: cur.spec_id,
                                name: cur.spec,
                                concurrency_type: {
                                    id: cur.concurrency_type_id,
                                    name: cur.concurrency_type
                                },
                                sponsorship_type: {
                                    id: cur.sponsorship_type_id,
                                    name: cur.sponsorship_type
                                },
                                admission_type: {
                                    id: cur.admission_type_id,
                                    name: cur.admission_type
                                },
                                degree_type: {
                                    id: cur.degree_type_id,
                                    name: cur.degree_type
                                },
                                status: {
                                    id: cur.status_id,
                                    name: cur.status
                                }
                            }],
                        }
                    }
                    if (!(acc.exams.ege.find(e => e.id === cur.ege_subject_id))) {
                        acc.exams.ege.push({id: cur.ege_subject_id, name: cur.ege_subject, score: +cur.ege_score})
                    }
                    const ss = acc.specs.filter(s => s.id === cur.spec_id)
                    if (!ss.length) {
                        acc.specs.push({
                            id: cur.spec_id,
                            name: cur.spec,
                            concurrency_type: {
                                id: cur.concurrency_type_id,
                                name: cur.concurrency_type
                            },
                            sponsorship_type: {
                                id: cur.sponsorship_type_id,
                                name: cur.sponsorship_type
                            },
                            admission_type: {
                                id: cur.admission_type_id,
                                name: cur.admission_type
                            },
                            degree_type: {
                                id: cur.degree_type_id,
                                name: cur.degree_type
                            },
                            status: {
                                id: cur.status_id,
                                name: cur.status
                            }
                        })
                    } else {
                        if (!(ss.some(s => s.admission_type.id === cur.admission_type_id))) {
                            acc.specs.push({
                                id: cur.spec_id,
                                name: cur.spec,
                                concurrency_type: {
                                    id: cur.concurrency_type_id,
                                    name: cur.concurrency_type
                                },
                                sponsorship_type: {
                                    id: cur.sponsorship_type_id,
                                    name: cur.sponsorship_type
                                },
                                admission_type: {
                                    id: cur.admission_type_id,
                                    name: cur.admission_type
                                },
                                degree_type: {
                                    id: cur.degree_type_id,
                                    name: cur.degree_type
                                },
                                status: {
                                    id: cur.status_id,
                                    name: cur.status
                                }
                            })
                        }
                        if (!(ss.some(s => s.concurrency_type.id === cur.concurrency_type_id))) {
                            acc.specs.push({
                                id: cur.spec_id,
                                name: cur.spec,
                                concurrency_type: {
                                    id: cur.concurrency_type_id,
                                    name: cur.concurrency_type
                                },
                                sponsorship_type: {
                                    id: cur.sponsorship_type_id,
                                    name: cur.sponsorship_type
                                },
                                admission_type: {
                                    id: cur.admission_type_id,
                                    name: cur.admission_type
                                },
                                degree_type: {
                                    id: cur.degree_type_id,
                                    name: cur.degree_type
                                },
                                status: {
                                    id: cur.status_id,
                                    name: cur.status
                                }
                            })
                        }
                        if (!(ss.some(s => s.sponsorship_type.id === cur.sponsorship_type_id))) {
                            acc.specs.push({
                                id: cur.spec_id,
                                name: cur.spec,
                                concurrency_type: {
                                    id: cur.concurrency_type_id,
                                    name: cur.concurrency_type
                                },
                                sponsorship_type: {
                                    id: cur.sponsorship_type_id,
                                    name: cur.sponsorship_type
                                },
                                admission_type: {
                                    id: cur.admission_type_id,
                                    name: cur.admission_type
                                },
                                degree_type: {
                                    id: cur.degree_type_id,
                                    name: cur.degree_type
                                },
                                status: {
                                    id: cur.status_id,
                                    name: cur.status
                                }
                            })
                        }
                        if (!(ss.some(s => s.degree_type.id === cur.degree_type_id))) {
                            acc.specs.push({
                                id: cur.spec_id,
                                name: cur.spec,
                                concurrency_type: {
                                    id: cur.concurrency_type_id,
                                    name: cur.concurrency_type
                                },
                                sponsorship_type: {
                                    id: cur.sponsorship_type_id,
                                    name: cur.sponsorship_type
                                },
                                admission_type: {
                                    id: cur.admission_type_id,
                                    name: cur.admission_type
                                },
                                degree_type: {
                                    id: cur.degree_type_id,
                                    name: cur.degree_type
                                },
                                status: {
                                    id: cur.status_id,
                                    name: cur.status
                                }
                            })
                        }
                    }

                    last = acc
                    return acc
                }, {})
                output.shift()
                output.push(last)
                for (let o1 of output) {
                    const o = output2.find(o2 => o2.code1C === o1.code1C)
                    if (o) {
                        o1.exams.vi = o.exams.vi
                    }
                }
                const tmp = []
                for (let o2 of output2) {
                    const o = output.find(o1 => o1.code1C === o2.code1C)
                    if (!o) {
                        tmp.push(o)
                    }
                }
                output.push(...tmp)
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
            `
SELECT
        kon.Код id
        ,kon.Наименование name
        ,disc.Наименование subject
FROM Справочник_КонкурсныеГруппы kon
         INNER JOIN Справочник_КонкурсныеГруппы_ВступительныеИспытания as konIsp on kon.Ссылка = konIsp.Ссылка
         INNER JOIN Справочник_НаборыВступительныхИспытаний as isp on isp.Ссылка = konIsp.НаборВступительныхИспытаний_Ссылка
         INNER JOIN Справочник_НаборыВступительныхИспытаний_Предметы as ispPredmet on ispPredmet.Ссылка = isp.Ссылка
         INNER JOIN Справочник_Дисциплины as disc on disc.Ссылка = ispPredmet.Предмет_Ссылка
where kon.ПриемнаяКампания_Ссылка = 0x81246C626D51EA7011E9E5E0CDC97253
group by kon.Код, kon.Наименование, disc.Наименование
order by kon.Код`,
            (err, result) => {
                if (err) {
                    loggerPriem.log('error', 'Get concurrency_types error', {
                        err,
                    })
                    res.sendStatus(400)
                }

                pool.close()

                const output = []
                result.recordset.reduce((acc, cur) => {
                    if (acc.id !== cur.id ) {
                        output.push(acc)
                        return {
                            id: cur.id,
                            name: cur.name,
                            subjects: [cur.subject],
                        }
                    }
                    acc.subjects.push(cur.subject)
                    return acc
                }, {})
                output.shift()
                res.send(output)
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

output2 = [
    {
        "code1C": "100095287",
        "surname": "Шанталь",
        "name": "Анастасия",
        "patronymic": "Владимировна",
        "extra_score": 73,
        "is_doc_original": false,
        "enroll_accepted": true,
        "privileged": false,
        "dorm_required": false,
        "date_applied": "2020-06-30T16:27:51.000Z",
        "exams": {
            "ege": [],
            "vi": [
                {
                    "id": "000000001",
                    "name": "Русский язык",
                    "score": 73
                },
                {
                    "id": "000000005",
                    "name": "История",
                    "score": 47
                },
                {
                    "id": "000000006",
                    "name": "Обществознание",
                    "score": 49
                }
            ]
        },
        "specs": [
            {
                "id": "266",
                "name": "Юриспруденция",
                "concurrency_type": {
                    "id": "000001229",
                    "name": "Юриспруденция_очно-заочно"
                },
                "sponsorship_type": {
                    "id": "000000002",
                    "name": "Полное возмещение затрат"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            },
            {
                "id": "269",
                "name": "Социальная работа",
                "concurrency_type": {
                    "id": "000001223",
                    "name": "Социальная работа_заочно"
                },
                "sponsorship_type": {
                    "id": "000000002",
                    "name": "Полное возмещение затрат"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            },
            {
                "id": "266",
                "name": "Юриспруденция",
                "concurrency_type": {
                    "id": "000001228",
                    "name": "Юриспруденция_заочно"
                },
                "sponsorship_type": {
                    "id": "000000002",
                    "name": "Полное возмещение затрат"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            },
            {
                "id": "266",
                "name": "Юриспруденция",
                "concurrency_type": {
                    "id": "000001229",
                    "name": "Юриспруденция_очно-заочно"
                },
                "sponsorship_type": {
                    "id": "000000003",
                    "name": "Бюджетная основа"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            },
            {
                "id": "269",
                "name": "Социальная работа",
                "concurrency_type": {
                    "id": "000001223",
                    "name": "Социальная работа_заочно"
                },
                "sponsorship_type": {
                    "id": "000000003",
                    "name": "Бюджетная основа"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            }
        ]
    },
    {
        "code1C": "100097028",
        "surname": "Соболев",
        "name": "Глеб",
        "patronymic": "Павлович",
        "extra_score": 36,
        "is_doc_original": false,
        "enroll_accepted": true,
        "privileged": false,
        "dorm_required": false,
        "date_applied": "2018-07-04T12:51:28.000Z",
        "exams": {
            "ege": [],
            "vi": [
                {
                    "id": "000000001",
                    "name": "Русский язык",
                    "score": 36
                },
                {
                    "id": "000000002",
                    "name": "Математика",
                    "score": 86
                },
                {
                    "id": "000000008",
                    "name": "Физика",
                    "score": 51
                }
            ]
        },
        "specs": [
            {
                "id": "261",
                "name": "Бизнес-информатика",
                "concurrency_type": {
                    "id": "000001186",
                    "name": "Бизнес-информатика_оплата"
                },
                "sponsorship_type": {
                    "id": "000000003",
                    "name": "Бюджетная основа"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            },
            {
                "id": "261",
                "name": "Бизнес-информатика",
                "concurrency_type": {
                    "id": "000001183",
                    "name": "Бизнес-информатика"
                },
                "sponsorship_type": {
                    "id": "000000003",
                    "name": "Бюджетная основа"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            },
            {
                "id": "261",
                "name": "Бизнес-информатика",
                "concurrency_type": {
                    "id": "000001186",
                    "name": "Бизнес-информатика_оплата"
                },
                "sponsorship_type": {
                    "id": "000000002",
                    "name": "Полное возмещение затрат"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            }
        ]
    },
    {
        "code1C": "100097756",
        "surname": "Гаврикова",
        "name": "Виктория",
        "patronymic": "Ивановна",
        "extra_score": 85,
        "is_doc_original": false,
        "enroll_accepted": true,
        "privileged": false,
        "dorm_required": false,
        "date_applied": "2020-06-25T10:52:14.000Z",
        "exams": {
            "ege": [],
            "vi": [
                {
                    "id": "000000001",
                    "name": "Русский язык",
                    "score": 85
                },
                {
                    "id": "000000007",
                    "name": "Химия",
                    "score": 77
                },
                {
                    "id": "000000002",
                    "name": "Математика",
                    "score": 56
                }
            ]
        },
        "specs": [
            {
                "id": "263",
                "name": "Клиническая психология",
                "concurrency_type": {
                    "id": "000001215",
                    "name": "Клиническая психология"
                },
                "sponsorship_type": {
                    "id": "000000003",
                    "name": "Бюджетная основа"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000002",
                    "name": "Специалист"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            },
            {
                "id": "203",
                "name": "Психология",
                "concurrency_type": {
                    "id": "000001211",
                    "name": "Психология"
                },
                "sponsorship_type": {
                    "id": "000000003",
                    "name": "Бюджетная основа"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            }
        ]
    },
    {
        "code1C": "100098736",
        "surname": "Меркулов",
        "name": "Максим",
        "patronymic": "Дмитриевич",
        "extra_score": 62,
        "is_doc_original": false,
        "enroll_accepted": true,
        "privileged": false,
        "dorm_required": false,
        "date_applied": "2020-07-03T12:50:23.000Z",
        "exams": {
            "ege": [],
            "vi": [
                {
                    "id": "000000014",
                    "name": "Информатика и ИКТ",
                    "score": 62
                },
                {
                    "id": "000000006",
                    "name": "Обществознание",
                    "score": 48
                },
                {
                    "id": "000000002",
                    "name": "Математика",
                    "score": 68
                },
                {
                    "id": "000000001",
                    "name": "Русский язык",
                    "score": 66
                }
            ]
        },
        "specs": [
            {
                "id": "230",
                "name": "Прикладная информатика",
                "concurrency_type": {
                    "id": "000001152",
                    "name": "Прикладная информатика_заочно"
                },
                "sponsorship_type": {
                    "id": "000000002",
                    "name": "Полное возмещение затрат"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            },
            {
                "id": "237",
                "name": "Программная инженерия",
                "concurrency_type": {
                    "id": "000001153",
                    "name": "Программная инженерия_заочно"
                },
                "sponsorship_type": {
                    "id": "000000002",
                    "name": "Полное возмещение затрат"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            },
            {
                "id": "261",
                "name": "Бизнес-информатика",
                "concurrency_type": {
                    "id": "000001187",
                    "name": "Бизнес-информатика_заочно"
                },
                "sponsorship_type": {
                    "id": "000000002",
                    "name": "Полное возмещение затрат"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            },
            {
                "id": "230",
                "name": "Прикладная информатика",
                "concurrency_type": {
                    "id": "000001152",
                    "name": "Прикладная информатика_заочно"
                },
                "sponsorship_type": {
                    "id": "000000003",
                    "name": "Бюджетная основа"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            },
            {
                "id": "237",
                "name": "Программная инженерия",
                "concurrency_type": {
                    "id": "000001153",
                    "name": "Программная инженерия_заочно"
                },
                "sponsorship_type": {
                    "id": "000000003",
                    "name": "Бюджетная основа"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            },
            {
                "id": "261",
                "name": "Бизнес-информатика",
                "concurrency_type": {
                    "id": "000001187",
                    "name": "Бизнес-информатика_заочно"
                },
                "sponsorship_type": {
                    "id": "000000003",
                    "name": "Бюджетная основа"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            }
        ]
    },
    {
        "code1C": "100098840",
        "surname": "Кузьмина",
        "name": "Александра",
        "patronymic": "Максимовна",
        "extra_score": 77,
        "is_doc_original": false,
        "enroll_accepted": false,
        "privileged": false,
        "dorm_required": false,
        "date_applied": "2019-06-28T13:27:20.000Z",
        "exams": {
            "ege": [],
            "vi": [
                {
                    "id": "000000009",
                    "name": "Литература",
                    "score": 77
                },
                {
                    "id": "000000010",
                    "name": "Английский язык",
                    "score": 97
                },
                {
                    "id": "000000005",
                    "name": "История",
                    "score": 44
                },
                {
                    "id": "000000001",
                    "name": "Русский язык",
                    "score": 71
                }
            ]
        },
        "specs": [
            {
                "id": "202",
                "name": "Лингвистика",
                "concurrency_type": {
                    "id": "000001230",
                    "name": "Лингвистика"
                },
                "sponsorship_type": {
                    "id": "000000003",
                    "name": "Бюджетная основа"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            },
            {
                "id": "202",
                "name": "Лингвистика",
                "concurrency_type": {
                    "id": "000001233",
                    "name": "Лингвистика_оплата"
                },
                "sponsorship_type": {
                    "id": "000000003",
                    "name": "Бюджетная основа"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            },
            {
                "id": "202",
                "name": "Лингвистика",
                "concurrency_type": {
                    "id": "000001230",
                    "name": "Лингвистика"
                },
                "sponsorship_type": {
                    "id": "000000002",
                    "name": "Полное возмещение затрат"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            }
        ]
    },
    {
        "code1C": "100099125",
        "surname": "Самойлов",
        "name": "Анатолий",
        "patronymic": "Витальевич",
        "extra_score": 55,
        "is_doc_original": false,
        "enroll_accepted": false,
        "privileged": false,
        "dorm_required": true,
        "date_applied": "2020-06-29T15:29:27.000Z",
        "exams": {
            "ege": [],
            "vi": [
                {
                    "id": "000000007",
                    "name": "Химия",
                    "score": 55
                },
                {
                    "id": "000000002",
                    "name": "Математика",
                    "score": 62
                },
                {
                    "id": "000000001",
                    "name": "Русский язык",
                    "score": 87
                }
            ]
        },
        "specs": [
            {
                "id": "217",
                "name": "Химия, физика и механика материалов",
                "concurrency_type": {
                    "id": "000001203",
                    "name": "Химия, физика и механика материалов"
                },
                "sponsorship_type": {
                    "id": "000000003",
                    "name": "Бюджетная основа"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            },
            {
                "id": "273",
                "name": "Химия",
                "concurrency_type": {
                    "id": "000001199",
                    "name": "Химия"
                },
                "sponsorship_type": {
                    "id": "000000003",
                    "name": "Бюджетная основа"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            }
        ]
    },
    {
        "code1C": "100100016",
        "surname": "Маркин",
        "name": "Владимир",
        "patronymic": "Романович",
        "extra_score": 57,
        "is_doc_original": false,
        "enroll_accepted": false,
        "privileged": false,
        "dorm_required": true,
        "date_applied": "2019-07-06T11:21:12.000Z",
        "exams": {
            "ege": [],
            "vi": [
                {
                    "id": "000000014",
                    "name": "Информатика и ИКТ",
                    "score": 57
                },
                {
                    "id": "000000001",
                    "name": "Русский язык",
                    "score": 67
                },
                {
                    "id": "000000002",
                    "name": "Математика",
                    "score": 56
                }
            ]
        },
        "specs": [
            {
                "id": "231",
                "name": "Фундаментальная информатика и информационные технологии",
                "concurrency_type": {
                    "id": "000001132",
                    "name": "Фундаментальная информатика и информационные технологии"
                },
                "sponsorship_type": {
                    "id": "000000003",
                    "name": "Бюджетная основа"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            },
            {
                "id": "230",
                "name": "Прикладная информатика",
                "concurrency_type": {
                    "id": "000001144",
                    "name": "Прикладная информатика"
                },
                "sponsorship_type": {
                    "id": "000000003",
                    "name": "Бюджетная основа"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            },
            {
                "id": "293     ",
                "name": "Автоматизация технологических процессов и производств",
                "concurrency_type": {
                    "id": "000001154",
                    "name": "Автоматизация технологических процессов и производств"
                },
                "sponsorship_type": {
                    "id": "000000003",
                    "name": "Бюджетная основа"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            }
        ]
    },
    {
        "code1C": "100100895",
        "surname": "Фомин",
        "name": "Антон",
        "patronymic": "Валерьевич",
        "extra_score": 55,
        "is_doc_original": true,
        "enroll_accepted": true,
        "privileged": false,
        "dorm_required": true,
        "date_applied": "2019-07-19T12:29:39.000Z",
        "exams": {
            "ege": [],
            "vi": [
                {
                    "id": "000000001",
                    "name": "Русский язык",
                    "score": 55
                },
                {
                    "id": "000000014",
                    "name": "Информатика и ИКТ",
                    "score": 10
                },
                {
                    "id": "000000002",
                    "name": "Математика",
                    "score": 72
                }
            ]
        },
        "specs": [
            {
                "id": "237",
                "name": "Программная инженерия",
                "concurrency_type": {
                    "id": "000001153",
                    "name": "Программная инженерия_заочно"
                },
                "sponsorship_type": {
                    "id": "000000002",
                    "name": "Полное возмещение затрат"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            },
            {
                "id": "287     ",
                "name": "Технология геологической разведки",
                "concurrency_type": {
                    "id": "000001178",
                    "name": "Технология геологической разведки_заочно"
                },
                "sponsorship_type": {
                    "id": "000000002",
                    "name": "Полное возмещение затрат"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000002",
                    "name": "Специалист"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            },
            {
                "id": "261",
                "name": "Бизнес-информатика",
                "concurrency_type": {
                    "id": "000001187",
                    "name": "Бизнес-информатика_заочно"
                },
                "sponsorship_type": {
                    "id": "000000002",
                    "name": "Полное возмещение затрат"
                },
                "admission_type": {
                    "id": "000000003",
                    "name": "На общих основаниях"
                },
                "degree_type": {
                    "id": "000000001",
                    "name": "Бакалавр"
                },
                "status": {
                    "id": 0,
                    "name": "Подано"
                }
            }
        ]
    }
]

module.exports = router
