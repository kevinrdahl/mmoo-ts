/// <reference path='../../declarations/node.d.ts' />

import * as http from 'http';

import BaseServer from './BaseServer';

export default class LoginServer extends BaseServer {
	constructor(settingsPath:string) {
		super(settingsPath);
		this._allowedDAOOperations['createUser'] = true;
	}

	protected onHttpRequest = (request:http.IncomingMessage, response:http.ServerResponse) => {
		response.end("Nice URL: " + request.url);
	}
}