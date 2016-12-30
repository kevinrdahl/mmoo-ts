import Message from './Message';
import * as Util from '../Util';

/**
 * Single-digit numbers should be reserved for very common types
 */
export const PING = 0;

/**
 * Everything else can incur the whopping 1-character payload increase
 */
export const USER = 10; //login, create account, character operations
export const CRYPTO = 11; //wraps some other message
export const GET_REQUEST = 12; //general-purpose info retrieval (eg rsa key)
export const GET_RESPONSE = 13;
export const GAME_STATUS = 14;

/**
 * Giving everything its own class makes things neat and happy. Probably.
 * This file will likely become very long, but it's basically just type checking so oh well.
 */
var classesByType = [];
classesByType[PING] = Ping;
classesByType[USER] = UserMessage;
classesByType[CRYPTO] = CryptoMessage;

export function getClassByType(type:number) {
	var c = classesByType[type];
	if (c) return c;
	return null;
}

export class Ping extends Message {
	private static _instance:Ping = new Ping();

	constructor() {
		super(PING);
	}

	public static fromArgs(args:Array<any>):Ping {
		return Ping._instance;
	}

	public serialize():string {
		return "0[]";
	}
}

export class UserMessage extends Message {
	public action:string;
	public params:Object;

	constructor(action:string, params:Object) {
		super(USER);
		this.action = action;
		this.params = params;
	}

	public static fromArgs(args:Array<any>):UserMessage {
		var action = args[0];
		var params = args[1];
		if (Util.isString(action) && Util.isObject(params)) return new UserMessage(action, params);
		return null;
	}

	public serialize():string {
		var s = super.serialize();
		s += JSON.stringify([this.action, this.params]);
		return s;
	}
}

export class CryptoMessage extends Message {
	public action:string;
	public ciphertext:string; //should decrypt to a valid message

	constructor(action:string, ciphertext:string) {
		super(CRYPTO);
		this.action = action;
		this.ciphertext = ciphertext;
	}

	public static fromArgs(args:Array<any>):CryptoMessage {
		var action = args[0];
		var ciphertext = args[1];
		if (Util.isString(action) && Util.isString(ciphertext)) return new CryptoMessage(action, ciphertext);
		return null;
	}

	public serialize():string {
		var s = super.serialize();
		s += JSON.stringify([this.action, this.ciphertext]);
		return s;
	}
}

export class GetRequest extends Message {
	public subject:string;

	constructor(subject:string) {
		super(GET_REQUEST);
		this.subject = subject;
	}

	public static fromArgs(args:Array<any>):GetRequest {
		var subject = args[0];
		if (Util.isString(subject)) return new GetRequest(subject);
		return null;
	}

	public serialize():string {
		var s = super.serialize();
		s += JSON.stringify([this.subject]);
		return s;
	}
}

export class GetResponse extends Message {
	public subject:string;
	public response:any;

	constructor(subject:string, response:any) {
		super(GET_RESPONSE);
		this.subject = subject;
		this.response = response;
	}

	public static fromArgs(args:Array<any>):GetResponse {
		var subject = args[0];
		if (Util.isString(subject) && args.length == 2) return new GetResponse(subject, args[1]);
		return null;
	}

	public serialize():string {
		var s = super.serialize();
		s += JSON.stringify([this.subject, this.response]);
		return s;
	}
}

/**
 * Reports a Game's current frame and simulation speed
 */
export class GameStatus extends Message {
	public gameId:number;
	public frame:number;
	public frameInterval:number;

	constructor(gameId:number, frame:number, frameInterval:number) {
		super(GAME_STATUS);
		this.gameId = gameId;
		this.frame = frame;
		this.frameInterval = frameInterval;
	}

	public static fromArgs(args:Array<any>):GameStatus {
		if (
			Util.isInt(args[0])
			&& Util.isInt(args[1])
			&& Util.isNumber(args[2])
			) {
			return new GameStatus(args[0], args[1], args[2]);
		}
		return null;
	}
}