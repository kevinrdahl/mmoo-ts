/*
 * Ideally, this would subclass WebSocket, but the typedefs are a little messed up
 * Instead, it just wraps a socket.
 */

/// <reference path='../declarations/ws.d.ts' />

import * as WebSocket from 'ws';

import BaseServer from './BaseServer';
import GameServer from './GameServer';
import Game from './game/Game';
import Player from './game/Player';
import Character from './game/character/Character';
import ClientDAO from './dao/ClientDAO';
import DAOOperation from './dao/DAOOperation';
import Message from '../common/messages/Message';
import * as MessageTypes from '../common/messages/MessageTypes';
import * as Util from '../common/Util';

/**
 * Specifically handles WebSocket messages. Once the message's
 * type is determined, it should be passed off to the appropriate
 * class. Client, User, and Player should be regarded as
 * separate, but connected, entities.
 */
export default class WebSocketClient {
	public player:Player = null;

	//handlers
	public onMessage:(client:WebSocketClient, msg:string) => void;
	public onDisconnect:(client:WebSocketClient) => void;

	protected static _idNum:number = 0;
	protected _id:string;
	protected _socket:WebSocket;
	protected _server:BaseServer;
	protected _dao:ClientDAO;
	protected _user:any = null;
	protected _connected:boolean = false;

	get id():string { return this._id; }
	get server():BaseServer { return this._server; }
	get user():any { return this._user; }
	get loggedIn():boolean { return this._user != null; }
	get inGame():boolean { return this.loggedIn && this.player != null; }
	get onGameServer():boolean { return this._server instanceof GameServer; }
	get connected():boolean { return this._connected; }

	constructor(socket:WebSocket, server:BaseServer) {
		this._id = WebSocketClient._idNum.toString();
		WebSocketClient._idNum++;

		this._socket = socket;
		this._connected = true;
		socket.on("close", this._onDisconnect);
		socket.on("message", this._onMessage);

		this._server = server;
		this._dao = new ClientDAO(server.ORM);
	}

	public send(msg:string) {
		try {
			this._socket.send(msg);
		} catch (e) {
			console.error("WS SEND ERROR: " + e.toString());
			console.log("To Client " + this.id + ": " + msg);
		}
	}

	public sendMessage(msg:Message) {
		this.send(msg.serialize());
	}

	protected _onMessage = (data:string) => {
		var message:Message = Message.parse(data);

		if (message) {
			switch(message.type) {
				case MessageTypes.PING:
					this.send(MessageTypes.Ping.fromArgs(null).serialize()); //note: the Ping message class returns a singleton in its fromArgs function
					break;

				case MessageTypes.USER:
					this.onUserMessage(message as MessageTypes.UserMessage);
					break;

				case MessageTypes.GET_REQUEST:
					this.onGetRequest(message as MessageTypes.GetRequest);
					break;

				case MessageTypes.CRYPTO:
					console.log(this._id + ": Secure");
					break;

				default:
					console.log("Unknown message type " + message.type);
			}
		} else {
			console.log("ERROR: can't parse message \"" + data + "\"");
		}

		this.onMessage(this, data);
	};

	protected _onDisconnect = () => {
		this._connected = false;
		this.onDisconnect(this);
	};

