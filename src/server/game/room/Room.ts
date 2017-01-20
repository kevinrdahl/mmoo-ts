import GenericManager from '../GenericManager';
import Player from '../Player';
import PlayerGroup from '../PlayerGroup';
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
	protected _subscribedPlayers:PlayerGroup = new PlayerGroup();

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

	protected subscribePlayer(player:Player) {
		if (!player.user) {
			this.log("player has no user. Not subscribing them.");
			return;
		}

		var changed:boolean = this._subscribedPlayers.addPlayer(player);
		if (changed) {
			player.onSubscribeToRoom(this);
		}
	}

	protected unsubscribePlayer(player:Player) {
		var changed:boolean = this._subscribedPlayers.removePlayer(player);

		if (changed) {
			player.onSubscribeToRoom(this);
		}
	}

	protected log(message:string) {
		console.log(this.name + ": " + message);
	}
}