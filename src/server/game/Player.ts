import WebSocketClient from '../WebSocketClient';
import Room from './room/Room';
import Unit from './room/entity/Unit';
import Game from './Game';
import Character from './character/Character';
import Message from '../../common/messages/Message';
import * as MessageTypes from '../../common/messages/MessageTypes';

export interface MessageSender {
	user:any,
	sendMessage: (msg:Message) => void;
	send:(str:string) => void;
	player:Player,
	connected:boolean
}

export default class Player {
	private _id:number;
	private static _idNum:number = 1;

	private _serializedMessageQueue:Array<string> = [];

	public game:Game = null;
	public client:MessageSender = null;
	public character:Character = null;
	public isFake:boolean = false;

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

	public get debugString():string {
		var s:string = "Player " + this.id;
		if (this.user) {
			s += " (User " + this.user.id + ": " + this.user.name + ")";
		}

		return s;
	}

	public get hasMessages():boolean { return this._serializedMessageQueue.length > 0; }

	public subscribedRooms:Array<Room> = []; //expected to be only 1?

	constructor(game:Game) {
		this._id = Player._idNum;
		Player._idNum += 1;

		this.game = game;
	}

	public init() {

	}

	public ownsUnit(unit:Unit) {
		if (this.character && unit.characterId == this.character.id) return true;
		return false;
	}

	/**
	 * Called from WebSocketClient
	 */
	public onMessage(message:Message) {
		if (message.type === MessageTypes.ORDER)
		{
			var room: Room = this.subscribedRooms[0];
			if (room) {
				room.onPlayerOrder(this, message as MessageTypes.OrderMessage);
			}
		}
	}

	/**
	 * Queues a message to be sent at the end of the frame.
	 */
	public queueSerializedMessage(str:string) {
		this._serializedMessageQueue.push(str);
	}

	/**
	 * Sends the messages for this frame, beginning with the message describing the frame.
	 */
	public sendQueuedMessages(frameMessage:string) {
		if (this.client) {
			this.client.send(frameMessage);
			for (var str of this._serializedMessageQueue) {
				this.client.send(str);
			}
		}
		else {
			console.log(this.debugString + ": receiving messages, but no associated client!");
		}

		this._serializedMessageQueue.length = 0;
	}

	public sendMessage(msg:Message) {
		if (this.client) this.client.sendMessage(msg);
	}

	public leaveAllRooms() {
		for (var room of this.subscribedRooms) {
			room.removePlayer(this);
		}
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