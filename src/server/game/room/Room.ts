import GenericManager from '../GenericManager';
import Player from '../Player';
import IDObjectGroup from '../../../common/IDObjectGroup';
import TerrainManager from './TerrainManager';
import Game from '../Game';
import Unit from './entity/Unit';
import Vector2D from '../../../common/Vector2D';
import Message from '../../../common/messages/Message';
import * as MessageTypes from '../../../common/messages/MessageTypes';
import LogClient from '../LogClient';
import Order from './entity/Order';

/**
 * Think of it as a room in a typical dungeon crawl: completely self-contained but connects to other rooms.
 * Can be arbitrarily large.
 *
 * TODO: separate simulation into chunks to reduce n^2 unit interaction problem.
 */
export default class Room extends GenericManager {
	protected static _idNum:number = 0;

	protected _id:number = -1;
	protected _subscribedPlayers:IDObjectGroup<Player> = new IDObjectGroup<Player>();
	protected _units:IDObjectGroup<Unit> = new IDObjectGroup<Unit>();
	protected _currentFrameMessage:Message = null;
	protected _logPlayer:Player = null;

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

		//make a unit!
		var unit:Unit = new Unit();
		this.addUnit(unit, unit.position);

		//make a fake player, for logging (TODO: have these spit out log files)
		/*this._logPlayer = new Player(this._game);
		var logClient:LogClient = new LogClient(this.name);
		logClient.user = {
			id: -1,
			name: "Logger"
		};
		this._logPlayer.client = logClient;
		this.subscribePlayer(this._logPlayer);*/
	}

	//some temp nonsense for move testing
	private timeSinceMove:number = 0;
	private moveInterval:number = 5;

	public update(timeDelta:number)
	{
		this.timeSinceMove += timeDelta;
		if (this.timeSinceMove > this.moveInterval) {
			this.timeSinceMove = 0;

			for (var unit of this._units.list) {
				var dest:Vector2D = new Vector2D();
				dest.x = Math.round(Math.random() * 300);
				dest.y = Math.round(Math.random() * 300);

				var order:Order = new Order();
				order.initMove(dest);

				unit.addOrder(order, true);
			}
		}

		//console.log(this.name + ": update " + timeElapsed);
		for (var unit of this._units.list) {
			unit.updateMovement(timeDelta);
		}

		for (var unit of this._units.list) {
			unit.updateAction(timeDelta);
		}

		this.queueUnitMessages();
		this.sendQueuedMessages();
	}

	private queueUnitMessages() {
		var unitMessages:Array<Message>;

		for (var unit of this._units.list) {
			if (!unit.hasMessages) continue;
			unitMessages = unit.getAndClearMessages();

			for (var message of unitMessages) {
				this.sendMessageToUnitObservers(message, unit);
			}
		}
	}

	private sendQueuedMessages() {
		var frameMessage:Message = new MessageTypes.Frame(this._game.currentFrame, this._game.timeSinceStart);
		var serialized:string = frameMessage.serialize();

		for (var player of this._subscribedPlayers.list) {
			if (player.hasMessages) {
				player.sendQueuedMessages(serialized);
			}
		}
	}

	private sendMessageToUnitObservers(message:Message, unit:Unit) {
		//for now, simply all subscribed players
		this.sendMessageToAllPlayers(message);
	}

	private sendMessageToAllPlayers(message:Message) {
		var serialized:string = message.serialize();

		for (var player of this._subscribedPlayers.list) {
			player.queueSerializedMessage(serialized);
		}
	}

	public getUnitByID(id:number):Unit {
		return this._units.getById(id);
	}

	public addUnit(unit:Unit, position:Vector2D) {
		unit.position.set(position);
		unit.nextPosition.set(position);
		unit.room = this;

		this._units.add(unit);
		//figure out how vision is going to work!

		var seeMessage:Message = new MessageTypes.UnitSeen(unit.getBasicData());
		this.sendMessageToUnitObservers(seeMessage, unit);
	}

	public removeUnit(unit:Unit) {
		var removed:boolean = this._units.remove(unit);
		if (!removed) return;

		var unseen:Message = new MessageTypes.UnitUnseen(unit.id);
		this.sendMessageToUnitObservers(unseen, unit);

		//handle vision?
	}

	public addPlayer(player:Player) {
		var subscribed:boolean = this.subscribePlayer(player);

		if (subscribed && player.character) {
			var unit:Unit = new Unit();
			unit.initForCharacter(player.character);
			this.addUnit(unit, new Vector2D(unit.id * 50)); //wow, truly excellent (TODO)
			player.character.unit = unit;
		}
	}

	public removePlayer(player:Player) {
		this.unsubscribePlayer(player);

		if (player.character && player.character.unit) {
			this.removeUnit(player.character.unit);
		}
	}

	protected subscribePlayer(player:Player):boolean {
		if (!player.user) {
			this.log("player has no user. Not subscribing them.");
			return false;
		}

		var changed:boolean = this._subscribedPlayers.add(player);
		if (changed) {
			player.onSubscribeToRoom(this);

			//show them all the units
			for (var unit of this._units.list) {
				var seeMessage:Message = new MessageTypes.UnitSeen(unit.getBasicData());
				player.queueSerializedMessage(seeMessage.serialize());
			}
		}

		return changed;
	}

	protected unsubscribePlayer(player:Player) {
		var changed:boolean = this._subscribedPlayers.remove(player);

		if (changed) {
			player.onUnsubscribeFromRoom(this);
		}
	}

	protected log(message:string) {
		console.log(this.name + ": " + message);
	}
}