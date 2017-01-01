/// <reference path="../../../declarations/pixi.js.d.ts"/>
import Game from '../Game';

export function simpleRectangle(target:PIXI.RenderTexture, width:number, height:number, color:number, borderWidth:number=0, borderColor:number=0):PIXI.RenderTexture {
	//if (!target) target = new PIXI.RenderTexture(Game.instance.renderer, width, height);
	if (!target) target = PIXI.RenderTexture.create(width, height);
	var g:PIXI.Graphics = Game.instance.volatileGraphics;

	g.lineStyle(borderWidth, borderColor, 1);
	g.beginFill(color, 1);
	g.drawRect(borderWidth/2, borderWidth/2, width-borderWidth, height-borderWidth);
	g.endFill();

	//target.render(g);
	Game.instance.renderer.render(g, target);

	return target;
}