export default class AssetCache<T> {
	private _assets:Object = {};
	private _keyQueue:Array<string> = [];
	private _capacity:number;

	get capacity():number { return this._capacity; }
	set capacity(value) { this._capacity = value; this.removeExcess(); }

	/**
	 * Stores objects by key, and discards the oldest once capacity is reached.
	 * TODO: Option to keep the most recently used (move to top when accessed, requires LinkedList)
	 */
	constructor(capacity:number) {
		this._capacity = capacity;
	}

	public get(key:string):T {
		var asset:T = this._assets[key];
		if (!asset) asset = null;
		return asset;
	}

	public set(key:string, asset:T) {
		if (this.get(key) === null) return;

		this._assets[key] = asset;
		this._keyQueue.push(key);
		this.removeExcess();
	}

	private removeExcess() {
		if (this._capacity < 1) return;

		while (this._keyQueue.length > this._capacity) {
			delete this._assets[this._keyQueue.shift()];
		}
	}
}