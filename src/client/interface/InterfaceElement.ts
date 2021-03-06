/// <reference path="../../declarations/pixi.js.d.ts"/>
import Vector2D from '../../common/Vector2D';
import AttachInfo from './AttachInfo';
import ResizeInfo from './ResizeInfo';
import InputManager from './InputManager';
import Game from '../Game';
import GameEventHandler from '../events/GameEventHandler';
import InterfaceRoot from './prefabs/InterfaceRoot';

export default class InterfaceElement extends GameEventHandler {
	public id:string = "";
	public name:string = "";
	public clickable:boolean = false;
	public draggable:boolean = false;
	public useOwnBounds:boolean = true; //instead of the container's bounds, use the rect defined by own x,y,width,height
	public ignoreChildrenForClick:boolean = false; //don't click the kids, click me
	public dragElement:InterfaceElement = null;
	public useDebugRect:boolean = true;

	public static maskTexture:PIXI.Texture = null; //8x8

	/*public onMouseDown:(coords:Vector2D)=>void;
	public onMouseUp:(coords:Vector2D)=>void;
	public onClick:(coords:Vector2D)=>void;
	public onHoverStart:(coords:Vector2D)=>void;
	public onHoverEnd:(coords:Vector2D)=>void;
	public onFocus:()=>void;
	public onUnfocus:()=>void;
	public onChange:()=>void;
	public onKeyDown:(which:string)=>void;
	public onKeyUp:(which:string)=>void;
	public onKeyPress:(which:string)=>void; //See jQuery documentation for how these differ*/

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

	/**
	 * Updated every frame by the root UI element.
	 */
	protected static drawTime:number = 0;

	/**
	 * Base class for anything in the UI. Has a parent and can have children, like DOM elements.
	 * Wraps a PIXI DisplayObjectContainer
	 */
	constructor () {
		super();
	}

	// === GET ===
	get x():number { return this._position.x; }
	get y():number { return this._position.y; }
	get position():Vector2D { return this._position; }
	get width():number { return this._width; }
	get height():number { return this._height; }
	get displayObject():PIXI.Container { return this._displayObject; }
	get children():Array<InterfaceElement> { return this._children.slice(); }
	get numChildren():number { return this._children.length; }
	get fullName():string {
		var s:string = this._className;
		if (this.id != "")      s += " #" + this.id;
		if (this.name != "")    s += " \"" + this.name + "\"";
		if (this.draggable)     s += " (draggable)";
		if (!this.clickable)    s += " (not clickable)";

		return s;
	}
	get isRoot():boolean { return this._parent == null && this._displayObject.parent != null; }
	get isFocused():boolean { return InputManager.instance.focusedElement == this; }
	get visible():boolean { return this._displayObject.visible; }

	//=== SET ===
	set position(pos:Vector2D) { this._position.set(pos); this.updateDisplayObjectPosition(); }
	set x(x:number) { this._position.x = x; this.updateDisplayObjectPosition(); }
	set y(y:number) { this._position.y = y; this.updateDisplayObjectPosition(); }
	set visible(v:boolean) { this._displayObject.visible = v; }
	set maskSprite(m:PIXI.Sprite|PIXI.Graphics) { this._displayObject.mask = m; }

	public getElementAtPoint(point:Vector2D):InterfaceElement {
		var element:InterfaceElement = null;
		var checkChildren:boolean = this.isRoot;

		if (!checkChildren)
		{
			var bounds:PIXI.Rectangle;

			if (this.useOwnBounds) {
				//note: this assumes that children are all within the bounds of this object
				var pos:Vector2D = this.getGlobalPosition();
				bounds = new PIXI.Rectangle(pos.x, pos.y, this._width, this._height);
			} else {
				bounds = this._displayObject.getBounds();
			}

			checkChildren = bounds.contains(point.x, point.y);
			if (checkChildren && this.ignoreChildrenForClick) {
				return this;
			}
		}

		if (checkChildren) {
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


	public getElementById(id:string, maxChecks:number = 1000) {
		if (this.id == id) return this;

		return this.getElementByFunction(function(e:InterfaceElement) {
			return e.id == id;
		});
	}

	public getElement(e:InterfaceElement) {
		if (this == e) return this; //derp

		return this.getElementByFunction(function(e2:InterfaceElement) {
			return e2 == e;
		});
	}

	//BFS, always call from the lowest known ancestor
	//Hey kid, don't make cyclical structures. I'm putting maxChecks here anyway, just in case.
	public getElementByFunction(func:(e:InterfaceElement)=>boolean, maxChecks:number = 500):InterfaceElement {
		if (func(this)) return this;

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
				if (func(child)) return child;
				toCheck.push(child);
			}
			maxChecks -= 1;
		}

		if (maxChecks <= 400) console.warn("Wasting cycles on InterfaceElement.getElementById");
		else if (maxChecks == 0) console.warn("Wasting LOTS of cycles on InterfaceElement.getElementById");

		return null;
	}

