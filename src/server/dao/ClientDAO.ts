/// <reference path='../../../declarations/mongodb.d.ts' />

//import mongodb = require('mongodb');
//import * as mongodb from 'mongodb';

let mysql = require('mysql');

import DAOOperation from './DAOOperation';
import User from '../user/User';
import * as Crypto from '../util/Crypto';

/**
 * This is the only path by which a client's request should turn into a database query.
 * It maintains a queue of operations and will only process one at a time.
 * 
 * TODO: also limit the frequency of requests
 * 
 * It is by no means a good format for a general-purpose DAO. For general game data, a
 * better scheme should be employed. (Boring, put it off)
 * 		Actually, this will probably just have to be rewritten to use whatever ORM thing I pick
 */
export default class ClientDAO {
	protected _operationQueue:Array<DAOOperation> = [];
	protected _mySQLPool:any;
	//protected _db:mongodb.Db;

	constructor(mySQLPool:any) {
		this._mySQLPool = mySQLPool;
	}

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

	/**
	 * Gets summaries of a player's characters. Not full data.
	 */
	public getCharacterList(userId:number, gameId:number, callback:(operation:DAOOperation)=>void) {
		var operation:DAOOperation = new DAOOperation(
			"getCharacterList",
			{userId:userId, gameId:gameId},
			callback
		);
		this.enqueueOperation(operation);
	}

	/**
	 * Note you'll have to check that the client is actually allowed to access this.
	 */
	public getCharacter(characterId:number, callback:(operation:DAOOperation)=>void) {
		var operation:DAOOperation = new DAOOperation(
			"getCharacter",
			{characterId:characterId},
			callback
		);
		this.enqueueOperation(operation);
	}

	protected enqueueOperation(operation:DAOOperation) {
		this._operationQueue.push(operation);
		if (this._operationQueue.length == 1) {
			this.performOperation();
		}
	}

	protected performOperation() {
		var operation = this._operationQueue[0];
		switch (operation.type) {
			case "checkIfUserExists":
				this._mySQLPool.query(
					'SELECT 1 FROM `User` WHERE `name`=?',
					[operation.data.name],
					this.onQueryResult
				);
				break;

			case "login":
				this._mySQLPool.query(
					'SELECT * FROM `User` WHERE `name`=?',
					[operation.data.name],
					this.onQueryResult
				);
				break;

			//note: if this is called, it has already been checked that no user with that name exists
			case "createUser":
				var user:User = new User();
				user.name = operation.data.name;
				user.password = Crypto.hashPassword(operation.data.pass);

				operation.result = user;

				this._mySQLPool.query(
					'INSERT INTO `User` SET ?',
					{'name': user.name, 'password': user.pass},
					this.onQueryResult
				);
				break;
				
			case "getCharacterList":
				//TEMP! TODO: return less data
				this._mySQLPool.query(
					'SELECT * FROM `Character` WHERE `user_id`=? AND `game_id`=?',
					[operation.data.userId, operation.data.gameId],
					this.onQueryResult
				);
				break;
		}
	}

	protected onQueryResult = (err, rows) => {
		var operation = this._operationQueue.shift();

		if (err) {
			var dbErr:string = "Database error: " + err;
			console.error(dbErr);
			operation.success = false;
			operation.failReason = dbErr;
		}
		else {
			switch (operation.type) {
				case "checkIfUserExists":
					operation.success = true; //no such thing as a wrong question!
					operation.result = rows.length;
					break;

				case "login":
					if (rows.length == 1) {
						var entry = rows[0];
						//if (operation.data.pass == entry.pass) {
						if (Crypto.checkPassword(operation.data.pass, entry.password)) {
							operation.success = true;
							operation.result = new User(entry);
						} else {
							operation.failReason = "Incorrect password.";
						}
					} else if (rows.length == 0) {
						operation.failReason = "User '" + operation.data.name + "' does not exist.";
					} else if (rows.length > 1) {
						operation.failReason = "Multiple records found! This shouldn't be happening...";
					}
					break;

				case "createUser":
					//the call is only made if we know the user doesn't exist
					//the User object is made/set in performOperation
					operation.success = true;
					break;

				case "getCharacterList":
					operation.success = true;
					operation.result = rows; //NO NO BAD, PROCESS THIS
					break;

				default:
					operation.failReason = "Internal error: unknown DB operation type '" + operation.type + "'";
			}
		}

		operation.callback(operation);

		if (this._operationQueue.length > 0) {
			this.performOperation();
		}
	}
}