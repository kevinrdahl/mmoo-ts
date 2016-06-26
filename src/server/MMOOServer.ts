/// <reference path='../../declarations/node.d.ts' />
/// <reference path='../../declarations/ws.d.ts' />

import WebSocket = require('ws');

export default class MMOOServer {
	protected wsServer:WebSocket.Server;
	//TODO: httpserver

	protected wsClients = {};

	constructor () {

	}

	
}
