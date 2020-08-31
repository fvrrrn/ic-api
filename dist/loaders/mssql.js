"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = require("mssql");
const config_1 = __importDefault(require("../config"));
const pool1 = new mssql_1.ConnectionPool({
    user: config_1.default.databaseUser,
    password: config_1.default.databasePassword,
    server: config_1.default.databaseHost,
    database: config_1.default.database1,
    requestTimeout: 300000,
    options: {
        encrypt: false,
        enableArithAbort: true,
        trustServerCertificate: true,
    },
});
const pool2 = new mssql_1.ConnectionPool({
    user: config_1.default.databaseUser,
    password: config_1.default.databasePassword,
    server: config_1.default.databaseHost,
    database: config_1.default.database2,
    options: {
        encrypt: false,
        enableArithAbort: true,
        trustServerCertificate: true,
    },
});
exports.default = {
    pool1,
    pool2,
};
//# sourceMappingURL=mssql.js.map