"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invertOperation = void 0;
const objects_1 = require("alcalzone-shared/objects");
function invertOperation(operation) {
    return (0, objects_1.composeObject)((0, objects_1.entries)(operation).map(([key, value]) => {
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
