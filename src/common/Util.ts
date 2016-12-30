export function noop() {}

////////////////////////////////////////
// Objects
////////////////////////////////////////
export function shallowCopy(obj:Object):Object {
    var ret = {};
    var keys = Object.keys(obj);
    var prop:string;
    for (var i = 0; i < keys.length; i++) {
        prop = keys[i];
        ret[prop] = obj[prop];
    }

    return ret;
}

////////////////////////////////////////
// Strings
////////////////////////////////////////
/**
 * Slight misnomer. Removes the first and last characters from a string. Assumes it is long enough to do so.
 */
export function stripBraces(s:string):string {
    //might more accurately be called stripFirstAndLastCharacters but that's LONG
    return s.substr(1, s.length-1);
}

////////////////////////////////////////
// Numbers
////////////////////////////////////////
export function clamp(num:number, min:number, max:number):number {
	if (num > max) return max;
	if (num < min) return min;
	return num;
}

////////////////////////////////////////
// Type Checking
////////////////////////////////////////
export function isString(x):boolean {
    return (typeof x === 'string' || x instanceof String);
}

export function isInt(x):boolean {
    return (isNumber(x) && Math.floor(x) == x);
}

export function isNumber(x):boolean {
    return (typeof x === 'number');
}

//for the sake of completeness
export function isArray(x):boolean {
    return Array.isArray(x);
}

export function isObject(x, allowNull:boolean=false):boolean {
    return (typeof x === 'object' && !isArray(x) && (x != null || allowNull));
}

/**
 * Returns true if x is an array of two numbers.
 */
export function isCoordinate(x):boolean {
    return (isArray(x) && x.length == 2 && isNumber(x[0]) && isNumber(x[1]));
}