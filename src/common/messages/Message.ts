import IDPool from '../IDPool';
import Vector2D from '../Vector2D';

export default class Message {
	private static _typesByIndex = [
		//create account, log in, character management
		'user',
		//get worlds, sign in as character, terrain info
		'world',
		//get key, send any other kind of message
		'secure',

		'ping'
	];
	private static _typesByName:any = null;
	private static _abbreviations:any = null;
	private static _expansions:any = null;

	public type:number;
	public params:any;

	constructor(type:number, params:any) {
		this.type = type;
		this.params = params;
	}

	public serialize():string {
		return this.type.toString() + '|' + Message.serializeParams(this.params);
	}

	public static parse(s:string):Message {
		//split at the first bar
		var splitIndex = s.indexOf('|');
		if (splitIndex === -1) {
			//messages with no payload should include the splitter anyway
			return null;
		}

		var msgType = parseInt(s.substring(0, splitIndex), 10);
		if (isNaN(msgType)) {
			return null;
		}

		var params;
		try {
			params = JSON.parse('{' + s.substring(splitIndex+1) + '}');
		} catch (e) {
			return null;
		}
		Message.expand(params);

		//decrypt, if applicable

		return new Message(msgType, params);
	}

	public static getTypeId (name:string) {
		if (Message._typesByName == null) Message.generateTypesByName();
		return Message._typesByName[name];
	}

	public static getTypeName (id:number) {
		return Message._typesByIndex[id];
	}

	////////////////////////////////////////
	// serialization
	////////////////////////////////////////
	private static serializeParams (obj:any) : string {
		var s = JSON.stringify(Message.abbreviate(obj));
		return s.substring(1, s.length-1);
	}

	//returns an object with shorter keys using the abbreviations list
	private static abbreviate (obj:any) {
		var clone = {};
		var keys = Object.keys(obj);
		var key, val;

		for (var i = 0; i < keys.length; i++) {
			key = keys[i];
			val = obj[key];

			if (val instanceof Vector2D) {
				val = [val.x, val.y];
			} else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
				val = Message.abbreviate(val);
			}
			clone[Message.getAbbreviation(key)] = val;
		}

		return clone
	}

	private static getAbbreviation (term:string) {
		if (Message._abbreviations == null) Message.generateAbbreviations();
		if (term.length > 2) {
			var abbreviation = Message._abbreviations[term];
			if (abbreviation) return abbreviation;
		}
		return term;
	}

	////////////////////////////////////////
	// parsing
	////////////////////////////////////////

	//NOTE: this is in-place!
	private static expand (obj:any) {
		var keys = Object.keys(obj);
		var key, val, fullKey;

		for (var i = 0; i < keys.length; i++) {
			key = keys[i];
			val = obj[key];
			fullKey = Message.getExpansion(key);

			if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
				Message.expand(val);
			} else if (Array.isArray(val)
				&& val.length === 2
				&& typeof val[0] === 'number' && typeof val[1] === 'number') {
				val = new Vector2D(val.x, val.y);
			}

			if (key !== fullKey) {
				obj[fullKey] = val;
				delete obj[key];
			}
		}
	}

	private static getExpansion (term:string) {
		if (Message._abbreviations == null) Message.generateAbbreviations();
		if (term.length > 1) {
			var expansion = Message._expansions[term];
			if (expansion) return expansion;
		}
		return term;
	}

	////////////////////////////////////////
	// private static inits
	////////////////////////////////////////
	private static generateTypesByName() {
		for (var i = 0; i < Message._typesByIndex.length; i++) {
			Message._typesByName[Message._typesByIndex[i]] = i;
		}
	}

	private static generateAbbreviations() {
		Message._abbreviations = {};
		Message._expansions = {};
		var terms = [
			'step',
			'unit',
			'direction',
			'target',
			'amount',
			'source',
			'position',
			'point',
			'destination',
			'queue',
			'killer',
			'success',
			'moveSpeed',
			'attackDamage',
			'attackRange',
			'attackSpeed',
			'radius',
			'name',
			'password',
			'success',
			'alive',
			'name',
			'action',
			'lastBroadcastPosition'
		];
		var pool = new IDPool();
		var term, abbreviation;
		
		for (var i = 0; i < terms.length; i++) {
			term = terms[i];
			abbreviation = '?' + pool.getID();
			Message._abbreviations[term] = abbreviation;
			Message._expansions[abbreviation] = term;
		}
	}
}
