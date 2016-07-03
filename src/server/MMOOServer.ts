/// <reference path='../../declarations/node.d.ts' />
/// <reference path='../../declarations/ws.d.ts' />
/// <reference path='../../declarations/mongodb.d.ts' />
/// <reference path='../../declarations/yamljs.d.ts' />

/*import WebSocket = require('ws');
import http = require('http');
import mongodb = require('mongodb');
import YAML = require('yamljs');
import fs = require('fs');*/
import * as WebSocket from 'ws';
import * as http from 'http';
import * as mongodb from 'mongodb';
import * as YAML from 'yamljs';
import * as fs from 'fs';

import WebSocketClient from './WebSocketClient';

/**
 * Base server class. Gets everything running, but should be extended
 * rather than used directly.
 */
export default class MMOOServer {
	protected _settings:any;

	protected _wsServer:WebSocket.Server;
	protected _httpServer:http.Server;
	protected _mongoClient:mongodb.MongoClient = mongodb.MongoClient;
	protected _db:mongodb.Db;

	protected _wsClients:Object = {};
	protected _allowedDAOOperations:Object = {};

	get dbName():string { return this._settings.database.name; }
	get dbPort():number { return this._settings.database.port; }
	get dbUser():string { return this._settings.database.user; }
	get name():string { return this._settings.server.name; }
	get db():mongodb.Db { return this._db; }

	constructor () {
		this._allowedDAOOperations["checkIfUserExists"] = true;
		this._allowedDAOOperations["login"] = true;
	}

	public init() {
		this.loadSettings();
	}

	public isDAOOperationAllowed(opName:string):boolean {
		return (this._allowedDAOOperations[opName] === true);
	}

	protected onReady() {
		console.log("Server '" + this.name + "' ready!");
	}

	////////////////////////////////////////
	// Settings
	////////////////////////////////////////
	protected loadSettings() {
		console.log("Loading settings...");
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
		console.log("Connecting to database...");

		/*
		 *	mongodb://kevin:poop@website.com:1337
		 */
		var args:Array<string> = [
			"mongodb://",
			this.dbUser,
			":",
			this._settings.database.pass,
			"@",
			this.dbName,
			":",
			this.dbPort.toString(),

		];
		var url:string = args.join("");

		var serverOptions:mongodb.ServerOptions = {
			poolSize:10
		}
		var options:mongodb.MongoClientOptions = {
			server:serverOptions
		}

		this._mongoClient.connect(url, options, this.onDatabaseConnection);
	}

	protected onDatabaseConnection = (err:mongodb.MongoError, db:mongodb.Db) => {
		if (err) {
			console.error("Unable to connect to MongoDB: " + err);
			process.exit();
		}

		this._db = db;
		console.log("Connected to MongoDB at " + this.dbName + ":" + this.dbPort + " as '" + this.dbUser + "'");

		this.startWebSocketServer();
	}

	////////////////////////////////////////
	// WebSocket
	////////////////////////////////////////
	public clientExists(client:WebSocketClient) {
		return (typeof this._wsClients[client.id] !== 'undefined');
	}

	protected startWebSocketServer() {
		console.log("Starting WebSocket...");

		var port:number = this._settings.networking.wsPort;
		this._wsServer = new WebSocket.Server({port:port});
		this._wsServer.on("connection", this.onWebSocketConnect);

		console.log("WebSocket listening on port " + port);

		this.startHttpServer();
	}

	protected onWebSocketConnect = (webSocket:WebSocket) => {
		var client:WebSocketClient = new WebSocketClient(webSocket, this);
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
