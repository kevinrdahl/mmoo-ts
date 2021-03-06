/// <reference path="../../declarations/jquery.d.ts"/>
import Vector2D from '../../common/Vector2D';
import InterfaceElement from './InterfaceElement';
import Game from '../Game';
import GameEvent from '../events/GameEvent';

/**
 * Wrangles all them silly events and suchlike.
 * Doing anything in the game proper should be relegated to a different class (probably?)
 *
 * Singleton!
 */
export default class InputManager {
	public dragThreshold:number = 8;

	private static _instance:InputManager = new InputManager();
	public static get instance():InputManager {
		return InputManager._instance;
	}

	private _initialized:Boolean = false;
	private _div:JQuery;
	private _mouseCoords:Vector2D = new Vector2D(0,0);
	private _leftMouseDownCoords:Vector2D = null;
	private _leftMouseDownElement:InterfaceElement = null;
	private _hoverElement:InterfaceElement = null;
	private _focusElement:InterfaceElement = null;
	private _trackedKeys:Object = {
		"SHIFT": false,
		"CTRL": false,
		"ALT": false,
		"UP": false,
		"DOWN": false,
		"LEFT": false,
		"RIGHT": false
	}

	get leftMouseDown():Boolean { return this._leftMouseDownCoords != null; }
	get focusedElement():InterfaceElement { return this._focusElement; }
	get mouseCoords():Vector2D { return this._mouseCoords; }

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
		$(window).keydown(this._onKeyDown);
		$(window).keyup(this._onKeyUp);
		$(window).keypress(this._onKeyPress);

		//disable right click context menu
		this._div.contextmenu(function(e:JQueryMouseEventObject) {
			e.stopPropagation();
			return false;
		});
	}

	public focus(element:InterfaceElement) {
		if (element != this._focusElement) {
			if (this._focusElement) {
				this._focusElement.sendNewEvent(GameEvent.types.ui.UNFOCUS);
			}

			this._focusElement = element;

			if (element) {
				console.log("InputManager: Focus " + element.fullName);
				element.sendNewEvent(GameEvent.types.ui.FOCUS);
			} else {
				console.log("InputManager: No element focused");
			}
		}
	}

	public isKeyDown(key:string):boolean {
		if (this._trackedKeys.hasOwnProperty(key) && this._trackedKeys[key]) return true;
		return false;
	}

	private _onMouseDown = (e:JQueryMouseEventObject) => {
		var coords:Vector2D = this.getMouseCoords(e, true);
		var element:InterfaceElement = Game.instance.interfaceRoot.getElementAtPoint(coords);

		if (element) console.log("CLICK " + element.fullName);
		else console.log("CLICK nothing");

		switch(e.which) {
			case 1:
				//left
				this._leftMouseDownCoords = coords;
				this._leftMouseDownElement = element;
				if (element) {
					this.focus(element);
					//if (element.onMouseDown) element.onMouseDown(coords);
					element.sendNewEvent(GameEvent.types.ui.LEFTMOUSEDOWN);
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
					/*if (element.onMouseUp) element.onMouseUp(coords);
					if (element.onClick && element == this._leftMouseDownElement) element.onClick(coords);*/
					element.sendNewEvent(GameEvent.types.ui.LEFTMOUSEUP);
					if (element == this._leftMouseDownElement) element.sendNewEvent(GameEvent.types.ui.LEFTMOUSECLICK);
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
				console.warn("InputManager: mouse input with which = " + e.which + "?");
		}
	}

	private _onMouseMove = (e:JQueryMouseEventObject) => {
		var coords:Vector2D = this.getMouseCoords(e, true);
		var element:InterfaceElement = Game.instance.interfaceRoot.getElementAtPoint(coords);

		if (this.leftMouseDown && coords.distanceTo(this._leftMouseDownCoords) > this.dragThreshold) this.beginDrag();

		//TODO: check whether we're about to drag it?
		if (this._hoverElement != element) {
			if (element) {
				element.sendNewEvent(GameEvent.types.ui.MOUSEOVER);
			}
			if (this._hoverElement) {
				this._hoverElement.sendNewEvent(GameEvent.types.ui.MOUSEOUT);
			}
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
		var key:string = this.getKeyString(e);

		if (this._focusElement) {
			//this._focusElement.sendNewEvent(GameEvent.types.ui.KEY, key);
			if (key.length > 1) this._focusElement.sendNewEvent(GameEvent.types.ui.KEY, key);
		}

		if (this._trackedKeys.hasOwnProperty(key)) {
			this._trackedKeys[key] = true;
		}

		if (preventedKeys.indexOf(e.which) != -1) {
			e.preventDefault();
		}
	}

	private _onKeyUp = (e:JQueryKeyEventObject) => {
		var key:string = this.getKeyString(e);

		if (this._trackedKeys.hasOwnProperty(key)) {
			this._trackedKeys[key] = false;
		}
	}

	private _onKeyPress = (e:JQueryKeyEventObject) => {
		if (this._focusElement) {
			this._focusElement.sendNewEvent(GameEvent.types.ui.KEY, e.key);
		}

		if (preventedKeys.indexOf(e.which) != -1) {
			e.preventDefault();
		}
	}

	private getKeyString(e:JQueryKeyEventObject):string {
		var name:string = keyNames[e.which.toString()];

		if (name) return name;
		return String.fromCharCode(e.which);
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

var preventedKeys:Array<number> = [8,9,13,16,17,18,37,38,39,40];
var keyNames = {
	"8": "BACKSPACE",
	"9": "TAB",
	"13": "ENTER",
	"16": "SHIFT",
	"17": "CTRL",
	"18": "ALT",
	"38": "UP",
	"40": "DOWN",
	"37": "LEFT",
	"39": "RIGHT"
}