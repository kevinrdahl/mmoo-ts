/*
 * Ideally, this would subclass WebSocket, but the typedefs are a little messed up
 * Instead, it just wraps a socket.
 */

/// <reference path='../../declarations/ws.d.ts' />


import WebSocket = require('ws');

export default class WebsocketClient {
	public onMessage:(client:WebsocketClient, msg:string) => void;
	public onDisconnect:(client:WebsocketClient) => void;
	public messageQueue:Array<any> = [];

	private static _idNum:number = 0;
	private _id:string;
	private _socket:WebSocket;

	get id():string { return this._id; }

	constructor(socket:WebSocket) {
		this._id = WebsocketClient._idNum.toString();
		WebsocketClient._idNum++;

		this._socket = socket;
		socket.on("close", this._onDisconnect);
		socket.on("message", this._onMessage);
	}

	public send(msg:string) {
		try {
			this._socket.send(msg);
		} catch (e) {
			console.error("WS SEND ERROR: " + e.toString());
		}
	}

	private _onMessage = (data:string) => {
		this.onMessage(this, data);
	};

	private _onDisconnect = () => {
		this.onDisconnect(this);
	};
}
