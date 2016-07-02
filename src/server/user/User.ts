import UserOptions from './UserOptions';

export default class User {
	protected _name:string;
	protected _pass:string = null;
	protected _options:UserOptions;

	get options():UserOptions { return this._options; }

	constructor(name:string, pass:string, options:UserOptions) {
		this._name = name;
		this._pass = pass;
		this._options = options;
	}

	public static fromDoc (doc:any):User {
		return new User(doc.name, doc.pass, doc.options);
	}

	public static createNew (name:string, pass:string):User {
		return new User(name, pass, UserOptions.createDefault());
	}

	public toDoc() {
		var doc = {
			name:this._name,
			pass:this._pass,
			options:this._options.toDoc()
		};
		return doc;
	}
}