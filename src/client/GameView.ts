export default class GameView {
	private _frame:number = -1;
	private _frameInterval:number = 10; //ms

	private _firstFrameNumber:number = -1;
	private _firstFrameTime:number;

	constructor() {

	}

	public init(currentFrame, frameInterval) {
		this._frame = currentFrame;
		this._firstFrameNumber = currentFrame;
		this._frameInterval = frameInterval;
		this._firstFrameTime = Date.now();
	}

	public update() {

	}
}