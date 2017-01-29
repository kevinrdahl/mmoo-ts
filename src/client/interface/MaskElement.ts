import InterfaceElement from './InterfaceElement';

export default class MaskElement extends InterfaceElement {
	private _maskSprite:PIXI.Sprite;

	constructor(width:number, height:number) {
		super();
		this._debugColor = 0x00ff00;

		//this.visible = false;
		this._maskSprite = new PIXI.Sprite(InterfaceElement.maskTexture);
		this._displayObject.scale.x = width / 8;
		this._displayObject.scale.y = height / 8;

		this._displayObject.addChild(this._maskSprite);

		this.resize(width, height);
	}

	public setAsMask(element:InterfaceElement) {
		element.maskSprite = this._maskSprite;
	}
}