export default class AssetCache<T> {
	private _assets:Object = {};
	private _keyQueue:Array<string> = [];
	private _capacity:number;

	get capacity():number { return this._capacity; }
	set capacity(value) { this._capacity = value; this.removeExcess(); }

	public onDelete:(asset:T)=>void = null;

	/**
	 * Stores objects by key, and discards the oldest once capacity is reached.
	 * TODO: Option to keep the most recently used (move to top when accessed, requires LinkedList)
	 *
	 * If you use this for PIXI.Texture, be sure to set the onDelete to call destroy.
	 */
	constructor(capacity:number, onDelete:(asset:T)=>void = null) {
		this._capacity = capacity;
		this.onDelete = onDelete;
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

		var key:string = this._keyQueue.shift();
		while (this._keyQueue.length > this._capacity) {
			if (this.onDelete) this.onDelete(this._assets[key]);
			delete this._assets[key];
		}
	}
}