/// <reference path="../declarations/jquery.d.ts"/>

import * as Util from '../common/Util';
import * as MessageTypes from '../common/messages/MessageTypes';
import Message from '../common/messages/Message';

import Game from './Game';
import Connection from './Connection';

export default class LoginManager {
	public userId:number = -1;
	public userName:string = "Naebdy!";

	public get userString():string { return "User " + this.userId + " (" + this.userName + ")"; }

	constructor() {

	}

	public login(name:string, pass:string) {
		var msg:MessageTypes.UserMessage = new MessageTypes.UserMessage("login", {
			name:name,
			pass:pass
		});

		Game.instance.connection.sendMessage(msg);
	}

	public createUser(name:string, pass:string, loginOnSuccess:boolean = false) {
		var msg:MessageTypes.UserMessage = new MessageTypes.UserMessage("createUser", {
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
		else if (msg.action == "joinGame") {
			if (msg.success) {
				Game.instance.onJoinGame(params["id"]);
			} else {
				console.log("Failed to join game: " + msg.failReason);
			}
		}
	}

	private onLogin() {
		console.log("Logged in as " + this.userString);

		Game.instance.connection.getRequest("games", {}, function(response) {
			if (response && Util.isArray(response)) {
				console.log("Current games:\n" + JSON.stringify(response));
			}
		})
	}
}