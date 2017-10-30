"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function entries(obj) {
    return Object.keys(obj)
        .map(key => [key, obj[key]]);
}
exports.entries = entries;
function values(obj) {
    return Object.keys(obj)
        .map(key => obj[key]);
}
exports.values = values;
function filter(obj, predicate) {
    const ret = {};
    for (const [key, val] of entries(obj)) {
        if (predicate(val))
            ret[key] = val;
    }
    return ret;
}
exports.filter = filter;
function composeObject(properties) {
    return properties.reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
    }, {});
}
exports.composeObject = composeObject;
function dig(object, path) {
    function _dig(obj, pathArr) {
        // are we there yet? then return obj
        if (!pathArr.length)
            return obj;
        // go deeper
        let propName = pathArr.shift();
        if (/\[\d+\]/.test(propName)) {
            // this is an array index
            propName = +propName.slice(1, -1);
        }
        return _dig(obj[propName], pathArr);
    }
    return _dig(object, path.split("."));
}
exports.dig = dig;
function bury(object, path, value) {
    function _bury(obj, pathArr) {
        // are we there yet? then return obj
        if (pathArr.length === 1) {
            obj[pathArr[0]] = value;
            return;
        }
        // go deeper
        let propName = pathArr.shift();
        if (/\[\d+\]/.test(propName)) {
            // this is an array index
            propName = +propName.slice(1, -1);
        }
        _bury(obj[propName], pathArr);
    }
    _bury(object, path.split("."));
}
exports.bury = bury;
// Kopiert Eigenschaften rekursiv von einem Objekt auf ein anderes
function extend(target, source) {
    target = target || {};
    for (const [prop, val] of entries(source)) {
        if (val instanceof Object) {
            target[prop] = extend(target[prop], val);
        }
        else {
            target[prop] = val;
        }
    }
    return target;
}
exports.extend = extend;
