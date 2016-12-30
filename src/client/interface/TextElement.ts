/// <reference path="../../../declarations/pixi.js.d.ts"/>
import InterfaceElement from './InterfaceElement';

export default class TextElement extends InterfaceElement {
	public static basicText:PIXI.TextStyle = {font:'14px Open Sans', fill:0xffffff, align:'left'};
	public static bigText:PIXI.TextStyle = {font:'32px Open Sans', fill:0xffffff, align:'left'};
	public static veryBigText:PIXI.TextStyle = {font:'48px Open Sans', fill:0xffffff, align:'left'};

	protected _debugColor = 0xff0000;

	private _text:string;
	private _pixiText:PIXI.Text;

	get text():string { return this._text; }

	set text(text:string) {
		this._text = text;
		this.setPixiText();
	}
	set style(style:PIXI.TextStyle) {
		this._pixiText.style = style;
		this.resizeToPixiText();
	}

	constructor(text:string="", style:PIXI.TextStyle = TextElement.basicText) {
		super();

		this._className = "TextElement";
		this._pixiText = new PIXI.Text(text, style);
		this._displayObject.addChild(this._pixiText);

		this.resizeToPixiText();
	}

	//TODO: hidden text fields (*****)
	private setPixiText() {
		this._pixiText.text = this._text;
		this.resizeToPixiText();
	}

	private resizeToPixiText() {
		this.resize(this._pixiText.width, this._pixiText.height);
	}
}