import { Router, Request, Response } from 'express'
import mssql from '../../loaders/mssql'
import LoggerInstance from '../../loaders/logger'
const route = Router()

export default (app: Router) => {
  app.use('/admission', route)

  route.get('/bachelors', async (req: Request, res: Response) => {
    try {
      const request = mssql.pool1.request()
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
                    !ss.some(
                      (s) => s.admission_type.id === cur.admission_type_id,
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
                  if (
                    !ss.some((s) => s.degree_type.id === cur.degree_type_id)
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
                    !ss.some(
                      (s) => s.admission_type.id === cur.admission_type_id,
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
                  if (
                    !ss.some((s) => s.degree_type.id === cur.degree_type_id)
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
                    !ss.some(
                      (s) => s.admission_type.id === cur.admission_type_id,
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
                  if (
                    !ss.some((s) => s.degree_type.id === cur.degree_type_id)
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
      let applicants = []
      for (let o1 of output1) {
        const o = output2.find((o2) => o2.code1C === o1.code1C)
        if (o) {
          o1.exams.vi = o.exams.vi
        }
        applicants.push(o1)
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
      applicants.push(...tmp)
      const update_time = `${new Date(Date.now()).getHours()}:${new Date(
        Date.now(),
      ).getMinutes()}:${new Date(Date.now()).getSeconds()}`
      applicants = applicants.map((v) => ({
        ...v,
        update_time: update_time,
      }))

      res.status(200)
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked',
      })
      for (const a of applicants) {
        res.write(JSON.stringify(a))
      }
      res.end()
    } catch (e) {
      LoggerInstance.error('admission/applicants error: ', e)
      res.status(401)
    }
  })

  route.get('/masters', async (req: Request, res: Response) => {
    try {
      const result = await mssql.pool1
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
    } catch (error) {
      LoggerInstance.error('admission/sponsorship_types error: ', error)
      res.sendStatus(500)
    }
  })

  route.get('/concurrency_types', async (req: Request, res: Response) => {
    try {
      const result = await mssql.pool1.request().query(`
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
      res.send(output).status(200)
    } catch (err) {
      LoggerInstance.error(
        'UNIVERSITYPROF admission/concurrency_types error: ',
        err,
      )
      res.sendStatus(500)
    }
  })

  route.get('/spec_types', async (req: Request, res: Response) => {
    try {
      const result = await mssql.pool1
        .request()
        .query(
          `SELECT DISTINCT Код id, Наименование name FROM Справочник_Специальности`,
        )
      res.send(result.recordset)
    } catch (error) {
      console.error('UNIVERSITYPROF admission/spec_types error: ', error)
      res.sendStatus(500)
    }
  })

  route.get('/sponsorship_types', async (req: Request, res: Response) => {
    try {
      const result = await mssql.pool1
        .request()
        .query(
          `SELECT Код id, Наименование name FROM Справочник_ОснованияПоступления`,
        )
      res.send(result.recordset)
    } catch (error) {
      console.error('admission/sponsorship_types error: ', error)
      res.sendStatus(500)
    }
  })

  route.get('/admission_types', async (req: Request, res: Response) => {
    try {
      const result = await mssql.pool1
        .request()
        .query(
          `SELECT Код id, Наименование name FROM Справочник_Категорииприема`,
        )
      res.send(result.recordset)
    } catch (error) {
      LoggerInstance.error('admission/admission_types error: ', error)
      res.sendStatus(500)
    }
  })
}
