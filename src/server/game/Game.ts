import Room from './room/Room';
import Player from './Player';
import PlayerGroup from './PlayerGroup';
import WebSocketClient from '../WebSocketClient';
import User from '../user/User';

import Message from '../../common/messages/Message';
import * as MessageTypes from '../../common/messages/MessageTypes';

export default class Game {
	protected static _idNum:number = 0;

	protected _id:number;
	protected _rooms:Array<Room> = [];
	protected _players:PlayerGroup = new PlayerGroup(); //these players have ENTERED the game
	protected _pendingPlayers:PlayerGroup = new PlayerGroup(); //these players have only joined

	//TODO: variable simulation rate
	protected _updateInterval:number = Math.round(1000 / 15); //update at ~15fps
	protected _currentUpdateTime:number = 0; //set at the beginning of update loop
	protected _nextUpdateTime:number = 0; //ditto
	protected _firstUpdateTime:number = -1; //for stats or something
	protected _currentFrame:number = 0; //effectively starts at 1

	public get id():number { return this._id; }
	public get name():string { return "Game " + this._id; }
	public get currentFrame():number { return this._currentFrame; }
	public get currentTime():number { return this._currentUpdateTime; }

	constructor() {
		this._id = Game._idNum;
		Game._idNum += 1;
	}

	public getSummary():Object {
		return {
			id: this._id,
			numPlayers: this._players.length,
			numRooms: this._rooms.length
		};
	}

	public start() {
		console.log(this.name + ": start");

		this.createRoom(); //for now just make one room
		this.update();
	}

	/**
	 * The root of all. Core game loop.
	 * Calls update on a bunch of other things, with a time delta.
	 */
	public update() {
		var currentTime = Date.now();
		var timeElapsed:number = (currentTime - this._currentUpdateTime) / 1000;

		this._currentUpdateTime = currentTime;

		if (this._firstUpdateTime === -1) {
			this._firstUpdateTime = currentTime;
			this._nextUpdateTime = currentTime + this._updateInterval;
			timeElapsed = 0; //do nothing on the first frame? sure why not, it's a good test case if little else
		}

		this._nextUpdateTime += this._updateInterval;
		this._currentFrame += 1;


		//////////////////////////////////////////////////
		this.doUpdate(timeElapsed);
		//////////////////////////////////////////////////


		//TODO: see if frames are taking too long
		currentTime = Date.now();
		var _this = this;
		setTimeout(function() {
			_this.update();
		}, Math.max(1, this._nextUpdateTime - currentTime));
	}

	/**
	 * Actually does the update. For neatness' sake.
	 */
	protected doUpdate(timeElapsed:number)
	{
		for (var i = 0; i < this._rooms.length; i++)
		{
			this._rooms[i].update(timeElapsed);
		}
	}

	public userCanJoin(user:User):boolean {
		return true;
	}

	public addClientAsPlayer(client:WebSocketClient) {
		if (!client.user) {
			console.log(this.name + ": client " + client.id + " has no user. Not adding as a player.");
		}

		var player:Player = new Player();
		player.client = client;
		client.player = player;

		//save this for entering the game
		//client.sendMessage(new MessageTypes.GameStatus(this._id, this._currentFrame, this._updateInterval));

		this._pendingPlayers.addPlayer(player);
	}

	//TODO: as character
	public playerEnterGame(player:Player) {
		if (this._players.containsPlayer(player)) {
			console.log(this.name + ": player has already entered the game");
			return;
		}

		this._pendingPlayers.removePlayer(player);
		this._players.addPlayer(player);
	}

	public removeClient(client:WebSocketClient) {
		if (client.player) {
			this._players.removePlayer(client.player);
			this._pendingPlayers.removePlayer(client.player);
			client.player = null;
		}
	}

	protected createRoom() {
		var room:Room = new Room(this);
		room.init();

		this._rooms.push(room);
	}
}