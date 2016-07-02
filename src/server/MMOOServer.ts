/// <reference path='../../declarations/node.d.ts' />
/// <reference path='../../declarations/ws.d.ts' />
/// <reference path='../../declarations/mongodb.d.ts' />

import WebSocket = require('ws');
import http = require('http');
import mongodb = require('mongodb');
import YAML = require('yamljs');
import fs = require('fs');

import WebSocketClient from './WebSocketClient';

export default class MMOOServer {
	protected _settings:any;

	protected _wsServer:WebSocket.Server;
	protected _httpServer:http.Server;

	protected _wsClients = {};

	/*protected _wsPort:number;
	protected _httpPort:number;
	protected _dbName:string;
	protected _dbPort:number;
	protected _dbUser:string;
	protected _dbPass:string;*/

	constructor () {

	}

	public init() {

	}

	protected loadSettings() {
		fs.readFile('../../ServerSettings.yaml', this.onSettingsLoaded);
	}

	protected onSettingsLoaded = (err:NodeJS.ErrnoException, data:Buffer) => {
		if (err) {
			throw err;
		}
		var s:string = data.toString();
		try {
			this._settings = YAML.parse(s);
			this.connectToDatabase();
		} catch (e) {
			console.error("Failed to parse settings YAML");
		}
	}

	////////////////////////////////////////
	// MongoDB
	////////////////////////////////////////
	protected connectToDatabase() {

	}

	protected onDatabaseConnection() {

	}

	////////////////////////////////////////
	// WebSocket
	////////////////////////////////////////
	public clientExists(client:WebSocketClient) {
		return (typeof this._wsClients[client.id] !== 'undefined');
	}

	protected startWebSocketServer() {
		var port:number = this._settings.networking.wsPort;
		this._wsServer = new WebSocket.Server({port:port});
		this._wsServer.on("connection", this.onWebSocketConnect);

		console.log("WebSocket listening on port " + port);
	}

	protected onWebSocketConnect = (webSocket:WebSocket) => {
		var client:WebSocketClient = new WebSocketClient(webSocket);
		client.onMessage = this.onClientMessage;
		client.onDisconnect = this.onClientDisconnect;

		this._wsClients[client.id] = client;
	}

	protected onClientMessage = (client:WebSocketClient, msg:string) => {
		console.log(client.id + ": " + msg);
	}

	protected onClientDisconnect = (client:WebSocketClient) => {
		delete this._wsClients[client.id];
	}


	////////////////////////////////////////
	// HTTP
	////////////////////////////////////////
	protected startHttpServer() {
		var port:number = this._settings.networking.httpPort;
		this._httpServer = http.createServer(this.onHttpRequest);
		this._httpServer.listen(port, this.onHttpReady);
	}

	//the node servers will only be using HTTP to communicate with one another, this can be done vanilla
	protected onHttpRequest = (request:http.IncomingMessage, response:http.ServerResponse) => {
		//TODO: remove
		response.end("Is this your card? " + request.url);
	}

	protected onHttpReady = () => {
		var port:number = this._settings.networking.httpPort;
		console.log("HTTP listening on port " + port);
	}
}
