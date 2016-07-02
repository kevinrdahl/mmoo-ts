export default class UserOptions {
	public changed:boolean = false;

	protected _sound:boolean = true;

	get sound():boolean { return this._sound; }

	set sound(value:boolean) {
		if (value != this._sound) {
			this._sound = value;
			this.changed = true;
		}
	}

	constructor(options:Object) {
		var sound = options["sound"];
		if (typeof sound === "boolean") this._sound = sound;
	}

	public static createDefault():UserOptions {
		return new UserOptions({});
	}

	public toDoc() {
		return {
			sound:this._sound
		};
	}
}