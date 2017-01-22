/**
 * Generates string IDs from an alphabet. IDs can be relinquished and recycled to keep them short.
 */
export default class IDPool {
	private static _defaultAlphabet:string = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ~`!@#$%^&*()-_=+[]{}|;:<>,.?/';
	private static _alphanumeric:string = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

	private _indeces:Array<number> = [0];
	private _unused:Array<string> = [];
	private _maxUnused:number = 100;
	private _alphabet:string;

	set maxUnused(num) {
		this._maxUnused = num;
		var len = this._unused.length;
		if (len > num) this._unused.splice(num-1, len-num);
	}

	/**
	 * Generates string IDs from an alphabet. IDs can be relinquished and recycled to keep them short.
	 */
	constructor(alphabet:string = IDPool._defaultAlphabet) {
		this._alphabet = alphabet;
	}

	public getID():string {
		if (this._unused.length > 0) return this._unused.pop();
		else return this._createID();
	}

	//Use this to keep messaged ids short, saving some bandwidth
	public relinquishID(id:string) {
		if (this._unused.length < this._maxUnused) this._unused.push(id);
	}

	private _createID():string {
		var id:string = '';

		for (var i = 0; i < this._indeces.length; i++) {
			//allegedly, concat performance is comparable to, if not better than join
			id += this._alphabet[this._indeces[i]];
		}

		this._increment();
		return id;
	}

	private _increment() {
		var index = this._indeces.length-1;

		while (true) {
			this._indeces[index] += 1;
			if (this._indeces[index] == this._alphabet.length) {
				this._indeces[index] = 0;
				index -= 1;
				if (index < 0)
					this._indeces.unshift(0);
				else
					continue;
			}
			break;
		}
	}
}
