/// <reference path="../../../declarations/pixi.js.d.ts"/>
import Log = require('../util/Log');

export default class TextureLoader {
	private _sheet:PIXI.BaseTexture = null;
	private _map:Object = null;
	private _textures:Object = {};
	private _callback:any;
	
	constructor(sheetName:string, mapName:string, callback) {
		this._callback = callback;
		
		var _this:TextureLoader = this;
		
		PIXI.loader.add("sheet", sheetName);
		PIXI.loader.load(function(loader, resources) {
			_this._sheet = resources.sheet.texture.baseTexture;
			_this.onSheetOrMap();
		});
		
		var req = new XMLHttpRequest();
		
		req.onreadystatechange = function () {
			if (req.readyState == 4 && req.status == 200) {
				_this._map = JSON.parse(req.responseText).frames;
				_this.onSheetOrMap();
			}
		}
		req.open("GET", mapName, true);
		req.send();
	}
	
	public get(texName:string):PIXI.Texture {
		return this._textures[texName];
	}

	public getData() {
		var canvas = document.createElement('canvas');
		var context:CanvasRenderingContext2D = canvas.getContext('2d');
		canvas.width = this._sheet.width;
		canvas.height = this._sheet.height;
		context.drawImage(this._sheet.source, 0, 0);

		var data = {};
		var frame:any;
		for (var texName in this._map) {
			frame = this._map[texName].frame;
			data[texName] = context.getImageData(frame.x, frame.y, frame.w, frame.h);
		}

		return data;
	}
	
	private onSheetOrMap() {
		var sheet:PIXI.BaseTexture = this._sheet;
		var map:Object = this._map;
		
		if (sheet === null || map === null) return;
		
		var frame:any;
		var rect:PIXI.Rectangle;
		
		for (var texName in map) {
			frame = map[texName].frame;
			rect = new PIXI.Rectangle(frame.x, frame.y, frame.w, frame.h);
			this._textures[texName] = new PIXI.Texture(sheet, rect);
			
			//Log.log("debug", "LOADED " + texName);
		}
		
		this._callback();
	}
}