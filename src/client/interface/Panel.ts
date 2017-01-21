/// <reference path="../../declarations/pixi.js.d.ts"/>
import InterfaceElement from './InterfaceElement';
//import TextureGenerator = require('../textures/TextureGenerator');
import * as TextureGenerator from '../textures/TextureGenerator';

export default class Panel extends InterfaceElement {
	public static BASIC:number = 0;
	public static BASICBAR:number = 1;

	protected _debugColor = 0x00ff00;

	private _style:number;
	private _texture:PIXI.RenderTexture;
	private _sprite:PIXI.Sprite;
	private _needRedraw:boolean = true;

	constructor(width:number, height:number, style:number) {
		super();

		this._className = "Panel";
		this._width = width;
		this._height = height;
		this._style = style;
		this._texture = null;
		this.clickable = true;

		this.draw();
		this._sprite = new PIXI.Sprite(this._texture);
		this._displayObject.addChild(this._sprite);
	}

	public resize(width:number, height:number) {
		if (width != this._width || height != this._height) this._needRedraw = true;
		super.resize(width, height);
	}

	public draw() {
		super.draw();

		if (this._needRedraw) {
			this._needRedraw = false;
			var hadTexture:boolean = false;
			if (this._texture) {
				hadTexture = true;
				this._texture.resize(this._width, this._height, true);
			}

			//style check!
			switch(this._style) {
				case Panel.BASICBAR:
					this._texture = TextureGenerator.simpleRectangle(this._texture, this._width, this._height, 0x999999);
					break;
				default: //BASIC
					this._texture = TextureGenerator.simpleRectangle(this._texture, this._width, this._height, 0x333333, 2, 0x999999);
			}
		}
	}
}
