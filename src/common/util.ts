export function noop() {}

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

export function clamp(num:number, min:number, max:number):number {
	if (num > max) return max;
	if (num < min) return min;
	return num;
}