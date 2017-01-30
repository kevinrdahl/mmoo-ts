/// <reference path="../../declarations/pixi.js.d.ts"/>

import InterfaceElement from './InterfaceElement';
import GameEvent from '../events/GameEvent';
import BaseButton from './BaseButton';
import AssetCache from '../../common/AssetCache';
import TextElement from './TextElement';
import AttachInfo from './AttachInfo';
import * as TextureGenerator from '../textures/TextureGenerator';

export default class TextButton extends BaseButton {
	//note: use the gems in oryx 16 bit items
	public static colorSchemes = {
		green: {
			normal: {bg:0x00852c, border:0x00ba3e},
			highlight: {bg:0x00ba3e, border:0x00ea4e},
			disabled: {bg:0x2b2b2b, border:0x616161}
		},

		red: {
			normal: {bg:0x910c0c, border:0xca1010},
			highlight: {bg:0xca1010, border:0xff1414},
			disabled: {bg:0x2b2b2b, border:0x616161}
		},

		blue: {
			normal: {bg:0x0c5991, border:0x107cca},
			highlight: {bg:0x107cca, border:0x149dff},
			disabled: {bg:0x2b2b2b, border:0x616161}
		}
	}

	//Caches background textures. When discarded, call destroy on them.
	private static _bgCache:AssetCache<PIXI.Texture> = new AssetCache<PIXI.Texture>(10, function(deleted:PIXI.Texture) {
		deleted.destroy(true);
	});

	//Generates a key and checks the texture cache before creating. Inserts if created.
	private static getOrCreateBg(width:number, height:number, scheme):PIXI.Texture {
		var key:string = JSON.stringify(scheme) + width + 'x' + height;
		var tex:PIXI.Texture = TextButton._bgCache.get(key);
		if (!tex) {
			tex = TextureGenerator.simpleRectangle(null, width, height, scheme.bg, 2, scheme.border);
			TextButton._bgCache.set(key, tex);
		}
		return tex;
	}

	private _textElement:TextElement;

	public set text(s:string) {
		this._textElement.text = s;
	}
	public get text():string { return this._textElement.text; }

	constructor(text:string, colorScheme=null, width:number = 100, height:number = 30, textStyle:PIXI.TextStyle=null) {
		if (!colorScheme) colorScheme = TextButton.colorSchemes.blue;
		if (!textStyle) textStyle = TextElement.basicText;

		super(
			TextButton.getOrCreateBg(width, height, colorScheme.normal),
			TextButton.getOrCreateBg(width, height, colorScheme.highlight),
			TextButton.getOrCreateBg(width, height, colorScheme.disabled)
		);
		this._className = "TextButton";

		this._textElement = new TextElement(text, textStyle);
		this.addChild(this._textElement);
		this._textElement.attachToParent(AttachInfo.Center);
	}
}