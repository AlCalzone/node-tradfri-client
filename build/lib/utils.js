"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objects_1 = require("alcalzone-shared/objects");
function invertOperation(operation) {
    return objects_1.composeObject(objects_1.entries(operation).map(([key, value]) => {
        switch (typeof value) {
            case "number":
                return [key, Number.NaN];
            case "boolean":
                return [key, !value];
            default:
                return [key, null];
        }
    }));
}
exports.invertOperation = invertOperation;
