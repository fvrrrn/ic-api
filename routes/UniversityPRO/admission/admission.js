const router = require('express').Router()
const sql = require('mssql')
const pool = require('../../../config/config_universityPROF')
const poolConnection = pool.connect()
const { loggerPriem } = require('../../../lib/logger')
const concurrency_types_vi = require('./concurrency_types_vi.json')
const concurrency_types_no_vi = require('./concurrency_types_no_vi.json')

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

router.route('/applicants').get(async (req, res, next) => {
  let {
    code1C = 'code1C',
    is_doc_original = 'is_doc_original',
    enroll_accepted = 'enroll_accepted',
    dorm_required = 'dorm_required',
    privileged = 'privileged',
    spec_id = 'spec_id',
    status_id = 'status_id',
    subject_id = 'subject_id',
    degree_type_id = 'degree_type_id',
    admission_type_id = 'admission_type_id',
    concurrency_type_id = 'concurrency_type_id',
    sponsorship_type_id = 'sponsorship_type_id',
  } = req.body
  if (!(is_doc_original === 'is_doc_original')) {
    is_doc_original = is_doc_original === 'true' ? 1 : 0
  }
  if (!(dorm_required === 'dorm_required')) {
    dorm_required = dorm_required === 'true' ? 1 : 0
  }
  if (!(enroll_accepted === 'enroll_accepted')) {
    enroll_accepted = enroll_accepted === 'true' ? 1 : 0
  }
  if (!(privileged === 'privileged')) {
    privileged = privileged === 'true' ? 1 : 0
  }
  await poolConnection
  try {
    const request = pool.request()
    const result1 = await request.query(`
select *
from ic_admission_bachelors_ege
where
      code1C = ${code1C}
  AND admission_type_id = ${admission_type_id}
  AND concurrency_type_id = ${concurrency_type_id}
  AND sponsorship_type_id = ${sponsorship_type_id}
  AND degree_type_id = ${degree_type_id}
  AND subject_id = ${subject_id}
  AND spec_id = ${spec_id}
  AND status_id = ${status_id}
AND is_doc_original = ${is_doc_original}
  AND dorm_required = ${dorm_required}
  AND enroll_accepted = ${enroll_accepted}
  AND privileged = ${privileged}
  order by code1C
  `)
    const result2 = await request.query(`
select *
from ic_admission_bachelors_vi
where
      code1C = ${code1C}
  AND admission_type_id = ${admission_type_id}
  AND concurrency_type_id = ${concurrency_type_id}
  AND sponsorship_type_id = ${sponsorship_type_id}
  AND degree_type_id = ${degree_type_id}
  AND subject_id = ${subject_id}
  AND spec_id = ${spec_id}
  AND status_id = ${status_id}
AND is_doc_original = ${is_doc_original}
  AND dorm_required = ${dorm_required}
  AND enroll_accepted = ${enroll_accepted}
  AND privileged = ${privileged}
  order by code1C
        `)
    const output1 = []
    let last = null
    result1.recordset.reduce((acc, cur) => {
      if (acc.code1C !== cur.code1C) {
        output1.push(acc)
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
            ege: [{ id: cur.subject_id, name: cur.subject, score: +cur.score }],
            vi: [],
          },
          specs: [
            {
              id: cur.spec_id,
              name: cur.spec,
              concurrency_type: {
                id: cur.concurrency_type_id,
                name: cur.concurrency_type,
              },
              sponsorship_type: {
                id: cur.sponsorship_type_id,
                name: cur.sponsorship_type,
              },
              admission_type: {
                id: cur.admission_type_id,
                name: cur.admission_type,
              },
              degree_type: {
                id: cur.degree_type_id,
                name: cur.degree_type,
              },
              status: {
                id: cur.status_id,
                name: cur.status,
              },
            },
          ],
        }
      }
      if (!acc.exams.ege.find((e) => e.id === cur.subject_id)) {
        acc.exams.ege.push({
          id: cur.subject_id,
          name: cur.subject,
          score: +cur.score,
        })
      }
      const ss = acc.specs.filter((s) => s.id === cur.spec_id)
      if (!ss.length) {
        acc.specs.push({
          id: cur.spec_id,
          name: cur.spec,
          concurrency_type: {
            id: cur.concurrency_type_id,
            name: cur.concurrency_type,
          },
          sponsorship_type: {
            id: cur.sponsorship_type_id,
            name: cur.sponsorship_type,
          },
          admission_type: {
            id: cur.admission_type_id,
            name: cur.admission_type,
          },
          degree_type: {
            id: cur.degree_type_id,
            name: cur.degree_type,
          },
          status: {
            id: cur.status_id,
            name: cur.status,
          },
        })
        last = acc
        return acc
      } else {
        if (!ss.some((s) => s.admission_type.id === cur.admission_type_id)) {
          acc.specs.push({
            id: cur.spec_id,
            name: cur.spec,
            concurrency_type: {
              id: cur.concurrency_type_id,
              name: cur.concurrency_type,
            },
            sponsorship_type: {
              id: cur.sponsorship_type_id,
              name: cur.sponsorship_type,
            },
            admission_type: {
              id: cur.admission_type_id,
              name: cur.admission_type,
            },
            degree_type: {
              id: cur.degree_type_id,
              name: cur.degree_type,
            },
            status: {
              id: cur.status_id,
              name: cur.status,
            },
          })
          last = acc
          return acc
        }
        if (
          !ss.some((s) => s.concurrency_type.id === cur.concurrency_type_id)
        ) {
          acc.specs.push({
            id: cur.spec_id,
            name: cur.spec,
            concurrency_type: {
              id: cur.concurrency_type_id,
              name: cur.concurrency_type,
            },
            sponsorship_type: {
              id: cur.sponsorship_type_id,
              name: cur.sponsorship_type,
            },
            admission_type: {
              id: cur.admission_type_id,
              name: cur.admission_type,
            },
            degree_type: {
              id: cur.degree_type_id,
              name: cur.degree_type,
            },
            status: {
              id: cur.status_id,
              name: cur.status,
            },
          })
          last = acc
          return acc
        }
        if (
          !ss.some((s) => s.sponsorship_type.id === cur.sponsorship_type_id)
        ) {
          acc.specs.push({
            id: cur.spec_id,
            name: cur.spec,
            concurrency_type: {
              id: cur.concurrency_type_id,
              name: cur.concurrency_type,
            },
            sponsorship_type: {
              id: cur.sponsorship_type_id,
              name: cur.sponsorship_type,
            },
            admission_type: {
              id: cur.admission_type_id,
              name: cur.admission_type,
            },
            degree_type: {
              id: cur.degree_type_id,
              name: cur.degree_type,
            },
            status: {
              id: cur.status_id,
              name: cur.status,
            },
          })
          last = acc
          return acc
        }
        if (!ss.some((s) => s.degree_type.id === cur.degree_type_id)) {
          acc.specs.push({
            id: cur.spec_id,
            name: cur.spec,
            concurrency_type: {
              id: cur.concurrency_type_id,
              name: cur.concurrency_type,
            },
            sponsorship_type: {
              id: cur.sponsorship_type_id,
              name: cur.sponsorship_type,
            },
            admission_type: {
              id: cur.admission_type_id,
              name: cur.admission_type,
            },
            degree_type: {
              id: cur.degree_type_id,
              name: cur.degree_type,
            },
            status: {
              id: cur.status_id,
              name: cur.status,
            },
          })
          last = acc
          return acc
        }
      }

      last = acc
      return acc
    }, {})
    output1.shift()
    output1.push(last)
    const output2 = []
    result2.recordset.reduce((acc, cur) => {
      if (acc.code1C !== cur.code1C) {
        output2.push(acc)
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
            ege: [],
            vi: [{ id: cur.subject_id, name: cur.subject, score: +cur.score }],
          },
          specs: [
            {
              id: cur.spec_id,
              name: cur.spec,
              concurrency_type: {
                id: cur.concurrency_type_id,
                name: cur.concurrency_type,
              },
              sponsorship_type: {
                id: cur.sponsorship_type_id,
                name: cur.sponsorship_type,
              },
              admission_type: {
                id: cur.admission_type_id,
                name: cur.admission_type,
              },
              degree_type: {
                id: cur.degree_type_id,
                name: cur.degree_type,
              },
              status: {
                id: cur.status_id,
                name: cur.status,
              },
            },
          ],
        }
      }
      if (!acc.exams.vi.find((e) => e.id === cur.subject_id)) {
        acc.exams.vi.push({
          id: cur.subject_id,
          name: cur.subject,
          score: +cur.score,
        })
      }
      const ss = acc.specs.filter((s) => s.id === cur.spec_id)
      if (!ss.length) {
        acc.specs.push({
          id: cur.spec_id,
          name: cur.spec,
          concurrency_type: {
            id: cur.concurrency_type_id,
            name: cur.concurrency_type,
          },
          sponsorship_type: {
            id: cur.sponsorship_type_id,
            name: cur.sponsorship_type,
          },
          admission_type: {
            id: cur.admission_type_id,
            name: cur.admission_type,
          },
          degree_type: {
            id: cur.degree_type_id,
            name: cur.degree_type,
          },
          status: {
            id: cur.status_id,
            name: cur.status,
          },
        })
      } else {
        if (!ss.some((s) => s.admission_type.id === cur.admission_type_id)) {
          acc.specs.push({
            id: cur.spec_id,
            name: cur.spec,
            concurrency_type: {
              id: cur.concurrency_type_id,
              name: cur.concurrency_type,
            },
            sponsorship_type: {
              id: cur.sponsorship_type_id,
              name: cur.sponsorship_type,
            },
            admission_type: {
              id: cur.admission_type_id,
              name: cur.admission_type,
            },
            degree_type: {
              id: cur.degree_type_id,
              name: cur.degree_type,
            },
            status: {
              id: cur.status_id,
              name: cur.status,
            },
          })
        }
        if (
          !ss.some((s) => s.concurrency_type.id === cur.concurrency_type_id)
        ) {
          acc.specs.push({
            id: cur.spec_id,
            name: cur.spec,
            concurrency_type: {
              id: cur.concurrency_type_id,
              name: cur.concurrency_type,
            },
            sponsorship_type: {
              id: cur.sponsorship_type_id,
              name: cur.sponsorship_type,
            },
            admission_type: {
              id: cur.admission_type_id,
              name: cur.admission_type,
            },
            degree_type: {
              id: cur.degree_type_id,
              name: cur.degree_type,
            },
            status: {
              id: cur.status_id,
              name: cur.status,
            },
          })
        }
        if (
          !ss.some((s) => s.sponsorship_type.id === cur.sponsorship_type_id)
        ) {
          acc.specs.push({
            id: cur.spec_id,
            name: cur.spec,
            concurrency_type: {
              id: cur.concurrency_type_id,
              name: cur.concurrency_type,
            },
            sponsorship_type: {
              id: cur.sponsorship_type_id,
              name: cur.sponsorship_type,
            },
            admission_type: {
              id: cur.admission_type_id,
              name: cur.admission_type,
            },
            degree_type: {
              id: cur.degree_type_id,
              name: cur.degree_type,
            },
            status: {
              id: cur.status_id,
              name: cur.status,
            },
          })
        }
        if (!ss.some((s) => s.degree_type.id === cur.degree_type_id)) {
          acc.specs.push({
            id: cur.spec_id,
            name: cur.spec,
            concurrency_type: {
              id: cur.concurrency_type_id,
              name: cur.concurrency_type,
            },
            sponsorship_type: {
              id: cur.sponsorship_type_id,
              name: cur.sponsorship_type,
            },
            admission_type: {
              id: cur.admission_type_id,
              name: cur.admission_type,
            },
            degree_type: {
              id: cur.degree_type_id,
              name: cur.degree_type,
            },
            status: {
              id: cur.status_id,
              name: cur.status,
            },
          })
        }
      }

      last = acc
      return acc
    }, {})
    output2.shift()
    output2.push(last)
    const output3 = []
    for (let o1 of output1) {
      const o = output2.find((o2) => o2.code1C === o1.code1C)
      if (o) {
        o1.exams.vi = o.exams.vi
      }
      output3.push(o1)
    }
    const tmp = []
    for (let o2 of output2) {
      const o = output1.find((o1) => o1.code1C === o2.code1C)
      if (!o) {
        tmp.push(o2)
      }
    }
    output3.push(...tmp)
    res.send(output3)
  } catch (e) {
    console.error('UNIVERSITYPROF admission/spec_types error: ', e)
    res.sendStatus(400)
  }
})

