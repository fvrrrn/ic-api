"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mssql_1 = __importDefault(require("../../loaders/mssql"));
const logger_1 = __importDefault(require("../../loaders/logger"));
const route = express_1.Router();
exports.default = (app) => {
    app.use('/schedule', route);
    route.get('/teachers', async (req, res) => {
        try {
            if (req.body.snp)
                throw new Error('req.body.snp is undefined, no snp provided.');
            const result = await mssql_1.default.pool1.request().query(`select day_number day,
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
                  end lesson_number, cabinet, cabinetType, lecturer, _group, _subjectType, _subject, period
          from аср_расписание
          where lecturer like '%${req.body.snp}%' and datepart(year, dateadd(year, -2000, start)) = datepart(year, getdate())
          order by day_number, lesson
        `);
            const getSchedule = result.recordset;
            const schedule = [];
            for (let i = 0; i < result.recordset.length; i++) {
                const day = getSchedule[i].day;
                const lessons = [];
                while (true) {
                    const lesson = getSchedule[i].lesson_number;
                    const cabinet = getSchedule[i].cabinet;
                    const cabinetType = getSchedule[i].cabinetType;
                    const lecturer = getSchedule[i].lecturer;
                    const subjectType = getSchedule[i]._subjectType;
                    const subjects = [];
                    while (true) {
                        const subject = getSchedule[i]._subject;
                        const groups = [];
                        while (true) {
                            groups.push(getSchedule[i]._group);
                            if (getSchedule.length - 1 === i)
                                break;
                            if (getSchedule[i + 1].lesson_number !==
                                getSchedule[i].lesson_number)
                                break;
                            if (getSchedule[i + 1]._subject !== getSchedule[i]._subject)
                                break;
                            else
                                i++;
                        }
                        subjects.push({
                            name: subject,
                            groups,
                        });
                        if (getSchedule.length - 1 === i)
                            break;
                        if (getSchedule[i + 1].lesson_number !== getSchedule[i].lesson_number)
                            break;
                    }
                    lessons.push({
                        lesson,
                        cabinet,
                        cabinetType,
                        lecturer,
                        subjectType,
                        subjects,
                    });
                    if (getSchedule.length - 1 === i)
                        break;
                    if (getSchedule[i + 1].day !== day)
                        break;
                    else
                        i++;
                }
                schedule.push({
                    day,
                    lessons,
                });
            }
            res.send(schedule);
        }
        catch (error) {
            logger_1.default.error('schedule/teachers', error);
            res.sendStatus(500);
        }
    });
    route.get('/teachers', async (req, res) => {
        try {
            if (req.body.group_number)
                throw new Error('req.body.group_number is undefined, no group_number provided.');
            const result = await mssql_1.default.pool1.request().query(`select day_number day,
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
                end lesson_number, cabinet, cabinetType, lecturer, _group, _subjectType, _subject, period
        from аср_расписание
        where _group like '%${req.body.group_number}%' and datepart(year, dateadd(year, -2000, start)) = datepart(year, getdate())
        order by day_number, lesson
      `);
            const getSchedule = result.recordset;
            const schedule = [];
            for (let i = 0; i < result.recordset.length; i++) {
                const day = getSchedule[i].day;
                const lessons = [];
                while (true) {
                    const lesson = getSchedule[i].lesson_number;
                    const cabinet = getSchedule[i].cabinet;
                    const cabinetType = getSchedule[i].cabinetType;
                    const lecturer = getSchedule[i].lecturer;
                    const subjectType = getSchedule[i]._subjectType;
                    const subjects = [];
                    while (true) {
                        const subject = getSchedule[i]._subject;
                        const groups = [];
                        while (true) {
                            groups.push(getSchedule[i]._group);
                            if (getSchedule.length - 1 === i)
                                break;
                            if (getSchedule[i + 1].lesson_number !==
                                getSchedule[i].lesson_number)
                                break;
                            if (getSchedule[i + 1]._subject !== getSchedule[i]._subject)
                                break;
                            else
                                i++;
                        }
                        subjects.push({
                            name: subject,
                            groups,
                        });
                        if (getSchedule.length - 1 === i)
                            break;
                        if (getSchedule[i + 1].lesson_number !== getSchedule[i].lesson_number)
                            break;
                        if (getSchedule[i + 1].day !== day)
                            break;
                    }
                    lessons.push({
                        lesson,
                        cabinet,
                        cabinetType,
                        lecturer,
                        subjectType,
                        subjects,
                    });
                    if (getSchedule.length - 1 === i)
                        break;
                    if (getSchedule[i + 1].day !== day)
                        break;
                    else
                        i++;
                }
                schedule.push({
                    day,
                    lessons,
                });
            }
            res.send(schedule);
        }
        catch (error) {
            logger_1.default.error('schedule/students', error);
            res.sendStatus(500);
        }
    });
};
//# sourceMappingURL=schedule.js.map