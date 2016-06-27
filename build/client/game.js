"use strict";
var Log = require('./util/Log');
var Connection_1 = require('./Connection');
var TextureLoader_1 = require('./textures/TextureLoader');
var TextureWorker_1 = require('./textures/TextureWorker');
var SoundManager_1 = require('./sound/SoundManager');
var SoundAssets = require('./sound/SoundAssets');
var InterfaceElement_1 = require('./interface/InterfaceElement');
var TextElement_1 = require('./interface/TextElement');
var AttachInfo_1 = require('./interface/AttachInfo');
var Game = (function () {
    function Game(viewDiv) {
        var _this = this;
        this.viewDiv = viewDiv;
        this.stage = null;
        this.renderer = null;
        this.viewWidth = 500;
        this.viewHeight = 500;
        this._volatileGraphics = new PIXI.Graphics();
        this._documentResized = true;
        this.onTextureWorkerGetTexture = function (requestKey, texture) {
            var sprite = new PIXI.Sprite(texture);
            sprite.scale.x = 5;
            sprite.scale.y = 5;
            sprite.position.x = 100;
            sprite.position.y = 100;
            _this.stage.addChild(sprite);
        };
    }
    Object.defineProperty(Game.prototype, "volatileGraphics", {
        get: function () { this._volatileGraphics.clear(); return this._volatileGraphics; },
        enumerable: true,
        configurable: true
    });
    Game.prototype.init = function () {
        var _this = this;
        Log.setLogType("debug", new Log.LogType("", "#999"));
        Log.setLogType("error", new Log.LogType("ERROR: ", "#f00"));
        Log.log("debug", "Initializing game...");
        if (Game.instance === null) {
            Game.instance = this;
        }
        else {
            Log.log("error", "There's already a game! Aborting Init");
            return;
        }
        this.stage = new PIXI.Container();
        this.renderer = PIXI.autoDetectRenderer(500, 500, { backgroundColor: 0xaaaaff });
        this.renderer.autoResize = true;
        this.viewDiv.appendChild(this.renderer.view);
        this.textureWorker = new TextureWorker_1.default('js/mmoo-worker.js');
        window.addEventListener('resize', function () { return _this._documentResized = true; });
        this.interfaceRoot = new InterfaceElement_1.default();
        this.interfaceRoot.id = "root";
        this.interfaceRoot.name = "root";
        this.interfaceRoot.addToContainer(this.stage);
        this.debugGraphics = new PIXI.Graphics();
        this.stage.addChild(this.debugGraphics);
        this.connect();
        this.render();
    };
    Game.prototype.render = function () {
        var _this = this;
        if (this._documentResized) {
            this._documentResized = false;
            this.resize();
        }
        if (Game.useDebugGraphics)
            this.debugGraphics.clear();
        this.interfaceRoot.draw();
        var renderer = this.renderer;
        renderer.render(this.stage);
        requestAnimationFrame(function () { return _this.render(); });
    };
    Game.prototype.resize = function () {
        this.viewWidth = this.viewDiv.clientWidth;
        this.viewHeight = this.viewDiv.clientHeight;
        this.renderer.resize(this.viewWidth, this.viewHeight);
        this.interfaceRoot.resize(this.viewWidth, this.viewHeight);
    };
    Game.prototype.connect = function () {
        var _this = this;
        var loadingText = new TextElement_1.default("Connecting...", TextElement_1.default.veryBigText);
        loadingText.id = "loadingText";
        this.interfaceRoot.addChild(loadingText);
        loadingText.attachToParent(AttachInfo_1.default.Center);
        this.connection = new Connection_1.default("localhost", 9002);
        this.connection.onConnect = function () { return _this.onConnect(); };
        this.connection.onMessage = function (msg) { return _this.onConnectionMessage(msg); };
        this.connection.onError = function (e) { return _this.onConnectionError(e); };
        this.connection.onDisconnect = function () { return _this.onDisconnect(); };
        this.connection.connect();
    };
    Game.prototype.onConnect = function () {
        this.loadTextures();
        this.connection.send("Hello!");
    };
    Game.prototype.onConnectionMessage = function (msg) {
    };
    Game.prototype.onConnectionError = function (e) {
    };
    Game.prototype.onDisconnect = function () {
    };
    Game.prototype.loadTextures = function () {
        var _this = this;
        Log.log("debug", "=== LOAD TEXTURES ===");
        var loadingText = this.interfaceRoot.getElementById("loadingText");
        loadingText.text = "Loading textures...";
        this.textureLoader = new TextureLoader_1.default("textures.png", "textureMap.json", function () { return _this.onTexturesLoaded(); });
    };
    Game.prototype.onTexturesLoaded = function () {
        this.sendGraphicsToWorker();
        this.loadSounds();
        this.textureWorker.getTexture('parts/helmet', { from: [0x555555], to: [0xff0000] }, this.onTextureWorkerGetTexture);
    };
    Game.prototype.sendGraphicsToWorker = function () {
        var data = this.textureLoader.getData();
        this.textureWorker.putTextures(data);
    };
    Game.prototype.loadSounds = function () {
        var _this = this;
        var list = SoundAssets.interfaceSounds.concat(SoundAssets.mainMenuMusic);
        SoundManager_1.default.instance.load("initial", list, function (which) { return _this.onSoundsLoaded(which); }, function (which, progress) { return _this.onSoundsLoadedProgress(which, progress); });
        var loadingText = this.interfaceRoot.getElementById("loadingText");
        loadingText.text = "Loading sounds... (0%)";
    };
    Game.prototype.onSoundsLoaded = function (which) {
        if (which == "initial") {
            SoundManager_1.default.instance.playMusic("music/fortress");
            this.initMainMenu();
        }
    };
    Game.prototype.onSoundsLoadedProgress = function (which, progress) {
        if (which == "initial") {
            var loadingText = this.interfaceRoot.getElementById("loadingText");
            loadingText.text = "Loading sounds... (" + Math.round(progress * 100) + "%)";
        }
    };
    Game.prototype.initMainMenu = function () {
        var loadingText = this.interfaceRoot.getElementById("loadingText");
        this.interfaceRoot.removeChild(loadingText);
    };
    Game.instance = null;
    Game.useDebugGraphics = true;
    return Game;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Game;
//# sourceMappingURL=Game.js.map