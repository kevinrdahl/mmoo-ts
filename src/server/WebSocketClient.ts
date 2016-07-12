/*
 * Ideally, this would subclass WebSocket, but the typedefs are a little messed up
 * Instead, it just wraps a socket.
 */

/// <reference path='../../declarations/ws.d.ts' />

import * as WebSocket from 'ws';
import BaseServer from './BaseServer';
import User from './user/User';
import ClientDAO from './dao/ClientDAO';
import Message from '../common/messages/Message';
import * as MessageTypes from '../common/messages/MessageTypes';

/**
 * Specifically handles WebSocket messages. Once the message's
 * type is determined, it should be passed off to the appropriate
 * class. Client, User, and Player should be regarded as
 * separate, but connected, entities.
 */
export default class WebSocketClient {
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
		this._dao = new ClientDAO(server.db);
	}

	public send(msg:string) {
		try {
			this._socket.send(msg);
		} catch (e) {
			console.error("WS SEND ERROR: " + e.toString());
		}
	}

	protected _onMessage = (data:string) => {
		var message:Message = Message.parse(data);

		if (message) {
			switch(message.type) {
				case MessageTypes.PING:
					console.log(this._id + ": Ping");
					break;

				case MessageTypes.USER:
					console.log(this._id + ": User");
					break;

				case MessageTypes.CRYPTO:
					console.log(this._id + ": Secure");
					break;

				default:
					console.log("Unkown message type " + message.type);
			}
		}

		this.onMessage(this, data);
	};

	protected _onDisconnect = () => {
		this.onDisconnect(this);
	};
}
