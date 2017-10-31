"use strict";
// tslint:disable:curly
Object.defineProperty(exports, "__esModule", { value: true });
///
/// Stellt Erweiterungsmethoden für Arrays bereit
///
/**
 * Gibt die Schnittmenge zweier numerischer Arrays aus,
 * es wird angenommen, dass sie schon sortiert sind
 * @param a
 * @param b
 */
function intersect(a, b) {
    let ai = 0;
    let bi = 0;
    const ret = [];
    while ((ai < a.length) && (bi < b.length)) {
        if (a[ai] < b[bi])
            ai++;
        else if (a[ai] > b[bi])
            bi++;
        else {
            ret.push(a[ai]);
            ai++;
            bi++;
        }
    }
    return ret;
}
exports.intersect = intersect;
/// gibt die Elemente zurück, die in a, aber nicht in b sind.
function except(a, b) {
    return a.filter((el) => b.indexOf(el) === -1);
}
exports.except = except;
/// Erzeugt ein Range-Array
function range(min, max) {
    // Potentiell Reihenfolge tauschen
    if (min > max)
        [max, min] = [min, max];
    const N = max - min + 1;
    return Array.from(new Array(N), (_, index) => index + min);
}
exports.range = range;
// Gibt das erste Element eines Array zurück, das mit dem angegebenen Filter übereinstimmt
function firstOrDefault(arr, filter) {
    for (const item of arr) {
        if (filter(item))
            return item;
    }
    return null;
}
exports.firstOrDefault = firstOrDefault;
