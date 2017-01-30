/// <reference path="../../declarations/pixi.js.d.ts"/>
import InterfaceElement from './InterfaceElement';
import Vector2D from '../../common/Vector2D';

export default class ElementList extends InterfaceElement {
	public static HORIZONTAL:number = 0;
	public static VERTICAL:number = 1;

	public static NONE:number = -1;
	public static LEFT:number = 0;
	public static TOP:number = ElementList.LEFT;
	public static RIGHT:number = 1;
	public static BOTTOM:number = ElementList.RIGHT;
	public static CENTRE:number = 2;

	private _padding:number;
	private _orientation:number;
	private _childBounds:Array<number> = [];
	private _childPadding:Array<number> = [];
	private _alignment:number;

	protected _debugColor = 0xffff00;

	constructor(width:number, orientation:number = ElementList.VERTICAL, padding:number = 5, align:number = ElementList.LEFT) {
		super();

		this._orientation = orientation;
		this._padding = padding;
		this._alignment = align;
		this._className = "ElementList";

		if (orientation == ElementList.VERTICAL) {
			this._width = width;
		} else {
			this._height = width;
		}
	}

	public addChild(child:InterfaceElement, extraPadding:number = 0, redoLayout:boolean = true) {
		super.addChild(child);
		this._childBounds.push(0);
		this._childPadding.push(this._padding + extraPadding);

		if (redoLayout) {
			this.redoLayout(child);
		}
	}

	public addChildAt(child:InterfaceElement, index:number, extraPadding:number = 0, redoLayout:boolean = true) {
		super.addChildAt(child, index);
		this._childBounds.push(0);
		this._childPadding.splice(index, 0, extraPadding);

		if (redoLayout) {
			this.redoLayout(child);
		}
	}

	public removeChild(child:InterfaceElement) {
		var index = this._children.indexOf(child);
		super.removeChild(child);


		if (index != -1 && index < this._children.length) {
			this._childBounds.pop();
			this.redoLayout(this._children[index]);
		}
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
				offset += child.height + this._childPadding[index];

				switch(this._alignment) {
					case ElementList.LEFT: child.x = 0; break;
					case ElementList.RIGHT: child.x = this.width - child.width; break;
					case ElementList.CENTRE: child.x = (this.width - child.width) / 2; break;
				}

			} else { //HORIZONTAL
				child.x = offset;
				offset += child.width + this._childPadding[index];

				switch(this._alignment) {
					case ElementList.TOP: child.y = 0; break;
					case ElementList.BOTTOM: child.y = this.height - child.height; break;
					case ElementList.CENTRE: child.y = (this.height - child.height) / 2; break;
				}
			}
			this._childBounds[index] = offset;
		}

		var length:number = 0;

		if (this._children.length > 0) {
			var startElement:InterfaceElement = this._children[0];
			var endElement:InterfaceElement = this._children[this._children.length - 1];
			if (this._orientation == ElementList.VERTICAL) {
				length = (endElement.y + endElement.height) - startElement.y;
			} else {
				length = (endElement.x + endElement.width) - startElement.x;
			}
		}

		if (this._orientation == ElementList.VERTICAL) {
			this._height = length;
		} else {
			this._width = length;
		}

		this.onResize(false); //don't tell children that this has resized
	}
}