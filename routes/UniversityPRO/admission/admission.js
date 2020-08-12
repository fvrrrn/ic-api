const router = require('express').Router()
const sql = require('mssql')
const pool = require('../../../config/config_universityPROF').pool
const poolConnection = require('../../../config/config_universityPROF')
  .poolConnection
const { loggerPriem } = require('../../../lib/logger')
const nodeCache = require('node-cache')
const cache = new nodeCache({ deleteOnExpire: false })

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

const getApplicants = async () => {
  await poolConnection
  try {
    const request = pool.request()
    const output1 = []
    const output2 = []
    const output3 = []
    let last1 = null
    let last2 = null
    let last3 = null
    const results = await Promise.all([
      request
        .query(
          `
select *
from ic_admission_bachelors_ege
  `,
        )
        .then((result) =>
          result.recordset
            .sort((a, b) => {
              if (a.code1C < b.code1C) {
                return -1
              }
              if (a.code1C > b.code1C) {
                return 1
              }
              return 0
            })
            .reduce((acc, cur) => {
              if (acc.code1C !== cur.code1C) {
                output1.push(acc)
                return {
                  code1C: cur.code1C,
                  surname: cur.surname,
                  name: cur.name,
                  patronymic: cur.patronymic,
                  extra_score: +cur.extra_score,
                  is_doc_original: !!cur.is_doc_original,
                  privileged: !!cur.privileged,
                  dorm_required: !!cur.dorm_required,
                  date_applied: cur.date_applied,
                  exams: {
                    ege: [
                      {
                        id: cur.subject_id,
                        name: cur.subject,
                        score: +cur.score,
                      },
                    ],
                    vi: [],
                  },
                  specs: [
                    {
                      id: cur.spec_id,
                      name: cur.spec,
                      enroll_accepted: !!cur.enroll_accepted,
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
                  enroll_accepted: !!cur.enroll_accepted,
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
                last1 = acc
                return acc
              } else {
                if (
                  !ss.some((s) => s.admission_type.id === cur.admission_type_id)
                ) {
                  acc.specs.push({
                    id: cur.spec_id,
                    name: cur.spec,
                    enroll_accepted: !!cur.enroll_accepted,
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
                  last1 = acc
                  return acc
                }
                if (
                  !ss.some(
                    (s) => s.concurrency_type.id === cur.concurrency_type_id,
                  )
                ) {
                  acc.specs.push({
                    id: cur.spec_id,
                    name: cur.spec,
                    enroll_accepted: !!cur.enroll_accepted,
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
                  last1 = acc
                  return acc
                }
                if (
                  !ss.some(
                    (s) => s.sponsorship_type.id === cur.sponsorship_type_id,
                  )
                ) {
                  acc.specs.push({
                    id: cur.spec_id,
                    name: cur.spec,
                    enroll_accepted: !!cur.enroll_accepted,
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
                  last1 = acc
                  return acc
                }
                if (!ss.some((s) => s.degree_type.id === cur.degree_type_id)) {
                  acc.specs.push({
                    id: cur.spec_id,
                    name: cur.spec,
                    enroll_accepted: !!cur.enroll_accepted,
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
                  last1 = acc
                  return acc
                }
              }

              last1 = acc
              return acc
            }, {}),
        ),

      request
        .query(
          `
select *
from ic_admission_bachelors_vi
        `,
        )
        .then((result) =>
          result.recordset
            .sort((a, b) => {
              if (a.code1C < b.code1C) {
                return -1
              }
              if (a.code1C > b.code1C) {
                return 1
              }
              return 0
            })
            .reduce((acc, cur) => {
              if (acc.code1C !== cur.code1C) {
                output2.push(acc)
                return {
                  code1C: cur.code1C,
                  surname: cur.surname,
                  name: cur.name,
                  patronymic: cur.patronymic,
                  extra_score: +cur.extra_score,
                  is_doc_original: !!cur.is_doc_original,
                  privileged: !!cur.privileged,
                  dorm_required: !!cur.dorm_required,
                  date_applied: cur.date_applied,
                  exams: {
                    ege: [],
                    vi: [
                      {
                        id: cur.subject_id,
                        name: cur.subject,
                        score: +cur.score,
                      },
                    ],
                  },
                  specs: [
                    {
                      id: cur.spec_id,
                      name: cur.spec,
                      enroll_accepted: !!cur.enroll_accepted,
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
                  enroll_accepted: !!cur.enroll_accepted,
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
                if (
                  !ss.some((s) => s.admission_type.id === cur.admission_type_id)
                ) {
                  acc.specs.push({
                    id: cur.spec_id,
                    name: cur.spec,
                    enroll_accepted: !!cur.enroll_accepted,
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
                  !ss.some(
                    (s) => s.concurrency_type.id === cur.concurrency_type_id,
                  )
                ) {
                  acc.specs.push({
                    id: cur.spec_id,
                    name: cur.spec,
                    enroll_accepted: !!cur.enroll_accepted,
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
                  !ss.some(
                    (s) => s.sponsorship_type.id === cur.sponsorship_type_id,
                  )
                ) {
                  acc.specs.push({
                    id: cur.spec_id,
                    name: cur.spec,
                    enroll_accepted: !!cur.enroll_accepted,
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
                    enroll_accepted: !!cur.enroll_accepted,
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

              last2 = acc
              return acc
            }, {}),
        ),

      request
        .query(
          `
select *
from ic_admission_bachelors_vi_not_passed_yet
        `,
        )
        .then((result) =>
          result.recordset
            .sort((a, b) => {
              if (a.code1C < b.code1C) {
                return -1
              }
              if (a.code1C > b.code1C) {
                return 1
              }
              return 0
            })
            .reduce((acc, cur) => {
              if (acc.code1C !== cur.code1C) {
                output3.push(acc)
                return {
                  code1C: cur.code1C,
                  surname: cur.surname,
                  name: cur.name,
                  patronymic: cur.patronymic,
                  extra_score: +cur.extra_score,
                  is_doc_original: !!cur.is_doc_original,
                  privileged: !!cur.privileged,
                  dorm_required: !!cur.dorm_required,
                  date_applied: cur.date_applied,
                  exams: {
                    ege: [],
                    vi: [
                      {
                        id: cur.subject_id,
                        name: cur.subject,
                        score: +cur.score,
                      },
                    ],
                  },
                  specs: [
                    {
                      id: cur.spec_id,
                      name: cur.spec,
                      enroll_accepted: !!cur.enroll_accepted,
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
                  enroll_accepted: !!cur.enroll_accepted,
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
                if (
                  !ss.some((s) => s.admission_type.id === cur.admission_type_id)
                ) {
                  acc.specs.push({
                    id: cur.spec_id,
                    name: cur.spec,
                    enroll_accepted: !!cur.enroll_accepted,
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
                  !ss.some(
                    (s) => s.concurrency_type.id === cur.concurrency_type_id,
                  )
                ) {
                  acc.specs.push({
                    id: cur.spec_id,
                    name: cur.spec,
                    enroll_accepted: !!cur.enroll_accepted,
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
                  !ss.some(
                    (s) => s.sponsorship_type.id === cur.sponsorship_type_id,
                  )
                ) {
                  acc.specs.push({
                    id: cur.spec_id,
                    name: cur.spec,
                    enroll_accepted: !!cur.enroll_accepted,
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
                    enroll_accepted: !!cur.enroll_accepted,
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

              last3 = acc
              return acc
            }, {}),
        ),
    ])
    output1.shift()
    if (last1) output1.push(last1)
    output2.shift()
    if (last2) output2.push(last2)
    output3.shift()
    if (last3) output3.push(last3)
    const output4 = []
    for (let o1 of output1) {
      const o = output2.find((o2) => o2.code1C === o1.code1C)
      if (o) {
        o1.exams.vi = o.exams.vi
      }
      output4.push(o1)
    }
    const tmp = []
    for (let o2 of output2) {
      const o = output1.find((o1) => o1.code1C === o2.code1C)
      if (!o) {
        tmp.push(o2)
      }
    }
    for (let o3 of output3) {
      const o = output1.find((o1) => o1.code1C === o3.code1C)
      if (!o) {
        tmp.push(o3)
      }
    }
    output4.push(...tmp)
    const update_time = `${new Date(Date.now()).getHours()}:${new Date(
      Date.now(),
    ).getMinutes()}:${new Date(Date.now()).getSeconds()}`
    return output4.map((v) => ({
      ...v,
      update_time: update_time,
    }))
  } catch (e) {
    console.error('UNIVERSITYPROF admission/applicants error: ', e)
    return null
  }
}

router.route('/applicants').get((req, res, next) => {
  req.setTimeout(300000)
  if (cache.get('applicants')) {
    res.send(cache.get('applicants'))
    return false
  }
  getApplicants()
    .then((output) => {
      cache.set('applicants', output, 3600)
      res.send(output)
    })
    .catch((err) => {
      console.error(err)
      res.sendStatus(400)
    })
})

router.route('/masters').get(async (req, res, next) => {
  await poolConnection
  try {
    const result = await pool
      .request()
      .query(`select * from ic_admission_masters`)
    const output3 = []
    let last3 = null
    result.recordset
      .sort((a, b) => {
        if (a.code1C < b.code1C) {
          return -1
        }
        if (a.code1C > b.code1C) {
          return 1
        }
        return 0
      })
      .reduce((acc, cur) => {
        if (acc.code1C !== cur.code1C) {
          output3.push(acc)
          return {
            code1C: cur.code1C,
            surname: cur.surname,
            name: cur.name,
            patronymic: cur.patronymic,
            extra_score: +cur.extra_score,
            is_doc_original: !!cur.is_doc_original,
            privileged: !!cur.privileged,
            dorm_required: !!cur.dorm_required,
            date_applied: cur.date_applied,
            exams: {
              ege: [],
              vi: [
                {
                  id: cur.subject_id,
                  name: cur.subject,
                  score: +cur.score,
                },
              ],
            },
            specs: [
              {
                id: cur.spec_id,
                name: cur.spec,
                enroll_accepted: !!cur.enroll_accepted,
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
            enroll_accepted: !!cur.enroll_accepted,
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
              enroll_accepted: !!cur.enroll_accepted,
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
              enroll_accepted: !!cur.enroll_accepted,
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
              enroll_accepted: !!cur.enroll_accepted,
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
              enroll_accepted: !!cur.enroll_accepted,
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

        last3 = acc
        return acc
      }, {})
    output3.shift()
    if (last3) output3.push(last3)
    res.send(
      output3.map((v) => ({
        ...v,
        update_time: `${new Date(Date.now()).getHours()}:${new Date(
          Date.now(),
        ).getMinutes()}:${new Date(Date.now()).getSeconds()}`,
      })),
    )
  } catch (err) {
    console.error('UNIVERSITYPROF admission/sponsorship_types error: ', err)
    res.sendStatus(400)
  }
})

cache.on('expired', (key, value) => {
  getApplicants()
    .then((output) => {
      cache.set('applicants', output, 3600)
    })
    .catch((err) => {
      console.error(err)
    })
})

const getConcurrencyTypes = async () => {
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
    return output
  } catch (err) {
    console.error('UNIVERSITYPROF admission/concurrency_types error: ', err)
    return null
  }
}

router.route('/concurrency_types').get(async (req, res, next) => {
  if (cache.get('concurrency_types')) {
    res.send(cache.get('concurrency_types'))
    return false
  }
  getConcurrencyTypes()
    .then((output) => {
      cache.set('concurrency_types', output, 3600)
      res.send(output)
    })
    .catch((err) => {
      console.error(err)
      res.sendStatus(400)
    })
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
