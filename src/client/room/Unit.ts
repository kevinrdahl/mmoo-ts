/// <reference path="../../declarations/pixi.js.d.ts"/>

import Vector2D from '../../common/Vector2D';
import Room from './Room';
import Game from '../Game';

export default class Unit {
	public static numMoveDirections:number = 16;

	public id:number = -1;
	public moveSpeed: number = 100; //units per second that this unit CAN move, if it is moving
	public name: string = "?";
	public position: Vector2D = new Vector2D(0,0);
	public sprite: PIXI.Sprite = null;

	private moveDirection: number = -1;
	private room:Room = null;

	constructor() {

	}

	public init(room:Room, data:Object) {
		this.room = room;
		this.readData(data);

		Game.instance.textureWorker.getTexture('character/man', { from: [], to: [] }, (requestKey: string, texture: PIXI.Texture) => {
			this.sprite = new PIXI.Sprite(texture);
			/*this.sprite.scale.x = 2;
			this.sprite.scale.y = 2;*/
			this.updateSpritePosition();

			this.room.addSpriteForUnit(this);
		});
	}

	private readData(data:Object) {
		if (data.hasOwnProperty("id")) this.id = data["id"];
		if (data.hasOwnProperty("name")) this.name = data["name"];
		if (data.hasOwnProperty("direction")) this.moveDirection = data["direction"];
		if (data.hasOwnProperty("speed")) this.moveSpeed = data["speed"];
		if (data.hasOwnProperty("position")) this.position = Vector2D.fromArray(data["position"]);
	}

	public update(timeDelta:number) {
		if (this.moveDirection >= 0) {
			this.position.offset(this.moveDirection * (360 / Unit.numMoveDirections), this.moveSpeed * timeDelta);
		}

		this.updateSpritePosition();
	}

	///For move messages
	public setMoveDirection(direction:number, position:Vector2D) {
		this.position.set(position);
		this.moveDirection = direction;

		this.updateSpritePosition();
	}

	private updateSpritePosition() {
		if (this.sprite) {
			this.sprite.position.set(this.position.x, this.position.y);
		}
	}
}