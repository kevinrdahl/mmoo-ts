
let mysql = require('mysql');

import DAOOperation from './DAOOperation';
import * as Crypto from '../util/Crypto';
import ORM from '../ORM';

/**
 * This is generally the only path by which a client's request should turn into a database query.
 * It maintains a queue of operations and will only process one at a time. This queue is its
 * reason to exist. Don't use a scheme like this for other data access.
 *
 * TODO: also limit the frequency of requests
 */
export default class ClientDAO {
	protected _operationQueue:Array<DAOOperation> = [];
	protected _mySQLPool:any;
	protected _orm:ORM;

	constructor(orm:ORM) {
		this._orm = orm;
	}


	//////////////////////////////////////////////////
	// Initiating functions
	//////////////////////////////////////////////////

	// === User ===

	public checkIfUserExists(name:string, callback:(operation:DAOOperation)=>void) {
		var operation:DAOOperation = new DAOOperation("checkIfUserExists", {name:name}, callback);
		this.enqueueOperation(operation);
	}

	public login(name:string, pass:string, callback:(operation:DAOOperation)=>void) {
		var operation:DAOOperation = new DAOOperation("login", {name:name, pass:pass}, callback);
		this.enqueueOperation(operation);
	}

	public createUser(name:string, pass:string, callback:(operation:DAOOperation)=>void) {
		this.checkIfUserExists(name, (operation:DAOOperation) => {
			if (operation.result > 0) {
				//user exists, which is a failure
				operation.success = false;
				operation.failReason = "User '" + operation.data.name + "' already exists.";
				callback(operation);
			} else {
				var createOperation = new DAOOperation("createUser", {name:name, pass:pass}, callback);
				this.enqueueOperation(createOperation);
			}
		});
	}

	// === Character ===

	public checkIfCharacterExists(name:string, gameId:number, callback:(operation:DAOOperation)=>void) {
		var operation:DAOOperation = new DAOOperation("checkIfCharacterExists", {name:name, gameId:gameId}, callback);
		this.enqueueOperation(operation);
	}

	public getCharacterList(userId:number, gameId:number, callback:(operation:DAOOperation)=>void) {
		var operation:DAOOperation = new DAOOperation(
			"getCharacters",
			{userId:userId, gameId:gameId},
			callback
		);
		this.enqueueOperation(operation);
	}

	public getCharacter(characterId:number, callback:(operation:DAOOperation)=>void) {
		var operation:DAOOperation = new DAOOperation(
			"getCharacter",
			{characterId:characterId},
			callback
		);
		this.enqueueOperation(operation);
	}

	public createCharacter(userId:number, gameId:number, name:string, properties:any, callback:(operation:DAOOperation)=>void) {
		this.checkIfCharacterExists(name, gameId, (operation:DAOOperation) => {
			if (operation.result > 0) {
				operation.success = false;
				operation.failReason = "Character '" + operation.data.name + "' already exists.";
				callback(operation);
			} else {
				var createOperation:DAOOperation = new DAOOperation(
					"createCharacter",
					{userId:userId, gameId:gameId, name:name, properties:properties},
					callback
				)
				this.enqueueOperation(createOperation);
			}
		});
	}


	//////////////////////////////////////////////////
	// Handling operations
	//////////////////////////////////////////////////

	protected enqueueOperation(operation:DAOOperation) {
		this._operationQueue.push(operation);
		if (this._operationQueue.length == 1) {
			this.performOperation();
		}
	}

	protected performOperation() {
		var operation = this._operationQueue[0];
		var orm:ORM = this._orm;
		var __this = this;

		//console.log("Client DAO Operation: " + JSON.stringify(operation));

		switch (operation.type) {
			case "checkIfUserExists":
				orm.User.count({
					where: {
						name: operation.data.name
					}
				}).then(function(count) {
					__this.onQueryResult(null, count);
				}).catch(function(e) {
					__this.onQueryResult(e, null);
				});

				break;

			case "login":
				orm.User.findAll({
					where: {
						name: operation.data.name
					}
				}).then(function(rows) {
					__this.onQueryResult(null, rows);
				}).catch(function(e) {
					__this.onQueryResult(e, null);
				});

				break;

			//note: if this is called, it has already been checked that no user with that name exists
			case "createUser":
				var user = orm.User.build({
					name: operation.data.name,
					password: Crypto.hashPassword(operation.data.pass)
				});

				user.save().then(function(instance) {
					__this.onQueryResult(null, instance);
				}).catch(function(e) {
					__this.onQueryResult(e, null);
				});

				break;

			case "checkIfCharacterExists":
				orm.Character.count({
					where: {
						name: operation.data.name,
						gameId: operation.data.gameId
					}
				}).then(function(count) {
					__this.onQueryResult(null, count);
				}).catch(function(e) {
					__this.onQueryResult(e, null);
				});

				break;

			case "getCharacters":
				orm.Character.findAll({
					where: {
						userId: operation.data.userId,
						gameId: operation.data.gameId
					}
				}).then(function(rows) {
					__this.onQueryResult(null, rows);
				}).catch(function(e) {
					__this.onQueryResult(e, null);
				});

				break;

			case "createCharacter":
				var character = orm.Character.build({
					name: operation.data.name,
					userId: operation.data.userId,
					gameId: operation.data.gameId,
					properties: operation.data.properties
				});

				character.save().then(function(instance) {
					__this.onQueryResult(null, instance);
				}).catch(function(e) {
					__this.onQueryResult(e, null);
				});

				break;

			case "getCharacter":
				orm.Character.findOne({
					where: {
						id: operation.data.characterId
					}
				}).then(function(instance) {
					__this.onQueryResult(null, instance);
				}).catch(function(e) {
					__this.onQueryResult(e, null);
				});

				break;
		}
	}

	//////////////////////////////////////////////////
	// Result
	//////////////////////////////////////////////////

	protected onQueryResult (err, result) {
		var operation = this._operationQueue.shift();

		if (!operation) {
			console.error("onQueryResult: NO OPERATION?!");
		}

		if (err) {
			var dbErr:string = "Database error: " + err;
			console.error(dbErr);

			if (operation) {
				operation.success = false;
				operation.failReason = dbErr;
			}
		}
		else {
			switch (operation.type) {
				case "checkIfUserExists":
				case "checkIfCharacterExists":
					operation.success = true; //no such thing as a wrong question!
					operation.result = result;
					break;

				case "login":
					if (result.length == 1) {
						var entry = result[0];

						if (Crypto.checkPassword(operation.data.pass, entry.password)) {
							operation.success = true;
							operation.result = entry;
						} else {
							operation.failReason = "Incorrect password.";
						}
					} else if (result.length == 0) {
						operation.failReason = "User '" + operation.data.name + "' does not exist.";
					} else if (result.length > 1) {
						operation.failReason = "Multiple records found! This shouldn't be happening...";
					}
					break;

				case "getCharacters":
					operation.success = true;
					operation.result = result.map(function(char) {
						return {
							id: char.id,
							name: char.name,
							properties: char.properties
						}
					});
					break;

				case "getCharacter":
				case "createCharacter":
				case "createUser":
					operation.success = true;
					operation.result = result; //either an instance or an array of instances, as logic would indicate
					break;

				default:
					operation.failReason = "Internal error: unknown DB operation type '" + operation.type + "'";
			}
		}

		if (operation) {
			operation.callback(operation);
		}

		if (this._operationQueue.length > 0) {
			this.performOperation();
		}
	}
}