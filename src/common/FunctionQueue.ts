/**
 * Bundles many async (and sync) actions into one async action.
 */
export default class FunctionQueue {
	protected _queue:Array<any> = [];
	protected _callback:any;
	protected _failCallback:any;

	constructor(callback:()=>void, failCallback:()=>void = null) {
		this._callback = callback;
		if (failCallback == null) this._failCallback = callback;
		else this._failCallback = failCallback;
	}

	/**
	 * Queues a function to be called. It is not run until this queue is started.
	 * It must accept one argument which is a callback function with a boolean
	 * argument indicating success.
	 */
	public enqueue(func:any) {
		this._queue.push(func);
	}

	public start() {
		this.onFunctionComplete(true); //bit of a cheat
	}

	protected onFunctionComplete = (success:boolean) => {
		if (success) {
			if (this._queue.length == 0) {
				this._callback();
			} else {
				this.callNextFunction();
			}
		} else {
			this._failCallback();
		}
	}

	protected callNextFunction() {
		var func = this._queue.shift();
		func(this.onFunctionComplete);
	}
}