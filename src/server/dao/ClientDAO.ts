/// <reference path='../../../declarations/mongodb.d.ts' />

//import mongodb = require('mongodb');
//import * as mongodb from 'mongodb';

let mysql = require('mysql');

import DAOOperation from './DAOOperation';
import User from '../user/User';
import * as Crypto from '../util/Crypto';

export default class ClientDAO {
	protected _operationQueue:Array<DAOOperation> = [];
	protected _user:User;
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
				//this._db.collection('users').insertOne(user.toDoc, this.onQueryResult);
		}
	}

	protected onQueryResult = (err, rows) => {
		if (err) {
			console.error("Database error: " + err);
			return;
		}

		//console.log("Query response:\n   " + JSON.stringify(rows));

		var operation = this._operationQueue.shift();

		//if (operation) console.log("Operation data:\n   " + JSON.stringify(operation.data));
		//else console.log("No operation!");

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
				operation.success = true;
				break;

			default:
				operation.failReason = "Internal error: unknown DB operation type '" + operation.type + "'";
		}

		operation.callback(operation);

		if (this._operationQueue.length > 0) {
			this.performOperation();
		}
	}
}