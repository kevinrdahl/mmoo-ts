/// <reference path="../../../declarations/pixi.js.d.ts"/>
import Vector2D from '../../common/Vector2D';
import AttachInfo from './AttachInfo';
import ResizeInfo from './ResizeInfo';

import Game from '../Game';

export default class InterfaceElement {
	public id:String = "";
	public name:String = "";
	public clickable:boolean = false;
	public draggable:boolean = false;
	public dragElement:InterfaceElement = null;
	public maskSprite:PIXI.Sprite = null;

	public onMouseDown = null;
	public onMouseUp = null;
	public onClick = null;
	public onHoverStart = null;
	public onHoverEnd = null;
	public onChange = null;

	protected _displayObject:PIXI.Container = new PIXI.Container();
	protected _parent:InterfaceElement = null;
	protected _children:Array<InterfaceElement> = [];
	protected _position:Vector2D = new Vector2D(0,0);
	protected _width:number = 0;
	protected _height:number = 0;
	protected _attach:AttachInfo = null;
	protected _resize:ResizeInfo = null;
	protected _className:string = "InterfaceElement";
	protected _debugColor:number = 0x0000ff;

	constructor () {

	}

	// === GET ===
	get x():number { return this._position.x; }
	get y():number { return this._position.y; }
	get position():Vector2D { return this._position.clone() }
	get width():number { return this._width; }
	get height():number { return this._height; }
	get displayObject():PIXI.Container { return this._displayObject; }
	get children():Array<InterfaceElement> { return this._children.slice() }
	get fullName():string {
		var s:string = this._className;
		if (this.id != "")      s += " #" + this.id;
		if (this.name != "")    s += " \"" + this.name + "\"";
		if (this.draggable)     s += " (draggable)";
		if (!this.clickable)    s += " (not clickable)";

		return s;
	}

	//=== SET ===
	set position(pos:Vector2D) { this._position.set(pos); this.updateDisplayObjectPosition(); }
	set x(x:number) { this._position.x = x; this.updateDisplayObjectPosition(); }
	set y(y:number) { this._position.y = y; this.updateDisplayObjectPosition(); }

	public getElementAtPoint(point:Vector2D):InterfaceElement {
		var element:InterfaceElement = null;
		var bounds = this._displayObject.getBounds();

		if (bounds.contains(point.x, point.y)) {
			//Work backwards. Most recently added children are on top.
			for (var i = this._children.length-1; i >= 0; i--) {
				element = this._children[i].getElementAtPoint(point);
				if (element != null) {
					break;
				}
			}

			if (element == null && this.clickable) {
				element = this;
			}
		}

		return element;
	}

	//BFS by id, always call from the lowest known ancestor
	//Hey kid, don't make cyclical structures. I'm putting maxChecks here anyway, just in case.
	public getElementById(id:string, maxChecks:number = 1000) {
		if (this.id == id) return this;

		var toCheck:Array<InterfaceElement> = [this];
		var element:InterfaceElement;
		var child:InterfaceElement;
		var len:number;
		var i:number;

		while (toCheck.length > 0 && maxChecks > 0) {
			element = toCheck.shift();
			len = element._children.length;
			for (i = 0; i < len; i++) {
				child = element._children[i];
				if (child.id == id) return child;
				toCheck.push(child);
			}
			maxChecks -= 1;
		}

		if (maxChecks <= 900) console.warn("Wasting cycles on InterfaceElement.getElementById");
		else if (maxChecks == 0) console.warn("Wasting LOTS of cycles on InterfaceElement.getElementById");

		return null;
	}

	public draw() {
		var len:number = this._children.length;
		for (var i = 0; i < len; i++) {
			this._children[i].draw();
		}

		if (Game.useDebugGraphics) {
			var global = this.getGlobalPosition();
			Game.instance.debugGraphics.lineStyle(1, this._debugColor, 1);
			Game.instance.debugGraphics.drawRect(global.x, global.y, this._width, this._height);
		}
	}

