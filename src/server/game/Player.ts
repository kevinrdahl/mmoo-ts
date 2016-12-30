import WebSocketClient from '../WebSocketClient';
import User from '../user/User';
import Room from './room/Room';
import Game from './Game';

export default class Player {
	protected _id:number = -1;
	public get id():number { return this._id; }

	public game:Game = null;
	public client:WebSocketClient = null;
	public get user():User {
		if (this.client) return this.client.user;
		return null;
	}

	public subscribedRooms:Array<Room> = []; //expected to be only 1?

	constructor() {

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