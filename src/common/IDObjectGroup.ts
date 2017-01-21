/**
 * Anything with an id property, which is a number. It is expected to be unique.
 */
export interface IDObject {
	id: number
}

/**
 * Provides safe convenience methods for efficiently tracking a group of objects.
 * Uses an Object and an Array. The Array is public for iteration but should NOT be modified.
 */
export default class IDObjectGroup<T extends IDObject> {
	public list:Array<T> = [];
	private _map:Object = {};

	constructor() {

	}

	public add(obj:T) {
		if (this._map.hasOwnProperty(obj.id.toString())) return;

		this.list.push(obj);
		this._map[obj.id.toString()] = true;
	}

	public remove(obj:T) {
		if (!this._map.hasOwnProperty(obj.id.toString())) return;

		var index:number = this.list.indexOf(obj);
		this.list.splice(index, 1);
		delete this._map[obj.id.toString()];
	}

	public getById(id:number):T {
		var obj:T = this._map[id.toString()];
		if (obj) return obj;
		return null;
	}

	public contains(obj:T):boolean {
		return this.containsById(obj.id);
	}

	public containsById(id:number):boolean {
		return this._map.hasOwnProperty(id.toString());
	}

	public get count():number {
		return this.list.length;
	}
}