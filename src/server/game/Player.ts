import WebSocketClient from '../WebSocketClient';
import Room from './room/Room';
import Game from './Game';
import Character from './character/Character';
import Message from '../../common/messages/Message';
import * as MessageTypes from '../../common/messages/MessageTypes';

export default class Player {
	private _id:number;
	private static _idNum:number = 1;

	public game:Game = null;
	public client:WebSocketClient = null;
	public character:Character = null;

	public get id():number {
		return this._id;
	}

	public get user():any {
		if (this.client) return this.client.user;
		return null;
	}

	public get userId():number {
		var user:any = this.user;
		if (user) return user.id;
		return -1;
	}

	public subscribedRooms:Array<Room> = []; //expected to be only 1?

	constructor(game:Game) {
		this._id = Player._idNum;
		Player._idNum += 1;

		this.game = game;
	}

	public init() {

	}

	public sendMessage(msg:Message) {
		if (this.client) this.client.sendMessage(msg);
	}

	public onSubscribeToRoom(room:Room) {
		this.subscribedRooms.push(room);
		this.sendMessage(new MessageTypes.RoomJoined(room.id));
	}

	public onUnsubscribeFromRoom(room:Room) {
		this.subscribedRooms.splice(this.subscribedRooms.indexOf(room), 1);
		this.sendMessage(new MessageTypes.RoomLeft(room.id));
	}
}