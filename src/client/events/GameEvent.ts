export default class GameEvent {
	public static types = {
		ui: {
			LEFTMOUSEDOWN:"left mouse down",
			LEFTMOUSEUP:"left mouse up",
			LEFTMOUSECLICK:"left mouse click",
			RIGHTMOUSEDOWN:"right mouse down",
			RIGHTMOUSEUP:"right mouse up",
			RIGHTMOUSECLICK:"right mouse click",
			MOUSEOVER:"mouse over",
			MOUSEOUT:"mouse out",
			FOCUS:"focus",
			UNFOCUS:"unfocus",
			CHANGE:"change",
			KEY:"key"
		}
	}

	public static getInstance(type:string, data:any = null):GameEvent {
		var instance:GameEvent;

		if (GameEvent._pool.length > 0) {
			instance = GameEvent._pool.pop();
		} else {
			instance = new GameEvent();
		}

		instance.init(type, data);
		return instance;
	}

	public static releaseInstance(instance:GameEvent) {
		if (GameEvent._pool.length >= GameEvent._maxPooled) return;
		GameEvent._pool.push(instance);
	}

	protected static _pool:Array<GameEvent> = [];
	protected static _maxPooled:number = 10; //in theory there's only ever one event, unless its handlers spawn more

	public type:string;
	public data:any;

	/**
	 * Get instances via the static getInstance.
	 */
	constructor() {
	}

	protected init(type:string, data:any) {
		this.type = type;
		this.data = data;
	}
}