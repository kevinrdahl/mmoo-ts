import GenericManager from '../GenericManager';
import Player from '../Player';
import TerrainManager from './TerrainManager';
import Game from '../Game';

/**
 * Think of it as a room in a typical dungeon crawl: completely self-contained but connects to other rooms.
 * Can be arbitrarily large.
 *
 * TODO: separate simulation into chunks to reduce n^2 unit interaction problem.
 */
export default class Room extends GenericManager {
	protected static _idNum:number = 0;

	protected _id:number = -1;
	protected _subscribedPlayers:Array<Player> = [];
	protected _subscribedPlayersById:Object = {};

	protected _game:Game;
	protected _terrainManager:TerrainManager;

	public get id():number { return this._id; }
	public get name():string { return this._game.name + ", Room " + this._id; }

	constructor(game:Game) {
		super();

		this._game = game;
		this._id = Room._idNum;
		Room._idNum += 1;
	}

	public init() {
		console.log(this.name + ": init");

		this._terrainManager = new TerrainManager(this);
	}

	public update(timeElapsed:number)
	{
		//console.log(this.name + ": update " + timeElapsed);
	}

	public subscribePlayer(player:Player) {
		if (!player.user) {
			this.log("player has no user. Not subscribing them.");
			return;
		}

		if (this._subscribedPlayersById[player.userId])
		{
			this.log("Player " + player.userId + " is already subscribed.");
			return;
		}

		this._subscribedPlayers.push(player);
		this._subscribedPlayersById[player.userId] = player;

		player.subscribedRooms.push(this);

		//TODO: tell the player about this room (seeing entities should be handled gracefully by the vision handler)
	}

	public unsubscribePlayer(player:Player) {
		if (!this._subscribedPlayersById[player.userId])
		{
			this.log("Player " + player.userId + " wasn't subscribed.");
			return;
		}

		var index:number = this._subscribedPlayers.indexOf(player);
		this._subscribedPlayers.splice(index, 1);
		delete this._subscribedPlayersById[player.userId];

		index = player.subscribedRooms.indexOf(this);
		if (index >= 0) {
			player.subscribedRooms.splice(index, 1);
		}

		//TODO: tell the player they can't see this room anymore (should be super simple and handled in detail by the client)
	}

	protected log(message:string) {
		console.log(this.name + ": " + message);
	}
}