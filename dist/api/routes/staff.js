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
    app.use('/staff', route);
    route.get('/', async (req, res) => {
        const { code1C = 'code1C', snp = 'snp' } = req.body;
        try {
            const result = await mssql_1.default.pool2.request().query(`select код, наименование, датарождения
        from kadry1c.dbo.справочник_физическиелица
        where наименование like '%${snp}%'`);
            res.send(result.recordset).status(200);
        }
        catch (error) {
            logger_1.default.error('info/teachers error: ', error);
            res.sendStatus(500);
        }
    });
};
//# sourceMappingURL=staff.js.map