/// <reference path="../../declarations/pixi.js.d.ts"/>

import * as MessageTypes from '../../common/messages/MessageTypes';
import Message from '../../common/messages/Message';
import Game from '../Game';
import GameEvent from '../events/GameEvent';
import GameEventHandler from '../events/GameEventHandler';
import InterfaceElement from '../interface/InterfaceElement';
import Vector2D from '../../common/Vector2D';
import Unit from './Unit';
import IDObjectGroup from '../../common/IDObjectGroup';

export default class Room extends GameEventHandler {
	private _container:PIXI.Container = new PIXI.Container();
	private _entityContainer:PIXI.Container = new PIXI.Container();
	private _roomId:number = -1;
	private _frame:number = -1;
	private _time:number = -1;
	private _lastReceivedFrame:number;
	private _statusPopup:InterfaceElement = null;
	private _units:IDObjectGroup<Unit> = new IDObjectGroup<Unit>();

	public get container():PIXI.Container { return this._container; }

	constructor() {
		super();
		this._container.addChild(this._entityContainer);

		this._container.scale.x = 2;
		this._container.scale.y = 2;
	}

	public init(roomId:number) {
		this._roomId = roomId;

		this.setStatusPopup("Joining...");
	}

	public update(timeDelta:number) {
		if (this._frame == -1) return;

		for (var unit of this._units.list) {
			unit.update(timeDelta);
		}
	}

	public onMessage(message:Message) {
		/**
		 * Big big TODO:
		 * Latency management (I think previous MMOO had this sorted quite well)
		 */

		switch (message.type) {
			case MessageTypes.FRAME:
				this.onFrameMessage(message as MessageTypes.Frame);
				break;
			case MessageTypes.UNIT_SEEN:
				this.onUnitSeen(message as MessageTypes.UnitSeen);
				break;
			case MessageTypes.UNIT_UNSEEN:
				this.onUnitUnseen(message as MessageTypes.UnitUnseen);
				break;
			case MessageTypes.UNIT_MOVED:
				this.onUnitMoved(message as MessageTypes.UnitMoved);
				break;
			default:
				console.log("unhandled message in Room");
				console.log(message);
		}


	}

	public cleanup() {

	}

	public setStatusPopup(status:string) {
		this.clearStatusPopup();

		this._statusPopup = Game.instance.interfaceRoot.showStatusPopup(status);
	}

	public clearStatusPopup() {
		if (this._statusPopup) {
			this._statusPopup.removeSelf();
		}
		this._statusPopup = null;
	}

	public addSpriteForUnit(unit:Unit) {
		if (unit.sprite) this._entityContainer.addChild(unit.sprite);
	}

	private onFrameMessage(message:MessageTypes.Frame) {
		if (this._frame == -1) {
			this.clearStatusPopup();
			this._frame = message.frameId;
		}
	}

	private onUnitSeen(message:MessageTypes.UnitSeen) {
		var unit:Unit = new Unit();
		unit.init(this, message.data);
		this._units.add(unit);
	}

	private onUnitUnseen(message: MessageTypes.UnitUnseen) {
		var unit:Unit = this._units.getById(message.unitId);
		if (unit) {
			if (unit.sprite) this._entityContainer.removeChild(unit.sprite);
			this._units.remove(unit);
		}
	}

	private onUnitMoved(message:MessageTypes.UnitMoved) {
		var unit:Unit = this._units.getById(message.unitId);
		if (unit) {
			unit.setMoveDirection(message.direction, message.position);
		}
	}
}