	public draw() {
		if (this.isRoot) InterfaceElement.drawTime = Date.now();
		if (!this.visible) return; //this could cause problems?

		var len:number = this._children.length;
		for (var i = 0; i < len; i++) {
			this._children[i].draw();
		}

		if (Game.useDebugGraphics && this.useDebugRect) {
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

	public resizeToFitChildren() {
		var w:number = 0;
		var h:number = 0;

		for (var child of this._children) {
			if (child.width > w) w = child.width;
			if (child.height > h) h = child.height;
		}

		this.resize(w, h);
	}

	public addChild(child:InterfaceElement) {
		this._children.push(child);
		this._displayObject.addChild(child._displayObject);
		child._parent = this;
		child.onAdd();
	}

	public addChildAt(child:InterfaceElement, index:number = -1) {
		if (index < 0 || index > this._children.length) {
			this.addChild(child);
			return;
		}

		this._children.splice(index, 0, child);
		this._displayObject.addChildAt(child._displayObject, index);
		child.onAdd();
	}

	/**
	 * Subclasses should use this to add listeners if needed
	 */
	protected onAdd() {

	}

	/**
	 * Subclasses should use this to remove their listeners.
	 */
	protected onRemove(fromParent:InterfaceElement) {

	}

	/**
	 * Necessary for cleaning up WebGL memory. If this element isn't going to be used anymore, call this.
	 * Called recursively on chldren.
	 */
	public destroy() {
		for (var child of this._children) {
			child.destroy();
		}

		if (this._parent) {
			this.removeSelf(false); //no need to recurse from there, since this already does so
		}

		//base class has no PIXI stuff to destroy (right?)
	}

	public removeChild(child:InterfaceElement, recurse:boolean = false) {
		var index:number = this._children.indexOf(child);
		if (index === -1) return;

		this._children.splice(index, 1);
		this._displayObject.removeChild(child._displayObject);
		child._parent = null;
		child.detachFromParent();
		child.disableResizeToParent();

		if (recurse) {
			while (child._children.length > 0) {
				child.removeChild(child._children[child._children.length-1], true);
			}
		}

		child.onRemove(this);
	}

	/**
	 * Removes this element from its parent
	 */
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

	/**
	 *
	 * @param info If null, fills the parent completely
	 */
	public resizeToParent(info:ResizeInfo = null) {
		if (info == null) info = ResizeInfo.get(1, 1, 0, 0);
		this._resize = info;
		this.onParentResize();
	}

	public disableResizeToParent() {
		this._resize = null;
	}

	public positionRelativeTo(other:InterfaceElement, info:AttachInfo) {
		this._position.x = (other._width * info.to.x) - (this.width * info.from.x) + info.offset.x;
		this._position.y = (other._height * info.to.y) - (this.height * info.from.y) + info.offset.y;

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

	public setAttachOffset(x:number, y:number) {
		if (!this._attach) return;
		this._attach.offset.x = x;
		this._attach.offset.y = y;

		this.onParentResize(); //cheaty? or just a naming problem
	}

	public clearMask() {
		this._displayObject.mask = null;
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
		} else if (this._attach) {
			this.positionRelativeTo(this._parent, this._attach);
		}
	}

	protected onResize(notifyChildren:boolean = true) {
		if (this._attach) this.positionRelativeTo(this._parent, this._attach);

		if (notifyChildren) {
			var len = this._children.length;
			for (var i = 0; i < len; i++) {
				this._children[i].onParentResize();
			}
		}
	}
}