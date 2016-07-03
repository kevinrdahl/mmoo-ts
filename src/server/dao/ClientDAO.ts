/// <reference path='../../../declarations/mongodb.d.ts' />

//import mongodb = require('mongodb');
import * as mongodb from 'mongodb';

import DAOOperation from './DAOOperation';
import User from '../user/User';

export default class ClientDAO {
	protected _operationQueue:Array<DAOOperation> = [];
	protected _db:mongodb.Db;

	constructor(db:mongodb.Db) {
		this._db = db;
	}

	public checkIfUserExists(name:string, callback:(operation:DAOOperation)=>void) {
		var operation = new DAOOperation("checkIfUserExists", {name:name}, callback);
		this.enqueueOperation(operation);
	}

	public login(name:string, passHash:string, callback:(operation:DAOOperation)=>void) {
		var operation = new DAOOperation("login", {name:name, pass:passHash}, callback);
		this.enqueueOperation(operation);
	}

	public createUser(name:string, passHash:string, callback:(operation:DAOOperation)=>void) {
		this.checkIfUserExists(name, (operation:DAOOperation) => {
			if (operation.result > 0) {
				//user exists, which is a failure
				operation.success = false;
				operation.failReason = "User '" + operation.data.name + "' already exists.";
				callback(operation);
			} else {
				var createOperation = new DAOOperation("createUser", {name:name, pass:passHash}, callback);
				this.enqueueOperation(createOperation);
			}
		});
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
				this._db.collection('users').find(operation.data).toArray(this.onQueryResult);
				break;

			case "login":
				this._db.collection('users').find({name:operation.data.name}).toArray(this.onQueryResult);
				break;

			case "createUser":
				var user:User = User.createNew(operation.data.name, operation.data.pass);
				operation.result = user;
				this._db.collection('users').insertOne(user.toDoc, this.onQueryResult);
		}
	}

	protected onQueryResult = (err:mongodb.MongoError, result:any) => {
		if (err) {
			console.error("Database error: " + err);
			return;
		}

		var operation = this._operationQueue.shift();

		switch (operation.type) {
			case "checkIfUserExists":
				operation.success = true; //no such thing as a wrong question!
				operation.result = result.length;
				break;

			case "login":
				if (result.length == 1) {
					var entry = result[0];
					if (operation.data.pass == entry.pass) {
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

			case "createUser":
				if (result.acknowledged) {

				} else {
					operation.failReason = "Failed to create database entry.";
					console.error("Unable to create user, result:");
					console.log(JSON.stringify(result));
				}

			default:
				operation.failReason = "Internal error: unknown DB operation type '" + operation.type + "'";
		}

		operation.callback(operation);

		if (this._operationQueue.length > 0) {
			this.performOperation();
		}
	}
}