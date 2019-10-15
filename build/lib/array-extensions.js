"use strict";
// tslint:disable:curly
Object.defineProperty(exports, "__esModule", { value: true });
///
/// Stellt Erweiterungsmethoden für Arrays bereit
///
// gibt die Elemente zurück, die in a, aber nicht in b sind.
function except(a, b) {
    return a.filter((el) => b.indexOf(el) === -1);
}
exports.except = except;
// Gibt das erste Element eines Array zurück, das mit dem angegebenen Filter übereinstimmt
function firstOrDefault(arr, filter) {
    for (const item of arr) {
        if (filter(item))
            return item;
    }
    return null;
}
exports.firstOrDefault = firstOrDefault;
