const router = require('express').Router()
const sql = require('mssql')
const pool = require('../../../config/config_universityPROF')
const { logger } = require('../../../lib/logger')

router.route('/teachers/:fio').get((req, res, next) => {
  pool.connect((err) => {
    if (err) res.sendStatus(400)

    const request = new sql.Request(pool)
    request.input('fio', sql.NVarChar, `%${req.params.fio}%`)
    request.query(
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
        where lecturer like @fio and datepart(year, dateadd(year, -2000, start)) = datepart(year, getdate())
        order by day_number, lesson
      `,
      (err, result) => {
        if (err) {
          logger.log('error', 'Get teachers schedule by fio error', {
            err,
          })
          res.sendStatus(400)
        }

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
                if (getSchedule[i + 1]._subject !== getSchedule[i]._subject)
                  break
                else i++
              }
              subjects.push({
                name: subject,
                groups,
              })
              if (getSchedule.length - 1 === i) break
              if (
                getSchedule[i + 1].lesson_number !==
                getSchedule[i].lesson_number
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
        pool.close()
        res.send(schedule)
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
        where _group = @group and datepart(year, dateadd(year, -2000, start)) = datepart(year, getdate())
        order by day_number, lesson
      `,
      (err, result) => {
        if (err) {
          logger.log('error', 'Get students schedule by fio error', {
            err,
          })
          res.sendStatus(400)
        }

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
                if (getSchedule[i + 1]._subject !== getSchedule[i]._subject)
                  break
                else i++
              }
              subjects.push({
                name: subject,
                groups,
              })
              if (getSchedule.length - 1 === i) break
              if (
                getSchedule[i + 1].lesson_number !==
                getSchedule[i].lesson_number
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
        pool.close()
        res.send(schedule)
      },
    )
  })
})

module.exports = router
