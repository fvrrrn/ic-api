"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("./express"));
const mssql_1 = __importDefault(require("./mssql"));
const logger_1 = __importDefault(require("./logger"));
exports.default = async ({ expressApp }) => {
    await mssql_1.default.pool1.connect();
    logger_1.default.info('✌️ DB1 loaded and connected!');
    await mssql_1.default.pool2.connect();
    logger_1.default.info('✌️ DB2 loaded and connected!');
    await express_1.default({ app: expressApp });
    logger_1.default.info('✌️ Express loaded');
};
//# sourceMappingURL=index.js.map