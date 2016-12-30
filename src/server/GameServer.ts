/// <reference path='../../declarations/node.d.ts' />

import * as http from 'http';

import BaseServer from './BaseServer';
import Game from './game/Game';

export default class GameServer extends BaseServer {
	protected _games:Array<Game> = [];

	constructor(settingsPath:string) {
		super(settingsPath);
		this._allowedDAOOperations['createUser'] = true;
	}

	protected onHttpRequest = (request:http.IncomingMessage, response:http.ServerResponse) => {
		//response.end("GameServer: " + request.url);
		if (request.url === "/getGames") {
			response.end(JSON.stringify(this.getGamesSummary()));
		}
	}

	protected getGamesSummary():Array<Object> {
		var list:Array<Object> = [];

		for (var i = 0; i < this._games.length; i++) {
			list.push(this._games[i].getSummary());
		}

		return list;
	}

	protected onReady() {
		super.onReady();

		var game:Game = new Game();
		this._games.push(game);
		game.start();
	}
}