"use strict";
function noop() { }
exports.noop = noop;
function shallowCopy(obj) {
    var ret = {};
    var keys = Object.keys(obj);
    var prop;
    for (var i = 0; i < keys.length; i++) {
        prop = keys[i];
        ret[prop] = obj[prop];
    }
    return ret;
}
exports.shallowCopy = shallowCopy;
function clamp(num, min, max) {
    if (num > max)
        return max;
    if (num < min)
        return min;
    return num;
}
exports.clamp = clamp;
//# sourceMappingURL=util.js.map