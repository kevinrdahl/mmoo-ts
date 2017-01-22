/// <reference path="../../declarations/pixi.js.d.ts"/>

import Vector2D from '../../common/Vector2D';
import InterfaceElement from './InterfaceElement';
import Panel from './Panel';
import TextElement from './TextElement';
import AttachInfo from './AttachInfo';

export default class TextField extends InterfaceElement {
	public static alphabets:Object = {
		abc:/^[a-zA-Z]$/,
		abc123:/^[a-zA-Z0-9]$/
	}

	protected static BLINK_INTERVAL:number = 750;

	protected _bg:Panel;
	protected _textElement:TextElement;
	protected _cursor:TextElement;
	protected _text:string = "";
	protected _blinkTime:number = -1;
	protected _hidden:boolean = false;

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

		this._bg = new Panel(width, height, Panel.BASIC);
		this._textElement = new TextElement("", textStyle);

		this.addChild(this._bg);
		this._bg.addChild(this._textElement);

		//Offset the text slightly to allow for the border (Panel needs some improvement)
		var textAttach:AttachInfo = AttachInfo.LeftCenter.clone();
		textAttach.offset.x = 4;
		this._textElement.attachToParent(textAttach);

		//Attach the cursor to the right of the text
		this._cursor = new TextElement("|", textStyle);
		this._textElement.addChild(this._cursor);
		textAttach = new AttachInfo(new Vector2D(0, 0.5), new Vector2D(1, 0.5), new Vector2D(0,0));
		this._cursor.attachToParent(textAttach);
		this._cursor.visible = false;

		//Set up listeners
		this.onFocus = ()=> {
			this._onFocus();
		}

		this.onUnfocus = ()=> {
			this._onUnfocus();
		}

		this.onKeyPress = (s:string) => {
			this._onKeyPress(s);
		}

		this.onKeyDown = (s:string) => {
			if (s == "BACKSPACE") {
				this.deleteCharacter();
			}
		}
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

	protected _onFocus() {
		this._cursor.visible = true;
		this._blinkTime = InterfaceElement.drawTime;
	}

	protected _onUnfocus() {
		this._cursor.visible = false;
	}

	protected _onKeyPress(key:string) {
		if (key == "BACKSPACE") {
			this.deleteCharacter();
		} else if (this._alphabet && !this._alphabet.test(key)) {
			console.log("TextField: ignoring character '" + key + "'");
			return;
		} else {
			this._text += key;
			this.updateText();
		}
	}

	protected deleteCharacter() {
		if (this._text.length > 0) {
			this._text = this._text.substr(0, this._text.length-1);
			this.updateText();
		}
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
	}
}