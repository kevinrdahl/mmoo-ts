/// <reference path='../../declarations/node.d.ts' />
/// <reference path='../../declarations/ws.d.ts' />
'use strict';

import * as WebSocket from 'ws';

var port: number = process.env.PORT || 3000;
var WebSocketServer = WebSocket.Server;
var server = new WebSocketServer({ port: port });

server.on('connection', ws => {
	ws.on('message', message => {
		try {
			broadcast("a");
		} catch (e) {
			console.error(e.message);
		}
	});
});

function broadcast(data: string): void {
	server.clients.forEach(client => {
		client.send(data);
	});
};

console.log('Server is running on port', port);
