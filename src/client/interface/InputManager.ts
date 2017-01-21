/// <reference path="../../declarations/jquery.d.ts"/>
import Vector2D from '../../common/Vector2D';
import InterfaceElement from './InterfaceElement';
import Game from '../Game';

/**
 * Wrangles all them silly events and suchlike.
 * Doing anything in the game proper should be relegated to a different class (probably?)
 *
 * Singleton!
 */
export default class InputManager {
	public dragThreshold:number = 8;

	private static _instance:InputManager = null;
	public static get instance():InputManager {
		if (InputManager._instance) return InputManager._instance;
		InputManager._instance = new InputManager();
		return InputManager._instance;
	}

	private _initialized:Boolean = false;
	private _div:JQuery;
	private _mouseCoords:Vector2D = new Vector2D(0,0);
	private _leftMouseDownCoords:Vector2D = null;
	private _leftMouseDownElement:InterfaceElement = null;
	private _hoverElement:InterfaceElement = null;
	private _focusElement:InterfaceElement = null;

	get leftMouseDown():Boolean { return this._leftMouseDownCoords != null; }
	get focusedElement():InterfaceElement { return this._focusElement; }

	constructor() {
		if (InputManager._instance) {
			console.error("InputManager: hey, this is a singleton!")
		}
	}

	public init(selector:string) {
		if (this._initialized) return;
		this._initialized = true;

		this._div = $(selector);
		if (!this._div) {
			console.error("InputManager: no element found!")
		}
		this._div.mousedown(this._onMouseDown);
		this._div.mouseup(this._onMouseUp);
		this._div.mousemove(this._onMouseMove);
		this._div.scroll(this._onMouseScroll);
		this._div.mouseleave(this._onMouseLeave);
		this._div.keydown(this._onKeyDown);

		//disable right click context menu
		this._div.contextmenu(function(e:JQueryMouseEventObject) {
			e.stopPropagation();
			return false;
		});
	}

	public focus(element:InterfaceElement) {
		if (element != this._focusElement) {
			if (this._focusElement && this._focusElement.onUnfocus) {
				this._focusElement.onUnfocus();
			}

			if (element) {
				this._focusElement = element;
				if (element.onFocus) {
					element.onFocus();
				}
			}
		}
	}

	private _onMouseDown = (e:JQueryMouseEventObject) => {
		var coords:Vector2D = this.getMouseCoords(e, true);
		var element:InterfaceElement = Game.instance.interfaceRoot.getElementAtPoint(coords);

		switch(e.which) {
			case 1:
				//left
				this._leftMouseDownCoords = coords;
				this._leftMouseDownElement = element;
				if (element) {
					this.focus(element);
					if (element.onMouseDown) element.onMouseDown(coords);
				}
				break;
			case 2:
				//middle
				break;
			case 3:
				//right
				break;
			default:
				console.warn("InputManager: mouse input with which=" + e.which + "?");
		}
	}

	private _onMouseUp = (e:JQueryMouseEventObject) => {
		var coords:Vector2D = this.getMouseCoords(e, true);
		var element:InterfaceElement = Game.instance.interfaceRoot.getElementAtPoint(coords);

		switch(e.which) {
			case 1:
				//left
				if (element) {
					if (element.onMouseUp) element.onMouseUp(coords);
					if (element.onClick && element == this._leftMouseDownElement) element.onClick(coords);
				}

				this._leftMouseDownCoords = null;
				this._leftMouseDownElement = null;
				break;
			case 2:
				//middle
				break;
			case 3:
				//right
				break;
			default:
				console.warn("InputManager: mouse input with which=" + e.which + "?");
		}
	}

	private _onMouseMove = (e:JQueryMouseEventObject) => {
		var coords:Vector2D = this.getMouseCoords(e, true);
		var element:InterfaceElement = Game.instance.interfaceRoot.getElementAtPoint(coords);

		if (this.leftMouseDown && coords.distanceTo(this._leftMouseDownCoords) > this.dragThreshold) this.beginDrag();

		//TODO: check whether we're about to drag it?
		if (this._hoverElement && this._hoverElement != element && this._hoverElement.onHoverEnd) {
			this._hoverElement.onHoverEnd(coords);
		}

		//TODO: update dragged element

		this._hoverElement = element;
	}

	private _onMouseScroll = (e:JQueryMouseEventObject) => {

	}

	private _onMouseLeave = (e:JQueryMouseEventObject) => {
		this._leftMouseDownCoords = null;
		this._leftMouseDownElement = null;
	}

	private beginDrag() {

	}

	private _onKeyDown = (e:JQueryKeyEventObject) => {
		if (this._focusElement && this._focusElement.onKeyDown) {
			this._focusElement.onKeyDown(String.fromCharCode(e.which));
		}
	}

	private _onKeyUp = (e:JQueryKeyEventObject) => {
		if (this._focusElement && this._focusElement.onKeyUp) {
			this._focusElement.onKeyUp(String.fromCharCode(e.which));
		}
	}

	private _onKeyPress = (e:JQueryKeyEventObject) => {
		if (this._focusElement && this._focusElement.onKeyPress) {
			this._focusElement.onKeyPress(String.fromCharCode(e.which));
		}
	}

	private getMouseCoords(e:JQueryMouseEventObject, set:boolean=false) : Vector2D {
		var offset:JQueryCoordinates = this._div.offset();
		var coords:Vector2D = new Vector2D(
			e.pageX - offset.left,
			e.pageY - offset.top
		);
		if (set) this._mouseCoords = coords;
		return coords;
	}
}