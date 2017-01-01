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
classesByType[PING] = Ping;

export class UserMessage extends Message {
	public action:string;
	public params:Object;

	public get success():boolean {
		if (this.params && this.params.hasOwnProperty("success") && this.params["success"]) return true;
		return false;
	}

	public get failReason():string {
		if (this.params && this.params.hasOwnProperty("failReason")) return this.params["failReason"];
		return "Unknown reason";
	}

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
classesByType[USER] = UserMessage;

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
classesByType[CRYPTO] = CryptoMessage;

/**
 * General-purpose get. Game lists, definitions, whatever.
 */
export class GetRequest extends Message {
	public subject:string;
	public requestKey:number;
	public params:Object;

	constructor(subject:string, requestKey:number, params:Object) {
		super(GET_REQUEST);
		this.subject = subject;
		this.requestKey = requestKey;
		this.params = params;
	}

	public static fromArgs(args:Array<any>):GetRequest {
		if (
			Util.isString(args[0])
			&& Util.isInt(args[1])
			&& Util.isObject(args[2])
		) {
			return new GetRequest(args[0], args[1], args[2]);
		}
		return null;
	}

	public serialize():string {
		var s = super.serialize();
		s += JSON.stringify([this.subject, this.requestKey, this.params]);
		return s;
	}
}
classesByType[GET_REQUEST] = GetRequest;

export class GetResponse extends Message {
	public requestKey:number;
	public response:any;

	constructor(requestKey:number, response:any) {
		super(GET_RESPONSE);
		this.requestKey = requestKey;
		this.response = response;
	}

	public static fromArgs(args:Array<any>):GetResponse {
		if (Util.isInt(args[0]) && args.length == 2) return new GetResponse(args[0], args[1]);
		return null;
	}

	public serialize():string {
		var s = super.serialize();
		s += JSON.stringify([this.requestKey, this.response]);
		return s;
	}
}
classesByType[GET_RESPONSE] = GetResponse;

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

	public serialize():string {
		var s = super.serialize();
		s += JSON.stringify([this.gameId, this.frame, this.frameInterval]);
		return s;
	}
}
classesByType[GAME_STATUS] = GameStatus;