import { Router, Request, Response } from 'express'
import mssql from '../../loaders/mssql'
import LoggerInstance from '../../loaders/logger'
const route = Router()

export default (app: Router) => {
  app.use('/schedule', route)

  route.get('/teachers', async (req: Request, res: Response) => {
    try {
      if (req.body.snp) throw 'req.body.snp is undefined, no snp provided.'
      const result = await mssql.pool1.request().query(
        `select day_number day,
            case
                      when lesson like '0%' then 0
                      when lesson like '1%' then 1
                      when lesson like '2%' then 2
                      when lesson like '3%' then 3
                      when lesson like '4%' then 4
                      when lesson like '5%' then 5
                      when lesson like '6%' then 6
                      when lesson like '7%' then 7
                      when lesson like '8%' then 8
                  end lesson_number, cabinet, cabinet_type, lecturer, _group, _subject_type, _subject, period
          from аср_расписание
          where lecturer like '%${req.body.snp}%' and datepart(year, dateadd(year, -2000, start)) = datepart(year, getdate())
          order by day_number, lesson
        `,
      )
      let getSchedule = result.recordset

      let schedule = []
      for (let i = 0; i < result.recordset.length; i++) {
        let day = getSchedule[i].day

        let lessons = []
        while (true) {
          const lesson = getSchedule[i].lesson_number
          const cabinet = getSchedule[i].cabinet
          const cabinet_type = getSchedule[i].cabinet_type
          const lecturer = getSchedule[i].lecturer
          const subject_type = getSchedule[i]._subject_type
          let subjects = []
          while (true) {
            const subject = getSchedule[i]._subject
            let groups = []
            while (true) {
              groups.push(getSchedule[i]._group)
              if (getSchedule.length - 1 === i) break
              if (
                getSchedule[i + 1].lesson_number !==
                getSchedule[i].lesson_number
              )
                break
              if (getSchedule[i + 1]._subject !== getSchedule[i]._subject) break
              else i++
            }
            subjects.push({
              name: subject,
              groups,
            })
            if (getSchedule.length - 1 === i) break
            if (
              getSchedule[i + 1].lesson_number !== getSchedule[i].lesson_number
            )
              break
          }
          lessons.push({
            lesson: lesson,
            cabinet: cabinet,
            cabinet_type: cabinet_type,
            lecturer: lecturer,
            subject_type: subject_type,
            subjects: subjects,
          })
          if (getSchedule.length - 1 === i) break
          if (getSchedule[i + 1].day !== day) break
          else i++
        }
        schedule.push({
          day: day,
          lessons,
        })
      }
      res.send(schedule)
    } catch (error) {
      LoggerInstance.error('schedule/teachers', error)
      res.sendStatus(500)
    }
  })

  route.get('/teachers', async (req: Request, res: Response) => {
    try {
      if (req.body.group_number)
        throw 'req.body.group_number is undefined, no group_number provided.'
      const result = await mssql.pool1.request().query(
        `select day_number day,
          case
                    when lesson like '0%' then 0
                    when lesson like '1%' then 1
                    when lesson like '2%' then 2
                    when lesson like '3%' then 3
                    when lesson like '4%' then 4
                    when lesson like '5%' then 5
                    when lesson like '6%' then 6
                    when lesson like '7%' then 7
                    when lesson like '8%' then 8
                end lesson_number, cabinet, cabinet_type, lecturer, _group, _subject_type, _subject, period
        from аср_расписание
        where _group like '%${req.body.group_number}%' and datepart(year, dateadd(year, -2000, start)) = datepart(year, getdate())
        order by day_number, lesson
      `,
      )
      let getSchedule = result.recordset

      let schedule = []
      for (let i = 0; i < result.recordset.length; i++) {
        let day = getSchedule[i].day

        let lessons = []
        while (true) {
          const lesson = getSchedule[i].lesson_number
          const cabinet = getSchedule[i].cabinet
          const cabinet_type = getSchedule[i].cabinet_type
          const lecturer = getSchedule[i].lecturer
          const subject_type = getSchedule[i]._subject_type
          let subjects = []
          while (true) {
            const subject = getSchedule[i]._subject
            let groups = []
            while (true) {
              groups.push(getSchedule[i]._group)
              if (getSchedule.length - 1 === i) break
              if (
                getSchedule[i + 1].lesson_number !==
                getSchedule[i].lesson_number
              )
                break
              if (getSchedule[i + 1]._subject !== getSchedule[i]._subject) break
              else i++
            }
            subjects.push({
              name: subject,
              groups,
            })
            if (getSchedule.length - 1 === i) break
            if (
              getSchedule[i + 1].lesson_number !== getSchedule[i].lesson_number
            )
              break
            if (getSchedule[i + 1].day !== day) break
          }
          lessons.push({
            lesson: lesson,
            cabinet: cabinet,
            cabinet_type: cabinet_type,
            lecturer: lecturer,
            subject_type: subject_type,
            subjects: subjects,
          })
          if (getSchedule.length - 1 === i) break
          if (getSchedule[i + 1].day !== day) break
          else i++
        }
        schedule.push({
          day: day,
          lessons,
        })
      }
      res.send(schedule)
    } catch (error) {
      LoggerInstance.error('schedule/students', error)
      res.sendStatus(500)
    }
  })
}