router.route('/concurrency_types').get(async (req, res, next) => {
  await poolConnection
  try {
    const result = await pool.request().query(`
select *
from ic_admission_concurrency_types_bachelor
order by concurrency_type_id
  `)
    let last = null
    const output = []
    result.recordset.reduce((acc, cur) => {
      if (acc.id !== cur.concurrency_type_id) {
        output.push(acc)
        return {
          id: cur.concurrency_type_id,
          name: cur.concurrency_type,
          study_types: [{ id: cur.study_type_id, name: cur.study_type }],
          subjects: [
            {
              id: cur.subject_id,
              name: cur.subject,
              priority: cur.subject_priority,
            },
          ],
          specs: [{ id: cur.spec_id, name: cur.spec, code: cur.spec_code }],
          degrees: [{ id: cur.degree_type_id, name: cur.degree_type }],
          sponsorships: [
            { id: cur.sponsorship_type_id, name: cur.sponsorship_type },
          ],
          privileged_accepted: [cur.privileged_accepted],
          places_amount_current: cur.places_amount_current,
          places_amount: cur.places_amount,
          places_amount_state_funded: cur.places_amount_state_funded,
          document_received: cur.document_received,
          document_received_orig: cur.document_received_orig,
        }
      }
      acc.subjects.push({
        id: cur.subject_id,
        name: cur.subject,
        priority: cur.subject_priority,
      })
      if (!acc.study_types.find((e) => e.id === cur.study_type_id)) {
        acc.study_types.push({ id: cur.study_type_id, name: cur.study_type })
      }
      if (!acc.specs.find((e) => e.id === cur.spec_id)) {
        acc.specs.push({ id: cur.spec_id, name: cur.spec })
      }
      if (!acc.degrees.find((e) => e.id === cur.degree_type_id)) {
        acc.degrees.push({ id: cur.degree_type_id, name: cur.degree_type })
      }
      if (!acc.sponsorships.find((e) => e.id === cur.sponsorship_type_id)) {
        acc.sponsorships.push({
          id: cur.sponsorship_type_id,
          name: cur.sponsorship_type,
        })
      }
      if (!acc.privileged_accepted.includes(cur.privileged_accepted)) {
        acc.privileged_accepted.push(cur.privileged_accepted)
      }
      last = acc
      return acc
    }, {})
    output.shift()
    output.push(last)
    res.send(output)
  } catch (err) {
    console.error('UNIVERSITYPROF admission/concurrency_types error: ', err)
    res.sendStatus(400)
  }
})

router.route('/spec_types').get(async (req, res, next) => {
  await poolConnection
  try {
    const result = await pool
      .request()
      .query(
        `SELECT DISTINCT Код id, Наименование name FROM Справочник_Специальности`,
      )
    res.send(result.recordset)
  } catch (err) {
    console.error('UNIVERSITYPROF admission/spec_types error: ', err)
    res.sendStatus(400)
  }
})

router.route('/sponsorship_types').get(async (req, res, next) => {
  await poolConnection
  try {
    const result = await pool
      .request()
      .query(
        `SELECT Код id, Наименование name FROM Справочник_ОснованияПоступления`,
      )
    res.send(result.recordset)
  } catch (err) {
    console.error('UNIVERSITYPROF admission/sponsorship_types error: ', err)
    res.sendStatus(400)
  }
})

router.route('/admission_types').get(async (req, res, next) => {
  await poolConnection
  try {
    const result = await pool
      .request()
      .query(`SELECT Код id, Наименование name FROM Справочник_Категорииприема`)
    res.send(result.recordset)
  } catch (err) {
    console.error('UNIVERSITYPROF admission/admission_types error: ', err)
    res.sendStatus(400)
  }
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
