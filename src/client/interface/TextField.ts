/// <reference path="../../declarations/pixi.js.d.ts"/>

import Vector2D from '../../common/Vector2D';
import InterfaceElement from './InterfaceElement';
import Panel from './Panel';
import TextElement from './TextElement';
import MaskElement from './MaskElement';
import AttachInfo from './AttachInfo';
import GameEvent from '../events/GameEvent';

export default class TextField extends InterfaceElement {
	public static alphabets:Object = {
		abc:/^[a-zA-Z]$/,
		abc123:/^[a-zA-Z0-9]$/
	}

	public onTab:(fromElement:InterfaceElement)=>void;
	public onEnter:(fromElement:InterfaceElement)=>void;

	protected static BLINK_INTERVAL:number = 750;

	protected _bg:Panel;
	protected _textElement:TextElement;
	protected _cursor:TextElement;
	protected _mask:MaskElement;

	protected _text:string = "";
	protected _blinkTime:number = -1;
	protected _hidden:boolean = false;
	protected _borderPadding:number = 4;

	public get hidden():boolean { return this._hidden; }
	public set hidden(val:boolean) { this._hidden = val; this.updateText(); }
	public set text(text:string) {
		this._text = text;
		this.updateText();
	}

	protected _alphabet:RegExp;
	protected _validator:RegExp;

	/**
	 * Allows the user to input text.
	 * @param alphabet	Constrains input characters
	 * @param validator	Checks validity of the whole string
	 */
	constructor(width:number, height:number, textStyle:PIXI.TextStyle, alphabet:RegExp=null, validator:RegExp=null) {
		super();
		this._className = "TextField";

		this.resize(width, height);
		this._alphabet = alphabet;
		this._validator = validator;

		this.ignoreChildrenForClick = true;

		this._bg = new Panel(width, height, Panel.FIELD);
		this._textElement = new TextElement("", textStyle);

		this.addChild(this._bg);
		this._bg.addChild(this._textElement);

		//Offset the text slightly to allow for the border (Panel needs some improvement)
		var textAttach:AttachInfo = AttachInfo.LeftCenter.clone();
		textAttach.offset.x = this._borderPadding;
		this._textElement.attachToParent(textAttach);

		//Attach the cursor to the right of the text
		this._cursor = new TextElement("|", textStyle);
		this._textElement.addChild(this._cursor);
		textAttach = new AttachInfo(new Vector2D(0, 0.5), new Vector2D(1, 0.5), new Vector2D(-2,0));
		this._cursor.attachToParent(textAttach);
		this._cursor.visible = false;

		//Make a mask, centred on the Panel
		this._mask = new MaskElement(width - this._borderPadding * 2, height - this._borderPadding * 2);
		this._bg.addChild(this._mask);
		this._mask.attachToParent(AttachInfo.Center);
		this._mask.setAsMask(this._textElement);
		this._mask.setAsMask(this._cursor);
	}

	public draw() {
		super.draw();
		if (!this.visible) return;

		if (this.isFocused) {
			if (InterfaceElement.drawTime - this._blinkTime >= TextField.BLINK_INTERVAL) {
				if (this._cursor.visible) {
					this._cursor.visible = false;
				} else {
					this._cursor.visible = true;
				}

				this._blinkTime = InterfaceElement.drawTime;
			}
		}
	}

	protected onAdd() {
		this.addEventListener(GameEvent.types.ui.FOCUS, this.onFocus);
		this.addEventListener(GameEvent.types.ui.UNFOCUS, this.onUnfocus);
		this.addEventListener(GameEvent.types.ui.KEY, this.onKey);
	}

	protected onRemove(fromParent:InterfaceElement) {
		this.removeEventListener(GameEvent.types.ui.FOCUS, this.onFocus);
		this.removeEventListener(GameEvent.types.ui.UNFOCUS, this.onUnfocus);
		this.removeEventListener(GameEvent.types.ui.KEY, this.onKey);
	}

	protected onFocus = (e:GameEvent) => {
		this._cursor.visible = true;
		this._blinkTime = InterfaceElement.drawTime;
	}

	protected onUnfocus = (e:GameEvent) => {
		this._cursor.visible = false;
	}

	protected onKey = (e:GameEvent) => {
		var key:string = e.data as string;

		if (key == "BACKSPACE") {
			this.deleteCharacter();
		} else if ((this._alphabet && !this._alphabet.test(key)) || key.length > 1) {
			console.log("TextField: ignoring character '" + key + "'");
			return;
		} else {
			this.addCharacter(key);
		}
	}

	protected addCharacter(char:string) {
		this._text += char;
		this.updateText();
		this.resetCursorBlink();
	}

	protected deleteCharacter() {
		if (this._text.length > 0) {
			this._text = this._text.substr(0, this._text.length-1);
			this.updateText();
		}
		this.resetCursorBlink();
	}

	protected resetCursorBlink() {
		this._blinkTime = InterfaceElement.drawTime;
		this._cursor.visible = true;
	}

	protected updateText() {
		var text:string;

		if (this._hidden) {
			text = '';
			for (var i = 0; i < this._text.length; i++) {
				text += '*';
			}
		} else {
			text = this._text;
		}

		this._textElement.text = text;

		var offset:number = (this.width - this._borderPadding * 2) - (this._textElement.width + this._cursor.width - 4);
		offset = Math.min(offset, this._borderPadding);

		this._textElement.setAttachOffset(offset, 0);
	}
}