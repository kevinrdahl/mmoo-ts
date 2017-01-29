import GameEvent from './GameEvent';

export default class GameEventHandler {
	private _listenersByType:Object = {};

	public addEventListener(eventType:string, listener:(e:GameEvent)=>void) {
		var listeners:Array<(e:GameEvent)=>void> = this._listenersByType[eventType];

		if (!listeners) {
			listeners = [];
			this._listenersByType[eventType] = listeners;
		} else if (listeners.indexOf(listener) >= 0) {
			console.log("GameEventDispatcher: Not adding duplicate listener of type " + eventType);
			return;
		}

		listeners.push(listener);
	}

	public removeEventListener(eventType:string, listener:(e:GameEvent)=>void) {
		var listeners:Array<(e:GameEvent)=>void> = this._listenersByType[eventType];

		if (!listeners) {
			return;
		}

		var index:number = listeners.indexOf(listener);
		if (index === -1) {
			console.log("GameEventDispatcher: Can't remove listener that doesn't exist, type " + eventType);
		} else {
			listeners.splice(index, 1);
		}
	}

	public removeAllEventListeners() {
		for (var type in this._listenersByType) {
			this._listenersByType[type].splice(0); //clears list
			delete this._listenersByType[type];
		}
	}

	public sendNewEvent(type:string, data:any = null) {
		this.sendEvent(GameEvent.getInstance(type, data));
	}

	/**
	 * NOTE: the event will be released after this call
	 */
	public sendEvent(event:GameEvent) {
		var listeners:Array<(e:GameEvent)=>void> = this._listenersByType[event.type];

		if (!listeners) {
			return;
		}

		for (var listener of listeners) {
			listener(event);
		}

		GameEvent.releaseInstance(event);
	}
}