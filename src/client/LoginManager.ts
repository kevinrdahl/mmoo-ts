/// <reference path="../declarations/jquery.d.ts"/>

import * as Util from '../common/Util';
import * as MessageTypes from '../common/messages/MessageTypes';
import Message from '../common/messages/Message';

import Game from './Game';
import Connection from './Connection';
import GameEvent from './events/GameEvent';
import GameEventHandler from './events/GameEventHandler';

export default class LoginManager extends GameEventHandler {
	public userId:number = -1;
	public userName:string = "Naebdy!";
	public gameId:number = -1;
	public characterId:number = -1;

	public get userString():string { return "User " + this.userId + " (" + this.userName + ")"; }

	constructor() {
		super();
	}

	public login(name:string, pass:string) {
		var msg:Message = new MessageTypes.UserMessage("login", {
			name:name,
			pass:pass
		});

		Game.instance.connection.sendMessage(msg);
	}

	public createUser(name:string, pass:string, loginOnSuccess:boolean = false) {
		var msg:Message = new MessageTypes.UserMessage("createUser", {
			name:name,
			pass:pass
		});

		Game.instance.connection.sendMessage(msg);
	}

	public onUserMessage(msg:MessageTypes.UserMessage) {
		var params:Object = msg.params;

		if (msg.action == "login") {
			if (msg.success) {
				this.userId = params["id"];
				this.userName = params["name"];

				this.onLogin();
			} else {
				console.log("Failed to log in: " + msg.failReason);
			}
		}
		else if (msg.action == "createUser") {
			if (msg.success) {
				console.log("Created new user");
			} else {
				console.log("Failed to create user: " + msg.failReason);
			}
		}
		else if (msg.action == "getCharacters") {
			if (msg.success) {
				this.onGetCharacterList(params["characters"]);
			} else {
				console.log("Failed to get character list: " + msg.failReason);
			}
		}
		else if (msg.action == "enterGame") {
			if (msg.success) {
				this.onEnterGame(params["characters"]);
			} else {
				console.log("Failed to get enter game: " + msg.failReason);
			}
		}
	}

	private onLogin() {
		console.log("Logged in as " + this.userString);

		Game.instance.connection.getRequest("games", {}, this.onGetGamesList);
	}

	/**
	 * Assumes response is a JSON array.
	 * Why did I implement this as an async thing?
	 */
	private onGetGamesList = (response) => {
		if (response && Util.isArray(response)) {
			console.log("Current games:\n" + JSON.stringify(response));

			var games:Array<any> = response as Array<any>;
			if (games.length > 0) {
				//log in to the first thing in the list!
				this.getCharacterList(games[0].id);
			} else {
				console.warn("No games?");
			}
		}
	}

	/**
	 * Also, internally, expresses an intent to join this game
	 */
	private getCharacterList(gameId:number) {
		this.gameId = gameId;

		var msg:Message = new MessageTypes.UserMessage("getCharacters", {
			gameId: gameId
		});
		Game.instance.connection.sendMessage(msg);
	}

	private onGetCharacterList(response) {
		if (Util.isArray(response)) {
			var characters:Array<any> = response as Array<any>;
			if (characters.length > 0) {
				//log in as the first thing in the list!
				this.enterGameAsCharacter(this.gameId, characters[0].id);
			} else {
				console.log("No characters!")
			}
		}
		else {
			console.warn("Bad character data?")
			console.log(response);
		}
	}

	private enterGameAsCharacter(gameId:number, characterId:number) {
		this.gameId = gameId;
		this.characterId = characterId;

		var msg:Message = new MessageTypes.UserMessage("enterGame", {
			gameId: gameId,
			characterId: characterId
		});
		Game.instance.connection.sendMessage(msg);
	}

	private onEnterGame(response) {
		console.log("Entered game!")
		console.log(response);
	}
}