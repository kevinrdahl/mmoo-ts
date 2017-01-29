/// <reference path="../../declarations/pixi.js.d.ts"/>
import InterfaceElement from './InterfaceElement';

export default class TextElement extends InterfaceElement {
	//Open Sans
	public static basicText:PIXI.TextStyle = new PIXI.TextStyle({fontSize:14, fontFamily:'Verdana', fill:0xffffff, align:'left'});
	public static bigText:PIXI.TextStyle = new PIXI.TextStyle({fontSize:32, fontFamily:'Verdana', fill:0xffffff, align:'left'});
	public static veryBigText:PIXI.TextStyle = new PIXI.TextStyle({fontSize: 48, fontFamily:'Verdana', fill:0xffffff, align:'left'});

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
		this._text = text;
		this._pixiText = new PIXI.Text(text, style);
		this._displayObject.addChild(this._pixiText);

		this.resizeToPixiText();
	}

	/**
	 * Expensive! Sets the PIXI text twice. Assumes single line.
	 * (does this work? does it need a draw frame? time will tell)
	 */
	public getWidthAtCharacterIndex(i:number):number {
		if (i >= this._text.length) return -1; //dummy
		this._pixiText.text = this._text.substr(0, i+1);
		var w:number = this._pixiText.width;
		this._pixiText.text = this._text;
		return w;
	}

	private setPixiText() {
		this._pixiText.text = this._text;
		this.resizeToPixiText();
	}

	private resizeToPixiText() {
		var width:number = (this._text.length > 0) ? this._pixiText.width : 0;
		this.resize(width, this._pixiText.height);
	}
}