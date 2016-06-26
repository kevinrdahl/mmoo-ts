"use strict";
var SoundLoadRequest = (function () {
    function SoundLoadRequest(name, list, onComplete, onProgress) {
        if (onProgress === void 0) { onProgress = null; }
        this.name = name;
        this.list = list;
        this.onComplete = onComplete;
        this.onProgress = onProgress;
    }
    return SoundLoadRequest;
}());
var SoundManager = (function () {
    function SoundManager() {
        var _this = this;
        this._requests = [];
        this._musicVolume = 1;
        this._volume = 1;
        this._music = null;
        createjs.Sound.addEventListener("fileload", function () { return _this.onSoundLoaded(); });
        createjs.Sound.alternateExtensions = ['mp3'];
    }
    Object.defineProperty(SoundManager, "instance", {
        get: function () {
            if (SoundManager._instance == null)
                SoundManager._instance = new SoundManager();
            return SoundManager._instance;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundManager.prototype, "volume", {
        get: function () { return this._volume; },
        set: function (volume) { this._volume = volume; this.onVolumeChange(); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundManager.prototype, "musicVolume", {
        get: function () { return this._musicVolume; },
        set: function (volume) { this._musicVolume = volume; this.onMusicVolumeChange(); },
        enumerable: true,
        configurable: true
    });
    SoundManager.prototype.load = function (requestName, assetList, onComplete, onProgress) {
        if (onProgress === void 0) { onProgress = null; }
        this._requests.push(new SoundLoadRequest(requestName, assetList, onComplete, onProgress));
        if (this._requests.length == 1)
            this._load();
    };
    SoundManager.prototype.playMusic = function (name) {
        this.stopMusic();
        this._music = createjs.Sound.play(name, { loop: -1 });
    };
    SoundManager.prototype.stopMusic = function () {
        if (this._music != null)
            this._music.stop();
        this._music = null;
    };
    SoundManager.prototype._load = function () {
        this._numLoaded = 0;
        var list = this._requests[0].list;
        for (var i = 0; i < list.length; i++) {
            console.log("Registering " + list[i][1] + " as " + list[i][0]);
            createjs.Sound.registerSound({ id: list[i][0], src: list[i][1] });
        }
    };
    SoundManager.prototype.onSoundLoaded = function () {
        this._numLoaded += 1;
        var req = this._requests[0];
        if (req.onProgress) {
            req.onProgress(req.name, this._numLoaded / req.list.length);
        }
        if (this._numLoaded >= req.list.length) {
            req.onComplete(req.name);
            this._requests.shift();
            if (this._requests.length > 0)
                this._load();
        }
    };
    SoundManager.prototype.onVolumeChange = function () {
        this.onMusicVolumeChange();
    };
    SoundManager.prototype.onMusicVolumeChange = function () {
        if (this._music)
            this._music.volume = this._musicVolume * this._volume;
    };
    SoundManager._instance = null;
    return SoundManager;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SoundManager;
//# sourceMappingURL=SoundManager.js.map