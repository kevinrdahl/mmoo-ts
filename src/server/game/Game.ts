import Room from './room/Room';
import Player from './Player';
import CharacterManager from './character/CharacterManager';
import Character from './character/Character';
import WebSocketClient from '../WebSocketClient';

import Message from '../../common/messages/Message';
import * as MessageTypes from '../../common/messages/MessageTypes';
import IDObjectGroup from '../../common/IDObjectGroup';

export default class Game {
	protected _id:number;
	protected _rooms:IDObjectGroup<Room> = new IDObjectGroup<Room>();
	protected _players:IDObjectGroup<Player> = new IDObjectGroup<Player>();

	protected _characterManager:CharacterManager = new CharacterManager();

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
	public get timeSinceStart():number { return this._currentUpdateTime - this._firstUpdateTime; }
	public get characterManager():CharacterManager { return this._characterManager; }

	constructor(id:number) {
		this._id = id
	}

	public getSummary():Object {
		return {
			id: this._id,
			numPlayers: this._players.count,
			numRooms: this._rooms.list.length
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
		var timeDelta:number = (currentTime - this._currentUpdateTime) / 1000;

		this._currentUpdateTime = currentTime;

		if (this._firstUpdateTime === -1) {
			this._firstUpdateTime = currentTime;
			this._nextUpdateTime = currentTime + this._updateInterval;
			timeDelta = 0; //do nothing on the first frame? sure why not, it's a good test case if little else
		}

		this._nextUpdateTime += this._updateInterval;
		this._currentFrame += 1;


		//////////////////////////////////////////////////
		this.doUpdate(timeDelta);
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
	protected doUpdate(timeDelta:number)
	{
		for (var room of this._rooms.list) {
			room.update(timeDelta);
		}
	}

	/**
	 * Pass a Sequelize Instance of User
	 */
	public userCanJoin(user:any):boolean {
		return true;
	}

	/**
	 * Log the client in as the character defined by the given data.
	 * Assumes they have permission to be that character.
	 *
	 * If any client is playing as that client's user, boot them.
	 *
	 * @param characterData	a Sequelize Instance of Character
	 */
	public addClientAsCharacter(client:WebSocketClient, characterData:any) {
		if (!client.user) {
			console.log(this.name + ": client " + client.id + " has no user. Not adding as a player.");
		}

		var player:Player = new Player(this);
		player.client = client;
		client.player = player;

		var currentPlayers:Array<Player> = this.getPlayersByUserId(client.user.id);
		for (var currentPlayer of currentPlayers) {
			this.removePlayer(currentPlayer, "Logged in elsewhere");
		}

		var character:Character = this._characterManager.characters.getById(characterData.id);
		if (character) {
			character.player = player;
			player.character = character;
		} else {
			character = new Character(characterData);
			player.character = character;
			character.player = player;
			this.addCharacter(character);
		}

		console.log(this.name + ": User '" + client.user.name + "' entered as character " + character.name);

		client.sendMessage(new MessageTypes.GameJoined(this._id, this._currentFrame, this._updateInterval));

		//add player to room
		var room:Room = this.getPlayerRoom(player);
		room.addPlayer(player);
		//since the player has a character, the room will take care of creating a unit for it
	}

	/**
	 * Gets the room to which the player should be added.
	 */
	protected getPlayerRoom(player:Player):Room {
		return this._rooms.list[0];
	}

	/**
	 * Called when the player's WebSocketClient disconnects.
	 */
	public onPlayerDisconnect(player:Player) {
		console.log(player.debugString + " disconnected.");
		player.leaveAllRooms();
	}

	/**
	 * Adds a character to the world.
	 */
	protected addCharacter(character:Character) {
		this._characterManager.characters.add(character);
	}

	/**
	 * Removes a character from the world.
	 */
	protected removeCharacter(character:Character) {
		this._characterManager.characters.remove(character);
	}

	/**
	 * Gets all players logged in as a character owned by a user.
	 */
	public getPlayersByUserId(userId:number):Array<Player> {
		var ret:Array<Player> = [];

		for (var player of this._players.list) {
			if (player.userId == userId) {
				ret.push(player);
			}
		}

		return ret;
	}

	public removePlayer(player:Player, reason:string = null) {
		this._players.remove(player);

		if (player.client && player.client.connected) {
			//TODO: tell the client they've been removed
			if (!reason) reason = "Unknown";
			player.sendMessage(new MessageTypes.GameLeft(this._id, reason));

			player.client.player = null;
		}

		player.client = null;
	}

	protected createRoom() {
		var room:Room = new Room(this);
		room.init();

		this._rooms.add(room);
	}
}