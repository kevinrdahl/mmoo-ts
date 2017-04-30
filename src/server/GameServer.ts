/// <reference path='../declarations/node.d.ts' />

import * as http from 'http';

import BaseServer from './BaseServer';
import WebSocketClient from './WebSocketClient';
import Game from './game/Game';

export default class GameServer extends BaseServer {
	protected _games:Array<Game> = [];

	constructor(settingsPath:string) {
		super(settingsPath);
		this._allowedDAOOperations['createUser'] = true;
		this._allowedDAOOperations['*'] = true;
	}

	public getGameById(id:number):Game {
		for (var game of this._games) {
			if (game.id == id) return game;
		}

		return null;
	}

	protected onHttpRequest = (request:http.IncomingMessage, response:http.ServerResponse) => {
		//response.end("GameServer: " + request.url);
		if (request.url === "/getGames") {
			response.end(JSON.stringify(this.getGamesSummary()));
		}
	}

	protected onClientDisconnect(client:WebSocketClient) {
		super.onClientDisconnect(client);

		if (client.player && client.player.game) {
			client.player.game.onPlayerDisconnect(client.player);
		}
	}

	public getGamesSummary():Array<Object> {
		var list:Array<Object> = [];

		for (var game of this._games) {
			list.push(game.getSummary());
		}

		return list;
	}

	protected onReady() {
		super.onReady();

		var game:Game = new Game(1);
		this._games.push(game);
		game.start();
	}
}