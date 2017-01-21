import IDPool from '../IDPool';
import Vector2D from '../Vector2D';
//import * as MessageTypes from './MessageTypes'; moved this to bottom because of circular referencing gone wrong
import * as Util from '../Util';

export default class Message {
	private static _abbreviations:any = null;
	private static _expansions:any = null;

	public type:number;
	public params:any;

	constructor(type:number) {
		this.type = type;
	}

	public serialize():string {
		return this.type.toString();
	}

	//<type>[arg1, arg2, ..., argN]
	public static parse(s:string):Message {
		var splitIndex = s.indexOf('[');
		if (splitIndex === -1) {
			console.log("parse: nowhere to split");
			return null;
		}

		var msgType = parseInt(s.substring(0, splitIndex), 10);
		if (isNaN(msgType)) {
			console.log("parse: " + s.substring(0, splitIndex) + " is NaN");
			return null;
		}

		var args;
		try {
			args = JSON.parse(s.substring(splitIndex));
		} catch (e) {
			console.log("parse: invalid json");
			return null;
		}
		if (!Util.isArray(args)) return null;

		var msgClass = MessageTypes.getClassByType(msgType);
		if (msgClass === null) {
			console.log("parse: no class for type " + msgType);
			return null;
		}

		var msg = msgClass.fromArgs(args);
		if (msg) return msg;

		console.log("parse: class evaluator rejected arguments");
		return null;

		//decrypt, if applicable
	}

	public static fromArgs(args:Array<any>) {
		return null;
	}

	////////////////////////////////////////
	// serialization
	////////////////////////////////////////
	private static serializeParams (obj:any) : string {
		var s = JSON.stringify(Message.abbreviate(obj));
		return s.substring(1, s.length-1);
	}

	//returns an object with shorter keys using the abbreviations list
	public static abbreviate (obj:any) {
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

	/**
	 * Replaces abbreviated keys with their full counterparts.
	 * NOTE: this is in-place!
	 */
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
				val = new Vector2D(val[0], val[1]);
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

import * as MessageTypes from './MessageTypes';
