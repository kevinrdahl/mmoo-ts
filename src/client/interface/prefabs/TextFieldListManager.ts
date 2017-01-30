import TextField from '../TextField';
import GameEvent from '../../events/GameEvent';
import GameEventHandler from '../../events/GameEventHandler';
import InputManager from '../InputManager';

export default class TextFieldListManager extends GameEventHandler {

	private _fields:Array<TextField>;

	/**
	 * Not an InterfaceElement! Just sets up events (TAB/SUBMIT) for a list of text elements
	 */
	constructor(fields:Array<TextField> = null) {
		super();
		if (fields) this.init(fields);
	}

	public init(fields:Array<TextField>) {
		if (this._fields) this.cleanup();

		this._fields = fields;

		for (var field of fields) {
			field.addEventListener(GameEvent.types.ui.TAB, this.onTab);
			field.addEventListener(GameEvent.types.ui.SUBMIT, this.onSubmit);
		}
	}

	public cleanup() {
		for (var field of this._fields) {
			field.removeEventListener(GameEvent.types.ui.TAB, this.onTab);
			field.removeEventListener(GameEvent.types.ui.SUBMIT, this.onSubmit);
		}
	}

	private onTab = (e:GameEvent) => {
		var from:TextField = e.from as TextField;
		if (!from) return;
		var index:number = this._fields.indexOf(from);
		if (index === -1) return;

		var increment = (InputManager.instance.isKeyDown("SHIFT")) ? -1 : 1;
		index = (index + increment) % this._fields.length;
		if (index == -1) index = this._fields.length - 1;

		InputManager.instance.focus(this._fields[index]);
	}

	private onSubmit = (e:GameEvent) => {
		this.sendEvent(e);
	}
}