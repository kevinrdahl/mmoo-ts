class SoundLoadRequest {
	constructor (
		public name:string,
		public list:Array<Array<string>>,
		public onComplete:(name:string)=>void,
		public onProgress:(name:string, progress:number)=>void = null
	) {}
}

export default class SoundManager {

	static get instance():SoundManager {
		if (SoundManager._instance == null) SoundManager._instance = new SoundManager();
		return SoundManager._instance;
	}
	private static _instance:SoundManager = null;

	get volume():number { return this._volume; }
	set volume(volume:number) { this._volume = volume; this.onVolumeChange(); }

	get musicVolume():number { return this._musicVolume; }
	set musicVolume(volume:number) { this._musicVolume = volume; this.onMusicVolumeChange(); }

	private _requests:Array<SoundLoadRequest> = [];
	private _numLoaded:number;
	private _musicVolume:number = 1;
	private _volume:number = 1;

	private _music:createjs.AbstractSoundInstance = null;

	constructor () {
		createjs.Sound.addEventListener("fileload", ()=>this.onSoundLoaded());
		createjs.Sound.alternateExtensions = ['mp3'];
	}

	public load(requestName:string, assetList:Array<Array<string>>, onComplete:(name:string)=>void, onProgress:(name:string, progress:number)=>void = null) {
		this._requests.push(new SoundLoadRequest(requestName, assetList, onComplete, onProgress));
		if (this._requests.length == 1) this._load();
	}

	public playMusic(name:string) {
		this.stopMusic();
		this._music = createjs.Sound.play(name, {loop:-1});
	}

	public stopMusic() {
		if (this._music != null) this._music.stop();
		this._music = null;
	}

	private _load() {
		this._numLoaded = 0;
		var list:Array<Array<string>> = this._requests[0].list;
		for (var i = 0; i < list.length; i++) {
			console.log("Registering " + list[i][1] + " as " + list[i][0]);
			createjs.Sound.registerSound({id:list[i][0], src:list[i][1]});
		}
	}

	private onSoundLoaded() {
		this._numLoaded += 1;
		var req:SoundLoadRequest = this._requests[0];

		if (req.onProgress) {
			req.onProgress(req.name, this._numLoaded / req.list.length);
		}

		if (this._numLoaded >= req.list.length) {
			//done
			req.onComplete(req.name);
			this._requests.shift();
			if (this._requests.length > 0) this._load();
		}
	}

	private onVolumeChange() {
		this.onMusicVolumeChange();
	}

	private onMusicVolumeChange() {
		if (this._music) this._music.volume = this._musicVolume * this._volume;
	}
}