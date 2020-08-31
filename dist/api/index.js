"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admission_1 = __importDefault(require("./routes/admission"));
const info_1 = __importDefault(require("./routes/info"));
const schedule_1 = __importDefault(require("./routes/schedule"));
const staff_1 = __importDefault(require("./routes/staff"));
// guaranteed to get dependencies
exports.default = () => {
    const app = express_1.Router();
    admission_1.default(app);
    info_1.default(app);
    schedule_1.default(app);
    staff_1.default(app);
    return app;
};
//# sourceMappingURL=index.js.map