	protected onUserMessage(msg:MessageTypes.UserMessage) {
		if (!this._server.isDAOOperationAllowed(msg.action)) {
			console.log("Client " + this._id + ": User Action not allowed: " + msg.action);
			return;
		}

		var handled:boolean = false;
		var params = msg.params;

		switch (msg.action) {
			case "login":
				if (!this.loggedIn && Util.isString(params['name']) && Util.isString(params['pass'])) {
					handled = true;
					var name:string = params['name'];
					var pass:string = params['pass']; //HASH IT DUMMY
					this._dao.login(name, pass, this.onTryLogin);
				}
				break;

			case "createUser":
				//for now this looks identical, but TIMES CHANGE
				if (!this.loggedIn && Util.isString(params['name']) && Util.isString(params['pass'])) {
					handled = true;
					var name:string = params['name'];
					var pass:string = params['pass']; //DAO does the hash
					this._dao.createUser(name, pass, this.onTryCreateUser);
				}
				break;

			case "getCharacters":
				if (this.loggedIn && !this.player && Util.isInt(params['gameId'])) {
					handled = true;
					this._dao.getCharacterList(this.user.id, params['gameId'], this.onGetCharacterList);
				}
				break;

			case "createCharacter":
				if (
					Util.isInt(params['gameId'])
					&& Util.isString(params['name'])
					&& Util.isObject(params['properties'])
				) {
					handled = true;

					if (!this.loggedIn) {
						params['failReason'] = "Not logged in.";
					}
					else if (this.inGame) {
						params['failReason'] = "Already in a game.";
					} else if (!this.onGameServer) {
						params['failReason'] = "Not connected to a game server.";
					}
					else {
						var gameServer:GameServer = this._server as GameServer;
						var game:Game = gameServer.getGameById(params['gameId']);
						if (!game) {
							params['failReason'] = "Game does not exist.";
						} else if (!game.userCanJoin(this._user)) {
							params['failReason'] = "Don't have permission to create a character in that world."
						} else {
							handled = true;
							Character.sanitizeCreateCharacterProperties(params['properties']);
							this._dao.createCharacter(this._user.id, params['worldId'], params['name'], params['properties'], this.onTryCreateCharacter);
						}
					}
				}

			case "enterGame":
				if (Util.isInt(params['gameId']) && Util.isInt(params['characterId'])) {
					params['success'] = false;

					if (!this.loggedIn) {
						params['failReason'] = "Not logged in.";
					}
					else if (this.inGame) {
						params['failReason'] = "Already in a game.";
					}
					else if (!this.onGameServer) {
						params['failReason'] = "Not connected to a game server.";
					}
					else {
						var gameServer:GameServer = this._server as GameServer;
						var game:Game = gameServer.getGameById(params['gameId']);
						if (!game) {
							params['failReason'] = "Game does not exist.";
						} else if (!game.userCanJoin(this._user)) {
							params['failReason'] = "Don't have permission to join that game."
						} else {
							handled = true;
							this._dao.getCharacter(params['characterId'], this.onGetCharacterToEnterGame);
						}
					}
				}
				break;

			default:
				console.log("Unhandled but allowed User Action: " + msg.action);

			if (!handled) {
				params['success'] = false;
				if (!params.hasOwnProperty("failReason")) params['failReason'] = "Invalid argument type(s) or invalid user state";
				this.sendMessage(msg);
			}
		}
	}

	protected onGetRequest(msg:MessageTypes.GetRequest) {
		var ret:any = false;

		if (msg.subject == "games" && this.onGameServer && this.loggedIn) {
			ret = (this._server as GameServer).getGamesSummary();
		}

		var response:MessageTypes.GetResponse = new MessageTypes.GetResponse(msg.requestKey, ret);
		this.sendMessage(response);
	}

	protected onTryLogin = (operation:DAOOperation) => {
		var params = {success:operation.success};

		if (operation.success) {
			this._user = operation.result;
			this._server.onClientLogin(this);

			params["id"] = this._user.id;
			params["name"] = this._user.name;
		} else {
			params["failReason"] = operation.failReason;
		}

		var msg:Message = new MessageTypes.UserMessage(operation.type, params);
		this.sendMessage(msg);
	}

	protected onTryCreateUser = (operation:DAOOperation) => {
		var params = {success:operation.success};

		if (operation.success) {
			params["name"] = operation.data.name;
		} else {
			params["failReason"] = operation.failReason;
		}

		var msg:Message = new MessageTypes.UserMessage(operation.type, params);
		this.sendMessage(msg);
	}

	protected onTryCreateCharacter = (operation:DAOOperation) => {
		var params = {success:operation.success};

		if (operation.success) {
			params['characterId'] = operation.result.id;
		} else {
			params["failReason"] = operation.failReason;
		}

		var msg:Message = new MessageTypes.UserMessage(operation.type, params);
		this.sendMessage(msg);
	}

	protected onGetCharacterList = (operation:DAOOperation) => {
		var params = {
			success:operation.success,
			worldId:operation.data.worldId
		};

		if (operation.success) {
			params['characters'] = operation.result;
		} else {
			params['failReason'] = operation.failReason;
		}

		var msg:Message = new MessageTypes.UserMessage(operation.type, params);
		this.sendMessage(msg);
	}

	protected onGetCharacterToEnterGame = (operation:DAOOperation) => {
		var params = {
			success:operation.success,
			characterId:operation.data.characterId
		};
		var msg:Message = new MessageTypes.UserMessage(operation.type, params);

		if (operation.success) {
			var charData = operation.result;
			//are you logged in to a game server?
			if (this.loggedIn && this.onGameServer) {
				var game:Game = (this.server as GameServer).getGameById(charData.worldId);
				//is that character's game on this server?
				if (game) {
					//but does it belong to this user?
					if (this.user.id == charData.userId) {
						//hurray, you can log in
						//send the ok message before Game does anything
						this.sendMessage(msg);

						//if this or any of of your characters is ingame, it is handled by Game
						game.addClientAsCharacter(this, charData);

						//return so it isn't sent twice
						return;
					} else {
						params.success = false;
						params['failReason'] = "That's not your character";
					}
				} else {
					params.success = false;
					params['failReason'] = "Character's world isn't on this server";
				}
			} else {
				params.success = false;
				params['failReason'] = "Not on a game server";
			}
		} else {
			//operation failed somehow
			params['failReason'] = operation.failReason;
		}

		this.sendMessage(msg);
	}
}