	public resize(width:number, height:number) {
		this._width = width;
		this._height = height;
		this.onResize();
	}

	//Used by Game to add the root element, shouldn't be used elsewhere
	public addToContainer(container:PIXI.Container) {
		container.addChild(this._displayObject);
	}

	public addChild(child:InterfaceElement) {
		this._children.push(child);
		this._displayObject.addChild(child._displayObject);
		child._parent = this;
	}

	public addChildAt(child:InterfaceElement, index:number = -1) {
		if (index < 0 || index > this._children.length) {
			this.addChild(child);
			return;
		}

		this._children.splice(index, 0, child);
		this._displayObject.addChildAt(child._displayObject, index);
	}

	public removeChild(child:InterfaceElement, recurse:boolean = false) {
		this._children.splice(this._children.indexOf(child), 1);
		this._displayObject.removeChild(child._displayObject);
		child._parent = null;
		child.detachFromParent();
		child.disableResizeToParent();

		if (recurse) {
			while (child._children.length > 0) {
				child.removeChild(child._children[child._children.length-1], true);
			}
		}
	}

	public removeSelf(recurse:boolean = true) {
		if (this._parent != null) this._parent.removeChild(this, recurse);
	}

	public moveChildToTop(child:InterfaceElement) {
		this.removeChild(child);
		this.addChild(child);
	}

	public attachToParent(info:AttachInfo) {
		this._attach = info;
		this.positionRelativeTo(this._parent, info);
	}

	public detachFromParent() {
		this._attach = null;
	}

	public resizeToParent(info:ResizeInfo) {
		this._resize = info;
		this.onParentResize();
	}

	public disableResizeToParent() {
		this._resize = null;
	}

	public positionRelativeTo(other:InterfaceElement, info:AttachInfo) {
		this._position.x = other._position.x + (other._width * info.to.x) - (this.width * info.from.x) + info.offset.x;
		this._position.y = other._position.y + (other._height * info.to.y) - (this.height * info.from.y) + info.offset.y;

		if (other != this._parent && other._parent != this._parent)
		{
			//need to account for different contexts
			var thisGlobal:Vector2D = this.getGlobalPosition();
			var otherGlobal:Vector2D = other.getGlobalPosition();
			thisGlobal.sub(this._position);
			otherGlobal.sub(other._position);

			//add the difference in base global position
			var globalDiff:Vector2D = otherGlobal;
			globalDiff.sub(thisGlobal);
			this._position.add(globalDiff);
		}

		//console.log(this.fullName + " position with " + JSON.stringify(info) + ": " + JSON.stringify(this._position));
		this.position = this._position;
	}

	public getGlobalPosition():Vector2D {
		var pos:Vector2D = this._position.clone();
		var parent:InterfaceElement = this._parent;

		while (parent != null) {
			pos.add(parent._position);
			parent = parent._parent;
		}

		return pos;
	}

	private updateDisplayObjectPosition() {
		this._displayObject.position.set(Math.round(this._position.x), Math.round(this._position.y));
	}

	private toNearestPixel() {
		this._position.round();
		this.updateDisplayObjectPosition();
	}

	private onParentResize() {
		if (this._resize) {
			var width:number = this._width;
			var height:number = this._height;
			if (this._resize.fill.x > 0) width = this._parent._width * this._resize.fill.x - this._resize.padding.x * 2;
			if (this._resize.fill.y > 0) height = this._parent._height * this._resize.fill.y - this._resize.padding.y * 2;

			this.resize(width, height);
			this.onResize();
		} else if (this._attach) {
			this.positionRelativeTo(this._parent, this._attach);
		}
	}

	private onResize() {
		if (this._attach) this.positionRelativeTo(this._parent, this._attach);

		var len = this._children.length;
		for (var i = 0; i < len; i++) {
			this._children[i].onParentResize();
		}
	}
}