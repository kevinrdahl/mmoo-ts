/// <reference path="../../../declarations/pixi.js.d.ts"/>
import InterfaceElement from './InterfaceElement';
import Vector2D from '../../common/Vector2D';

export default class ElementList extends InterfaceElement {
	public static HORIZONTAL:number = 0;
	public static VERTICAL:number = 1;

	private _padding:number;
	private _orientation:number;
	private _childBounds:Array<number> = [];

	constructor(orientation:number = ElementList.VERTICAL, padding:number = 5) {
		super();

		this._orientation = orientation;
		this._padding = padding;
		this._className = "ElementList";
	}

	public addChild(child:InterfaceElement) {
		super.addChild(child);
		this._childBounds.push(0);
		this.redoLayout(child);
	}

	public addChildAt(child:InterfaceElement, index:number) {
		super.addChildAt(child, index);
		this._childBounds.push(0);
		this.redoLayout(child);
	}

	public removeChild(child:InterfaceElement) {
		var index = this._children.indexOf(child);
		super.removeChild(child);

		this._childBounds.pop();
		if (index != -1 && index < this._children.length) this.redoLayout(this._children[index]);
	}

	private redoLayout(fromChild:InterfaceElement = null) {
		var index:number = -1;
		if (fromChild == null && this._children.length > 0) {
			index = 0;
		} else if (fromChild != null) {
			index = this._children.indexOf(fromChild);
		}

		if (index == -1) return;

		var offset = 0;
		var child:InterfaceElement;
		if (index > 0) offset = this._childBounds[index-1];

		for (; index < this._children.length; index++) {
			child = this._children[index];
			if (this._orientation == ElementList.VERTICAL) {
				child.y = offset;
				offset += child.height;
			} else {
				child.x = offset;
				offset += child.width;
			}
			this._childBounds[index] = offset;
		}
	}
}