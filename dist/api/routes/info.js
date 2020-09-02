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
    app.use('/info', route);
    route.get('/teachers', async (req, res) => {
        const { code1C = 'code1C', snp = 'snp' } = req.body;
        try {
            const result = await mssql_1.default.pool1
                .request()
                .input('code1C', mssql_1.default.types.Int, code1C)
                .input('snp', mssql_1.default.types.NVarChar, `%${snp}%`)
                .query(`select top(1000) *
            from ic_teachers
            where code1C = isnull(@code1C, code1C) and snp like isnull(@snp, snp)`);
            res.send(result.recordset).status(200);
        }
        catch (error) {
            logger_1.default.error('info/teachers error: ', error);
            res.sendStatus(500);
        }
    });
    route.get('/students', async (req, res) => {
        const { code1C, snp } = req.body;
        try {
            const result = await mssql_1.default.pool1
                .request()
                .input('code1C', mssql_1.default.types.Int, code1C)
                .input('snp', mssql_1.default.types.NVarChar, `%${snp}%`)
                .query(`select top(1000)
        Код_Студента code_1c,
        Фамилия surname,
        Имя name,
        Отчество patronymic,
        Код_Группы group_number,
        УчебныйГод study_years,
        Год_Поступления enrolled_year,
        Пол gender,
        Основания admission_type,
        Изучаемый_Язык additional_language,
        Дата_Рождения birth_date,
        ФормаОбучения instruction_type,
        Номер_Зачетной_Книжки record_book,
    from с_Студенты_new_1
    where Код_Студента = isnull(@code1C, Код_Студента) and Наименование like isnull(@snp, Наименование)`);
            res.send(result.recordset).status(200);
        }
        catch (error) {
            logger_1.default.error('info/students error: ', error);
            res.sendStatus(500);
        }
    });
    route.get('/groups_all', async (req, res) => {
        try {
            const result = await mssql_1.default.pool1.request().query(`
SELECT distinct [Caf], [Group]
      FROM (
		Select Case
			when [Facutet] is null THEN 'Не указана'
			ELSE [Facutet]
			END as [Caf], [_Group] as [Group]
		From [UniASR].[dbo].[аср_Расписание]
		where GETDATE() between DATEADD(YEAR, -2000, DATEADD(DAY, -30, [start])) and DATEADD(YEAR, -2000, DATEADD(DAY, 60, [finish]))
	  ) as r
	order by [Caf], [Group]
`);
            const getGroups = result.recordset;
            const groupsAll = [];
            for (let i = 0; i < getGroups.length; i++) {
                const caf = [];
                const cafNow = getGroups[i].Caf;
                while (true) {
                    const course = getGroups[i].Group.slice(0, 1);
                    const groups = [];
                    while (true) {
                        groups.push({
                            group: getGroups[i].Group,
                        });
                        if (i + 1 >= getGroups.length ||
                            getGroups[i + 1].Group.slice(0, 1) !== course)
                            break;
                        else
                            i++;
                    }
                    caf.push({
                        course,
                        groups,
                    });
                    if (i + 1 >= getGroups.length || getGroups[i + 1].Caf !== cafNow)
                        break;
                    else
                        i++;
                }
                groupsAll.push({
                    caf: cafNow,
                    courses: caf,
                });
            }
            res.send(groupsAll).status(200);
        }
        catch (error) {
            logger_1.default.error('info/groups_all error: ', error);
            res.sendStatus(500);
        }
    });
    route.get('/groups', async (req, res) => {
        const { group_number = 'Группа' } = req.body;
        try {
            const result = await mssql_1.default.pool1.request().query(`SELECT top(2000) [Код] as code_1c
        ,[Полное_Имя] as snp
        ,[Фамилия] as surname
        ,[Имя] as name
        ,[Отчество] as patronymic
        ,[Дата_Рождения] as birth_date
        ,[Пол] as sex
        ,[Форма_Обучения] as form
        ,[Факультет] as faculty
        ,[Направление] as dir
        ,[Профиль] as profile
        ,[Курс] as course
        ,[Группа] as [group]
        ,[Статус] as status
        ,[Основа] as basis
        ,[Вид_Образования] as form
        ,[Уровень_Подготовки] as level
        ,[Учебный_Год] as year
      FROM [UniversityPROF].[dbo].[су_ИнформацияОСтудентах]
      where [Группа] = @group
        and [Статус] = 'Является студентом'
      order by fio
      where [Группа] = ${group_number}
      and [Статус] = 'Является студентом'`);
            res.send(result.recordset).status(200);
        }
        catch (error) {
            logger_1.default.error('info/groups error: ', error);
            res.sendStatus(500);
        }
    });
    route.get('/snp_to_code/:snp', async (req, res) => {
        const { snp = 'snp' } = req.params;
        try {
            const result = await mssql_1.default.pool1.request().query(`SELECT *
        FROM [UniversityPROF].[dbo].[Vestra_Код1С]
        where [Name] like '%${snp}%'`);
            res.send(result.recordset).status(200);
        }
        catch (error) {
            logger_1.default.error('info/snp_to_code error: ', error);
            res.sendStatus(500);
        }
    });
};
//# sourceMappingURL=info.js.map