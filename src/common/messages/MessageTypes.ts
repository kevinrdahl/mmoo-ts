import Message from './Message';
import * as Util from '../Util';
import Vector2D from '../Vector2D';

//Single-digit numbers should be reserved for very common types (messages FROM server)
////////////////////////////////////////////////////////////////////////////////

export const PING = 0;
export const UNIT_MOVED = 1; //a unit's direction has changed;
export const UNIT_HP_CHANGED = 2;
export const UNIT_ATTACKED = 3;

//Everything else can incur the whopping 1-character payload increase
////////////////////////////////////////////////////////////////////////////////

export const USER = 10; //login, create account, character operations
export const CRYPTO = 11; //wraps some other message
export const GET_REQUEST = 12; //general-purpose info retrieval (eg rsa key)
export const GET_RESPONSE = 13;
export const GAME_JOINED = 14; //also contains information about the game's state
export const GAME_LEFT = 15;
export const ROOM_JOINED = 16;
export const ROOM_LEFT = 17;
export const FRAME = 18;
export const ORDER = 19;

//I suspect there will be many unit message types. Reserve [50,99] for
//all but the most common unit messages
////////////////////////////////////////////////////////////////////////////////

export const UNIT_SEEN = 50; //must also contain a description of the unit
export const UNIT_UNSEEN = 51;

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
 * User has joined the Game
 * Reports the Game's current frame and simulation speed
 */
export class GameJoined extends Message {
	public gameId:number;
	public frame:number;
	public frameInterval:number;

	constructor(gameId:number, frame:number, frameInterval:number) {
		super(GAME_JOINED);
		this.gameId = gameId;
		this.frame = frame;
		this.frameInterval = frameInterval;
	}

	public static fromArgs(args:Array<any>):GameJoined {
		if (
			Util.isInt(args[0])
			&& Util.isInt(args[1])
			&& Util.isNumber(args[2])
			) {
			return new GameJoined(args[0], args[1], args[2]);
		}
		return null;
	}

	public serialize():string {
		var s = super.serialize();
		s += JSON.stringify([this.gameId, this.frame, this.frameInterval]);
		return s;
	}
}
classesByType[GAME_JOINED] = GameJoined;

/**
 * User has left the Game
 */
export class GameLeft extends Message {
	public gameId:number;
	public reason:string;

	constructor(gameId:number, reason:string) {
		super(GAME_LEFT);
		this.gameId = gameId;
		this.reason = reason;
	}

	public static fromArgs(args:Array<any>):GameLeft {
		if (Util.isInt(args[0]) && Util.isString(args[1])) {
			return new GameLeft(args[0], args[1]);
		}
		return null;
	}

	public serialize():string {
		var s = super.serialize();
		s += JSON.stringify([this.gameId, this.reason]);
		return s;
	}
}
classesByType[GAME_LEFT] = GameLeft;

/**
 * Player sees a Room. Might need to say more later, hence its own type.
 */
export class RoomJoined extends Message {
	public roomId:number;

	constructor(gameId:number) {
		super(ROOM_JOINED);
		this.roomId = gameId;
	}

	public static fromArgs(args:Array<any>):RoomJoined {
		if (Util.isInt(args[0])) {
			return new RoomJoined(args[0]);
		}
		return null;
	}

	public serialize():string {
		var s = super.serialize();
		s += JSON.stringify([this.roomId]);
		return s;
	}
}
classesByType[ROOM_JOINED] = RoomJoined;

/**
 * Player doesn't see this Room anymore
 */
export class RoomLeft extends Message {
	public roomId:number;

	constructor(gameId:number) {
		super(ROOM_LEFT);
		this.roomId = gameId;
	}

	public static fromArgs(args:Array<any>):RoomLeft {
		if (Util.isInt(args[0])) {
			return new RoomLeft(args[0]);
		}
		return null;
	}

	public serialize():string {
		var s = super.serialize();
		s += JSON.stringify([this.roomId]);
		return s;
	}
}
classesByType[ROOM_LEFT] = RoomLeft;

/**
 * A unit's direction has changed.
 */
export class UnitMoved extends Message {
	constructor(
		public unitId:number,
		public direction:number,
		public position:Vector2D
	) { super(UNIT_MOVED); }

	public static fromArgs(args:Array<any>):UnitMoved {
		if (Util.isInt(args[0]) && Util.isInt(args[1]) && Util.isCoordinate(args[2])) {
			return new UnitMoved(args[0], args[1], Vector2D.fromArrayUnchecked(args[2]));
		}
		return null;
	}

	public serialize():string {
		var s = super.serialize();
		s += JSON.stringify([this.unitId, this.direction, this.position.round()]);
		return s;
	}
}
classesByType[UNIT_MOVED] = UnitMoved;

/**
 * A unit appears or otherwise becomes visible. Contains everything a client
 * should need to know about a unit. An additional message with more information
 * should be sent to the unit's owner, if applicable.
 *
 * Just a JSON object? This is likely to be a good data optimization target in future.
 */
export class UnitSeen extends Message {
	/**
	 * Data should be created by the Unit class.
	 */
	constructor(
		public data:any
	) { super(UNIT_SEEN); }

	public static fromArgs(args:Array<any>):UnitSeen {
		if (args.length == 1) {
			return new UnitSeen(args[0]);
		}
		return null;
	}

	public serialize():string {
		return super.serialize() + JSON.stringify([this.data]);
	}
}
classesByType[UNIT_SEEN] = UnitSeen;

/**
 * Player can no longer see this unit, for whatever reason.
 */
export class UnitUnseen extends Message {
	constructor (
		public unitId:number
	) { super(UNIT_UNSEEN); }

	public static fromArgs(args:Array<any>):UnitUnseen {
		if (Util.isInt(args[0])) {
			return new UnitUnseen(args[0]);
		}
		return null;
	}

	public serialize():string {
		return super.serialize() + JSON.stringify([this.unitId]);
	}
}
classesByType[UNIT_UNSEEN] = UnitUnseen;

export class Frame extends Message {
	constructor (
		public frameId:number,
		public time:number
	) { super(FRAME); }

	public static fromArgs(args:Array<any>):Frame {
		if (Util.isInt(args[0]) && Util.isNumber(args[1])) {
			return new Frame(args[0], args[1]);
		}
		return null;
	}

	public serialize():string {
		return super.serialize() + JSON.stringify([this.frameId, this.time]);
	}
}
classesByType[FRAME] = Frame;

export class OrderMessage extends Message {
	constructor (
		public unitId:number,
		public str:string,
		public params:any,
		public queue:boolean
	) { super(ORDER); }

	public static fromArgs(args:Array<any>):OrderMessage {
		if (Util.isInt(args[0]) && Util.isString(args[1]) && Util.isObject(args[2])) {
			return new OrderMessage(args[0], args[1], args[2], Boolean(args[3]));
		}
		return null;
	}

	public serialize():string {
		var queue = (this.queue) ? 1 : 0;
		return super.serialize() + JSON.stringify([this.unitId, this.str, this.params, queue]);
	}
}
classesByType[ORDER] = OrderMessage;