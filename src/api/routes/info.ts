import { Router, Request, Response } from 'express'
import mssql from '../../loaders/mssql'
import LoggerInstance from '../../loaders/logger'
const route = Router()

export default (app: Router) => {
  app.use('/info', route)

  route.get('/teachers', async (req: Request, res: Response) => {
    const { code1C = 'code1C', snp = 'snp' } = req.body
    try {
      const result = await mssql.pool1.request().query(
        `select top(1000) *
            from ic_teachers
            where code_1c = ${code1C} and snp = ${snp}`,
      )
      res.send(result.recordset).status(200)
    } catch (error) {
      LoggerInstance.error('info/teachers error: ', error)
      res.sendStatus(500)
    }
  })

  route.get('/students', async (req: Request, res: Response) => {
    const { code1C = 'Код_Студента', snp = 'Наименование' } = req.body
    try {
      const result = await mssql.pool1.request().query(
        `select top(1000)
        Код_Студента code_1c,
        Наименование snp,
        Фамилия surname,
        Имя name,
        Отчество patronymic,
        Статус status,
        Код_Группы group_number,
        УчебныйГод study_year,
        Год_Поступления enrolled_year,
        Пол gender,
        Основания,
        Изучаемый_Язык additional_language,
        Долг,
        Дата_Рождения birth_date,
        Пособие,
        Общежитие dormatory,
        ГодРождения birth_year,
        ФормаОбучения instruction_type,
        НаучнаяСпециальность,
        ДатаЗачисления,
        НомерПриказаОЗачислении,
        ДатаОкончания,
        МестоРаботы,
        ПрикрепКафедра,
        НаучныйРуководитель,
        ПродлениеСессии,
        УчебныйПлан,
        АкадемСправка,
        ТемаДиплома,
        Город_ПП,
        Регион_ПП,
        Страна_ПП,
        Номер_Зачетной_Книжки,
        E_Mail,
        Улица_ПП,
        Дом_Кв_ПП,
        Мобильный,
        Телефон_ПП,
        Гражданство,
        Номер_договора
    from с_Студенты_new_1
    where Код_Студента = ${code1C} and Наименование = ${snp}`,
      )
      res.send(result.recordset).status(200)
    } catch (error) {
      LoggerInstance.error('info/students error: ', error)
      res.sendStatus(500)
    }
  })

  route.get('/groups_all', async (req: Request, res: Response) => {
    try {
      const result = await mssql.pool1.request().query(
        `
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
`,
      )
      const getGroups = result.recordset

      const groupsAll = []
      for (let i = 0; i < getGroups.length; i++) {
        const caf = []
        const cafNow = getGroups[i].Caf
        while (true) {
          const course = getGroups[i].Group.slice(0, 1)
          const groups = []
          while (true) {
            groups.push({
              group: getGroups[i].Group,
            })
            if (
              i + 1 >= getGroups.length ||
              getGroups[i + 1].Group.slice(0, 1) !== course
            )
              break
            else i++
          }
          caf.push({
            course,
            groups,
          })
          if (i + 1 >= getGroups.length || getGroups[i + 1].Caf !== cafNow)
            break
          else i++
        }
        groupsAll.push({
          caf: cafNow,
          courses: caf,
        })
      }
      res.send(groupsAll).status(200)
    } catch (error) {
      LoggerInstance.error('info/groups_all error: ', error)
      res.sendStatus(500)
    }
  })

  route.get('/groups', async (req: Request, res: Response) => {
    const { group_number = 'Группа' } = req.body
    try {
      const result = await mssql.pool1.request().query(
        `SELECT top(2000) [Код] as code_1c
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
      and [Статус] = 'Является студентом'`,
      )
      res.send(result.recordset).status(200)
    } catch (error) {
      LoggerInstance.error('info/groups error: ', error)
      res.sendStatus(500)
    }
  })

  route.get('/snp_to_code/:snp', async (req: Request, res: Response) => {
    const { snp = 'snp' } = req.params
    try {
      const result = await mssql.pool1.request().query(
        `SELECT *
        FROM [UniversityPROF].[dbo].[Vestra_Код1С]
        where [Name] like '%${snp}%'`,
      )
      res.send(result.recordset).status(200)
    } catch (error) {
      LoggerInstance.error('info/snp_to_code error: ', error)
      res.sendStatus(500)
    }
  })
}
