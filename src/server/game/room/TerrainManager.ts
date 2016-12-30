import GenericManager from '../GenericManager';
import Room from './Room';

export default class TerrainManager extends GenericManager {
	protected _room:Room;
	protected _width:number = 64; //tiles
	protected _height:number = 64;
	protected _tileSize:number = 16; //16x16 tiles

	protected _cachedDescription:string;
	protected _dirty:boolean = true;

	public get width():number { return this._width; }
	public get height():number { return this._height; }
	public get widthInUnits():number { return this._width * this._tileSize; }
	public get heightInUnits():number { return this._height * this._tileSize; }

	constructor (room:Room) {
		super();
		this._room = room;
	}

	/**
	 * A string representation of the room's terrain, to be sent to the client
	 */
	public getDescription():string {
		if (this._dirty) {
			this._cachedDescription = this.generateDescription();
			this._dirty = false;
		}

		return this._cachedDescription;
	}

	protected generateDescription():string {
		var totalTiles:number = this._width * this._height;

		return JSON.stringify({
			width:this._width,
			height:this._height,
			tileSize:this._tileSize,
			tiles:[1,totalTiles] //run length encoded tile types
		});
	}
}