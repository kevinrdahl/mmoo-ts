/*
 * Ideally, this would subclass WebSocket, but the typedefs are a little messed up
 * Instead, it just wraps a socket.
 */

/// <reference path='../../declarations/ws.d.ts' />


import WebSocket = require('ws');
import MMOOServer from './MMOOServer';
import User from './user/User';
import ClientDAO from './dao/ClientDAO';

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
	protected _server:MMOOServer;
	protected _dao:ClientDAO;
	protected _user:User = null;

	get id():string { return this._id; }
	get server():MMOOServer { return this._server; }
	get user():User { return this._user; }

	constructor(socket:WebSocket, server:MMOOServer) {
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
		this.onMessage(this, data);
	};

	protected _onDisconnect = () => {
		this.onDisconnect(this);
	};
}
