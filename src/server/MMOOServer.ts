/// <reference path='../../declarations/node.d.ts' />
/// <reference path='../../declarations/ws.d.ts' />

import WebSocket = require('ws');
import WebsocketClient from './WebsocketClient';

export default class MMOOServer {
	protected wsServer:WebSocket.Server;
	//TODO: httpserver

	protected wsClients = {};

	constructor () {

	}

	protected onClientConnect(client:WebsocketClient) {

	}

	protected onClientMessage(client:WebsocketClient, msg:string) {

	}

	protected onClientDisconnect(clielt:WebsocketClient, msg:string) {
		
	}
}
