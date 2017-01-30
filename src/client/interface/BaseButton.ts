/// <reference path="../../declarations/pixi.js.d.ts"/>

import InterfaceElement from './InterfaceElement';
import GameEvent from '../events/GameEvent';

export default class BaseButton extends InterfaceElement {

	private _normalTex:PIXI.Texture;
	private _highlightTex:PIXI.Texture;
	private _disabledTex:PIXI.Texture;

	private _sprite:PIXI.Sprite;
	private _state;

	private static STATE_NORMAL = 1;
	private static STATE_HIGHLIGHT = 2;
	private static STATE_DISABLED = 3;

	/**
	 * It's a button! Click it!
	 * Use the LEFTMOUSECLICK event to listen for clicks.
	 * Can't assume it owns its textures, so it doesn't destroy them. Don't use this class directly.
	 */
	constructor(normalTex:PIXI.Texture, highlightTex:PIXI.Texture, disabledTex:PIXI.Texture) {
		super();
		this._className = "BaseButton";
		this._debugColor = 0xff66ff;
		this.clickable = true;

		this._state = BaseButton.STATE_NORMAL;

		this._normalTex = normalTex;
		this._highlightTex = highlightTex;
		this._disabledTex = disabledTex;

		this._sprite = new PIXI.Sprite(this._normalTex);
		this._displayObject.addChild(this._sprite);
		this.resize(this._sprite.width, this._sprite.height);

		this.addEventListeners();
	}

	public set enabled(enabled:boolean) {
		if (enabled) {
			this.setNormal();
		} else {
			this.setDisabled();
		}
	}

	public get enabled():boolean {
		return this._state != BaseButton.STATE_DISABLED;
	}

	protected addEventListeners() {
		this.addEventListener(GameEvent.types.ui.MOUSEOVER, this.onMouseOver);
		this.addEventListener(GameEvent.types.ui.MOUSEOUT, this.onMouseOut);
		this.addEventListener(GameEvent.types.ui.LEFTMOUSECLICK, this.onLeftMouseClick);
	}

	protected removeEventListeners() {
		this.removeEventListener(GameEvent.types.ui.MOUSEOVER, this.onMouseOver);
		this.removeEventListener(GameEvent.types.ui.MOUSEOUT, this.onMouseOut);
		this.removeEventListener(GameEvent.types.ui.LEFTMOUSECLICK, this.onLeftMouseClick);
	}

	protected setNormal() {
		this._state = BaseButton.STATE_NORMAL;
		this._sprite.texture = this._normalTex;
	}

	protected setHighlight() {
		this._state = BaseButton.STATE_HIGHLIGHT;
		this._sprite.texture = this._highlightTex;
	}

	protected setDisabled() {
		this._state = BaseButton.STATE_DISABLED;
		this._sprite.texture = this._disabledTex;
	}

	private onMouseOver = (e:GameEvent) => {
		if (this.enabled) {
			this.setHighlight();
		}
	}

	private onMouseOut = (e:GameEvent) => {
		if (this.enabled) {
			this.setNormal();
		}
	}

	private onLeftMouseClick = (e:GameEvent) => {
		//TODO: sound?
	}
}