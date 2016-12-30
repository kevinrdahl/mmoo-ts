/*
 * Ideally, this would subclass WebSocket, but the typedefs are a little messed up
 * Instead, it just wraps a socket.
 */

/// <reference path='../../declarations/ws.d.ts' />

import * as WebSocket from 'ws';

import BaseServer from './BaseServer';
import User from './user/User';
import Player from './game/Player';
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
	protected _user:User = null;

	get id():string { return this._id; }
	get server():BaseServer { return this._server; }
	get user():User { return this._user; }

	constructor(socket:WebSocket, server:BaseServer) {
		this._id = WebSocketClient._idNum.toString();
		WebSocketClient._idNum++;

		this._socket = socket;
		socket.on("close", this._onDisconnect);
		socket.on("message", this._onMessage);

		this._server = server;
		this._dao = new ClientDAO(server.mongo);
	}

	public send(msg:string) {
		try {
			this._socket.send(msg);
		} catch (e) {
			console.error("WS SEND ERROR: " + e.toString());
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
		this.onDisconnect(this);
	};

	protected onUserMessage(msg:MessageTypes.UserMessage) {
		if (!this._server.isDAOOperationAllowed(msg.action)) {
			console.log("Client " + this._id + ": User Action not allowed: " + msg.action);
			return;
		}

		var params = msg.params;

		switch (msg.action) {
			case "login":
				if (Util.isString(params['name']) && Util.isString(params['pass'])) {
					var name:string = params['name'];
					var pass:string = params['pass']; //HASH IT DUMMY
					this._dao.login(name, pass, this.onTryLogin);
				}
				break;

			case "createUser":
				//for now this looks identical, but TIMES CHANGE
				if (Util.isString(params['name']) && Util.isString(params['pass'])) {
					var name:string = params['name'];
					var pass:string = params['pass']; //DAO does the hash
					this._dao.createUser(name, pass, this.onTryCreateUser);
				}
				break;

			default:
				console.log("Unhandled but allowed User Action: " + msg.action);
		}
	}

	protected onTryLogin = (operation:DAOOperation) => {
		var params = {success:operation.success};

		if (operation.success) {
			this._user = new User(operation.result);
			this._server.onClientLogin(this);

			params["name"] = this._user.name;
			params["options"] = operation.result.options;
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
}
