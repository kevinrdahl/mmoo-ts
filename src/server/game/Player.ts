import WebSocketClient from '../WebSocketClient';
import User from '../user/User';
import Room from './room/Room';
import Game from './Game';

export default class Player {
	private _id:number;
	private static _idNum:number = 1;

	public game:Game = null;
	public client:WebSocketClient = null;

	public get id():number {
		return this._id;
	}

	public get user():User {
		if (this.client) return this.client.user;
		return null;
	}

	public get userId():number {
		var user:User = this.user;
		if (user) return user.id;
		return -1;
	}

	public subscribedRooms:Array<Room> = []; //expected to be only 1?

	constructor() {
		this._id = Player._idNum;
		Player._idNum += 1;
	}

	public init() {

	}

	public subscribeToRoom(room:Room) {
		room.subscribePlayer(this);
	}

	public unsubscribeFromRoom(room:Room) {
		room.unsubscribePlayer(this);
	}
}