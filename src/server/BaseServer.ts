/// <reference path='../declarations/node.d.ts' />
/// <reference path='../declarations/ws.d.ts' />
/// <reference path='../declarations/yamljs.d.ts' />

import * as WebSocket from 'ws';
import * as http from 'http';
import * as YAML from 'yamljs';
import * as fs from 'fs';

let mysql = require('mysql');

import WebSocketClient from './WebSocketClient';
import FunctionQueue from '../common/FunctionQueue';
import ORM from './ORM';

/**
 * Base server class. Gets everything running, but should be extended
 * rather than used directly.
 */
export default class BaseServer {
	protected _settingsPath:string;
	protected _settings:any;

	protected _wsServer:WebSocket.Server;
	protected _httpServer:http.Server;
	protected _orm;

	protected _wsClients:Object = {};
	protected _allowedDAOOperations:Object = {};

	get name():string { return this._settings.server.name; }
	get ORM():any { return this._orm; }

	constructor (settingsPath:string) {
		this._settingsPath = settingsPath;

		this._allowedDAOOperations["checkIfUserExists"] = true;
		this._allowedDAOOperations["login"] = true;
	}

	protected _initQueue:FunctionQueue;
	public init() {
		this.loadSettings(); //rest of init takes place in onSettingsLoadedSuccess
	}

	public isDAOOperationAllowed(opName:string):boolean {
		return (this._allowedDAOOperations[opName] === true || this._allowedDAOOperations["*"] === true);
	}

	protected onReady() {
		console.log("Server '" + this.name + "' ready!");
	}

	////////////////////////////////////////
	// Settings
	////////////////////////////////////////
	protected loadSettings() {
		console.log("Loading settings...");
		fs.readFile(this._settingsPath, this.onSettingsLoaded);
	}

	protected onSettingsLoaded = (err:NodeJS.ErrnoException, data:Buffer) => {
		if (err) {
			throw err;
		}
		var s:string = data.toString();
		try {
			this._settings = YAML.parse(s);
		} catch (e) {
			console.error("Failed to parse settings YAML");
			console.log(e);
			return;
		}

		this.onSettingsLoadedSuccess();
	}

	protected onSettingsLoadedSuccess() {
		this.initORM();
		this.initWebSocketServer();
		this.initHttpServer();

		this.onReady();
	}

	////////////////////////////////////////
	// MySQL
	////////////////////////////////////////
	protected initORM() {
		this._orm = new ORM(this._settings.mysql);
	}

	////////////////////////////////////////
	// WebSocket
	////////////////////////////////////////
	public clientExists(client:WebSocketClient) {
		return (typeof this._wsClients[client.id] !== 'undefined');
	}

	protected initWebSocketServer() {
		console.log("Starting WebSocket...");

		var port:number = this._settings.networking.wsPort;
		this._wsServer = new WebSocket.Server({port:port});
		this._wsServer.on("connection", this.onWebSocketConnect);

		console.log("WebSocket listening on port " + port);
	}

	protected onWebSocketConnect = (webSocket:WebSocket) => {
		var client:WebSocketClient = new WebSocketClient(webSocket, this);
		client.onMessage = this.onClientMessage;
		client.onDisconnect = this.onClientDisconnectWrapper;

		this._wsClients[client.id] = client;

		console.log("Client " + client.id + " connected.");
	}

	protected onClientMessage = (client:WebSocketClient, msg:string) => {
		//console.log(client.id + ": " + msg);
	}

	protected onClientDisconnectWrapper = (client: WebSocketClient) => {
		this.onClientDisconnect(client);
	}

	protected onClientDisconnect(client:WebSocketClient) {
		delete this._wsClients[client.id];

		console.log("Client " + client.id + " disconnected.");
	}

	/**
	 * When a WebSocketClient obatins a User, it calls this
	 */
	public onClientLogin(client:WebSocketClient) {
		console.log("Client " + client.id + " logged in as User " + client.user.id + " (" + client.user.name + ")");
	}

	////////////////////////////////////////
	// HTTP
	////////////////////////////////////////
	protected initHttpServer() {
		console.log("Starting HTTP...");

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
