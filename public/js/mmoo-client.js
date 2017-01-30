(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var Log = require("./util/Log"); //import Log = require('./util/Log');
var Message_1 = require("../common/messages/Message");
var MessageTypes = require("../common/messages/MessageTypes");
var Connection = (function () {
    function Connection(hostName, port) {
        var _this = this;
        this.hostName = hostName;
        this.port = port;
        this.connString = "";
        this.socket = null;
        this.pendingGetCallbacks = {};
        this.onSocketConnect = function (e) {
            Log.log("conn", "Connected to " + _this.connString);
            _this.onConnect();
        };
        this.onSocketDisconnect = function (e) {
            Log.log("conn", "Disconnected from " + _this.connString);
        };
        this.onSocketError = function (e) {
            Log.log("error", "CONNECTION " + e.toString());
            _this.onError(e);
        };
        this.onSocketMessage = function (message) {
            Log.log("connRecv", message.data);
            var parsedMessage = Message_1.default.parse(message.data);
            if (parsedMessage) {
                if (parsedMessage.type == MessageTypes.GET_RESPONSE) {
                    _this.onGetResponse(parsedMessage);
                }
                else {
                    _this.onMessage(parsedMessage);
                }
            }
            else {
                Log.log("conn", "Unable to parse message: " + message.data);
            }
        };
        Log.setLogType("conn", new Log.LogType("", "#fff", "#06c"));
        Log.setLogType("connSend", new Log.LogType("SEND: ", "#93f"));
        Log.setLogType("connRecv", new Log.LogType("RECV: ", "#06c"));
        this.connString = 'ws://' + hostName + ':' + port;
    }
    Connection.prototype.connect = function () {
        if (this.socket != null) {
            this.disconnect("reconnecting");
        }
        this.socket = new WebSocket(this.connString);
        this.socket.addEventListener("open", this.onSocketConnect);
        this.socket.addEventListener("close", this.onSocketDisconnect);
        this.socket.addEventListener("message", this.onSocketMessage);
        this.socket.addEventListener("error", this.onSocketError);
    };
    Connection.prototype.disconnect = function (reason) {
        if (reason === void 0) { reason = "???"; }
        this.socket.close(1000, reason);
        this.socket = null;
    };
    Connection.prototype.send = function (msg) {
        try {
            this.socket.send(msg);
        }
        catch (err) {
            Log.log("error", err.toString());
        }
    };
    Connection.prototype.sendMessage = function (msg) {
        this.send(msg.serialize());
    };
    Connection.prototype.getRequest = function (subject, params, callback) {
        var request = new MessageTypes.GetRequest(subject, Connection.getRequestId, params);
        Connection.getRequestId += 1;
        this.pendingGetCallbacks[request.requestKey] = callback;
        this.sendMessage(request);
    };
    Connection.prototype.onGetResponse = function (response) {
        var callback = this.pendingGetCallbacks[response.requestKey];
        if (callback) {
            delete this.pendingGetCallbacks[response.requestKey];
            callback(response.response);
        }
    };
    return Connection;
}());
Connection.getRequestId = 0;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Connection;

},{"../common/messages/Message":32,"../common/messages/MessageTypes":33,"./util/Log":27}],2:[function(require,module,exports){
/// <reference path="../declarations/pixi.js.d.ts"/>
/// <reference path="../declarations/createjs/soundjs.d.ts"/>
"use strict";
//import Log = require('./util/Log');
var Log = require("./util/Log");
var Connection_1 = require("./Connection");
var LoginManager_1 = require("./LoginManager");
var TextureLoader_1 = require("./textures/TextureLoader");
var TextureWorker_1 = require("./textures/TextureWorker");
var TextureGenerator = require("./textures/TextureGenerator");
var SoundManager_1 = require("./sound/SoundManager");
//import SoundAssets = require('./sound/SoundAssets');
var SoundAssets = require("./sound/SoundAssets");
var InterfaceElement_1 = require("./interface/InterfaceElement");
var TextElement_1 = require("./interface/TextElement");
var AttachInfo_1 = require("./interface/AttachInfo");
var MainMenu_1 = require("./interface/prefabs/MainMenu");
var InputManager_1 = require("./interface/InputManager");
var GameView_1 = require("./GameView");
var MessageTypes = require("../common/messages/MessageTypes");
var Game = (function () {
    function Game(viewDiv) {
        /*=== PUBLIC ===*/
        this.stage = null;
        this.renderer = null;
        this.viewDiv = null;
        this.viewWidth = 500;
        this.viewHeight = 500;
        this.loginManager = new LoginManager_1.default();
        this.gameView = new GameView_1.default();
        this.joinedGameId = -1;
        /*=== PRIVATE ===*/
        this._volatileGraphics = new PIXI.Graphics(); //to be used when drawing to a RenderTexture
        this._documentResized = true;
        this.onTextureWorkerGetTexture = function (requestKey, texture) {
            /*var sprite:PIXI.Sprite = new PIXI.Sprite(texture);
            sprite.scale.x = 5;
            sprite.scale.y = 5;
            sprite.position.x = 100;
            sprite.position.y = 100;
            this.stage.addChild(sprite);*/
        };
        this.viewDiv = viewDiv;
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
        //Add the renderer to the DOM
        this.stage = new PIXI.Container();
        this.renderer = PIXI.autoDetectRenderer(500, 500, { backgroundColor: 0x0066ff });
        this.renderer.autoResize = true; //TS PIXI doesn't like this as an option
        this.viewDiv.appendChild(this.renderer.view);
        //Worker
        this.textureWorker = new TextureWorker_1.default('js/mmoo-worker.js');
        //Listen for resize
        window.addEventListener('resize', function () { return _this._documentResized = true; });
        //Add root UI element
        InterfaceElement_1.default.maskTexture = TextureGenerator.simpleRectangle(null, 8, 8, 0xffffff, 0);
        this.interfaceRoot = new InterfaceElement_1.default();
        this.interfaceRoot.id = "root";
        this.interfaceRoot.name = "root";
        this.interfaceRoot.addToContainer(this.stage);
        //Set up InputManager
        InputManager_1.default.instance.init("#viewDiv");
        //Debug graphics
        this.debugGraphics = new PIXI.Graphics();
        this.stage.addChild(this.debugGraphics);
        this.connect();
        this.render();
    };
    //actually seeing the game world will be relegated to ENTERING the game
    //joining a game lets you manager characters before entering
    Game.prototype.onJoinGame = function (gameId) {
        this.joinedGameId = gameId;
        //this.gameView.init(currentFrame, frameInterval);
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
        this.connection = new Connection_1.default("localhost", 9191);
        this.connection.onConnect = function () { return _this.onConnect(); };
        this.connection.onMessage = function (msg) { return _this.onConnectionMessage(msg); };
        this.connection.onError = function (e) { return _this.onConnectionError(e); };
        this.connection.onDisconnect = function () { return _this.onDisconnect(); };
        this.connection.connect();
    };
    Game.prototype.onConnect = function () {
        this.loadTextures();
    };
    Game.prototype.onConnectionMessage = function (message) {
        switch (message.type) {
            case MessageTypes.USER:
                this.loginManager.onUserMessage(message);
                break;
            case MessageTypes.GAME_JOINED:
                this.onGameStatusMessage(message);
                break;
            default:
                console.log("Received unhandled message from server:" + message.serialize());
        }
    };
    Game.prototype.onGameStatusMessage = function (message) {
    };
    Game.prototype.onConnectionError = function (e) {
        alert("Connection error! Is the server down?");
    };
    Game.prototype.onDisconnect = function () {
        alert("Disconnected from server!");
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
        //this.textureWorker.getTexture('parts/helmet', {from:[0x555555], to:[0xff0000]}, this.onTextureWorkerGetTexture);
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
            //SoundManager.instance.playMusic("music/fortress");
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
        var mainMenu = new MainMenu_1.default();
        this.interfaceRoot.addChild(mainMenu);
        mainMenu.attachToParent(AttachInfo_1.default.Center);
        mainMenu.showMenu("login");
        this.loginManager.login("testy", "abc123");
    };
    return Game;
}());
Game.instance = null;
Game.useDebugGraphics = false;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Game;

},{"../common/messages/MessageTypes":33,"./Connection":1,"./GameView":3,"./LoginManager":4,"./interface/AttachInfo":7,"./interface/InputManager":10,"./interface/InterfaceElement":11,"./interface/TextElement":15,"./interface/prefabs/MainMenu":18,"./sound/SoundAssets":21,"./sound/SoundManager":22,"./textures/TextureGenerator":23,"./textures/TextureLoader":24,"./textures/TextureWorker":25,"./util/Log":27}],3:[function(require,module,exports){
"use strict";
var GameView = (function () {
    function GameView() {
        this._frame = -1;
        this._frameInterval = 10; //ms
        this._firstFrameNumber = -1;
    }
    GameView.prototype.init = function (currentFrame, frameInterval) {
        this._frame = currentFrame;
        this._firstFrameNumber = currentFrame;
        this._frameInterval = frameInterval;
        this._firstFrameTime = Date.now();
    };
    GameView.prototype.update = function () {
    };
    return GameView;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GameView;

},{}],4:[function(require,module,exports){
/// <reference path="../declarations/jquery.d.ts"/>
"use strict";
var Util = require("../common/Util");
var MessageTypes = require("../common/messages/MessageTypes");
var Game_1 = require("./Game");
var LoginManager = (function () {
    function LoginManager() {
        this.userId = -1;
        this.userName = "Naebdy!";
    }
    Object.defineProperty(LoginManager.prototype, "userString", {
        get: function () { return "User " + this.userId + " (" + this.userName + ")"; },
        enumerable: true,
        configurable: true
    });
    LoginManager.prototype.login = function (name, pass) {
        var msg = new MessageTypes.UserMessage("login", {
            name: name,
            pass: pass
        });
        Game_1.default.instance.connection.sendMessage(msg);
    };
    LoginManager.prototype.createUser = function (name, pass, loginOnSuccess) {
        if (loginOnSuccess === void 0) { loginOnSuccess = false; }
        var msg = new MessageTypes.UserMessage("createUser", {
            name: name,
            pass: pass
        });
        Game_1.default.instance.connection.sendMessage(msg);
    };
    LoginManager.prototype.onUserMessage = function (msg) {
        var params = msg.params;
        if (msg.action == "login") {
            if (msg.success) {
                this.userId = params["id"];
                this.userName = params["name"];
                this.onLogin();
            }
            else {
                console.log("Failed to log in: " + msg.failReason);
            }
        }
        else if (msg.action == "createUser") {
            if (msg.success) {
                console.log("Created new user");
            }
            else {
                console.log("Failed to create user: " + msg.failReason);
            }
        }
        else if (msg.action == "joinGame") {
            if (msg.success) {
                Game_1.default.instance.onJoinGame(params["id"]);
            }
            else {
                console.log("Failed to join game: " + msg.failReason);
            }
        }
    };
    LoginManager.prototype.onLogin = function () {
        console.log("Logged in as " + this.userString);
        Game_1.default.instance.connection.getRequest("games", {}, function (response) {
            if (response && Util.isArray(response)) {
                console.log("Current games:\n" + JSON.stringify(response));
            }
        });
    };
    return LoginManager;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LoginManager;

},{"../common/Util":30,"../common/messages/MessageTypes":33,"./Game":2}],5:[function(require,module,exports){
"use strict";
var GameEvent = (function () {
    /**
     * Get instances via the static getInstance.
     */
    function GameEvent() {
    }
    GameEvent.getInstance = function (type, data, from) {
        if (data === void 0) { data = null; }
        if (from === void 0) { from = null; }
        var instance;
        if (GameEvent._pool.length > 0) {
            instance = GameEvent._pool.pop();
        }
        else {
            instance = new GameEvent();
        }
        instance.init(type, data, from);
        return instance;
    };
    GameEvent.releaseInstance = function (instance) {
        if (GameEvent._pool.length >= GameEvent._maxPooled)
            return;
        GameEvent._pool.push(instance);
    };
    GameEvent.prototype.init = function (type, data, from) {
        this.type = type;
        this.data = data;
        this.from = from;
    };
    return GameEvent;
}());
GameEvent.types = {
    ui: {
        LEFTMOUSEDOWN: "left mouse down",
        LEFTMOUSEUP: "left mouse up",
        LEFTMOUSECLICK: "left mouse click",
        RIGHTMOUSEDOWN: "right mouse down",
        RIGHTMOUSEUP: "right mouse up",
        RIGHTMOUSECLICK: "right mouse click",
        MOUSEOVER: "mouse over",
        MOUSEOUT: "mouse out",
        FOCUS: "focus",
        UNFOCUS: "unfocus",
        CHANGE: "change",
        KEY: "key",
        TAB: "tab",
        SUBMIT: "submit"
    }
};
GameEvent._pool = [];
GameEvent._maxPooled = 10; //in theory there's only ever one event, unless its handlers spawn more
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GameEvent;

},{}],6:[function(require,module,exports){
"use strict";
var GameEvent_1 = require("./GameEvent");
var GameEventHandler = (function () {
    function GameEventHandler() {
        this._listenersByType = {};
    }
    GameEventHandler.prototype.addEventListener = function (eventType, listener) {
        var listeners = this._listenersByType[eventType];
        if (!listeners) {
            listeners = [];
            this._listenersByType[eventType] = listeners;
        }
        else if (listeners.indexOf(listener) >= 0) {
            console.log("GameEventDispatcher: Not adding duplicate listener of type " + eventType);
            return;
        }
        listeners.push(listener);
    };
    GameEventHandler.prototype.removeEventListener = function (eventType, listener) {
        var listeners = this._listenersByType[eventType];
        if (!listeners) {
            return;
        }
        var index = listeners.indexOf(listener);
        if (index === -1) {
            console.log("GameEventDispatcher: Can't remove listener that doesn't exist, type " + eventType);
        }
        else {
            listeners.splice(index, 1);
        }
    };
    GameEventHandler.prototype.removeAllEventListeners = function () {
        for (var type in this._listenersByType) {
            this._listenersByType[type].splice(0); //clears list
            delete this._listenersByType[type];
        }
    };
    GameEventHandler.prototype.sendNewEvent = function (type, data) {
        if (data === void 0) { data = null; }
        this.sendEvent(GameEvent_1.default.getInstance(type, data, this));
    };
    /**
     * NOTE: the event will be released after this call.
     * Also, does not set the "from" property of the event. Good for propagating.
     */
    GameEventHandler.prototype.sendEvent = function (event) {
        var listeners = this._listenersByType[event.type];
        if (!listeners) {
            return;
        }
        for (var _i = 0, listeners_1 = listeners; _i < listeners_1.length; _i++) {
            var listener = listeners_1[_i];
            listener(event);
        }
        GameEvent_1.default.releaseInstance(event);
    };
    return GameEventHandler;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GameEventHandler;

},{"./GameEvent":5}],7:[function(require,module,exports){
"use strict";
var Vector2D_1 = require("../../common/Vector2D");
var AttachInfo = (function () {
    function AttachInfo(from, to, offset) {
        this.from = from;
        this.to = to;
        this.offset = offset;
    }
    AttachInfo.prototype.clone = function () {
        return new AttachInfo(this.from.clone(), this.to.clone(), this.offset.clone());
    };
    return AttachInfo;
}());
AttachInfo.TLtoTL = new AttachInfo(new Vector2D_1.default(0, 0), new Vector2D_1.default(0, 0), new Vector2D_1.default(0, 0));
AttachInfo.TRtoTR = new AttachInfo(new Vector2D_1.default(1, 0), new Vector2D_1.default(1, 0), new Vector2D_1.default(0, 0));
AttachInfo.BLtoBL = new AttachInfo(new Vector2D_1.default(0, 1), new Vector2D_1.default(0, 1), new Vector2D_1.default(0, 0));
AttachInfo.BRtoBR = new AttachInfo(new Vector2D_1.default(1, 1), new Vector2D_1.default(1, 1), new Vector2D_1.default(0, 0));
AttachInfo.Center = new AttachInfo(new Vector2D_1.default(0.5, 0.5), new Vector2D_1.default(0.5, 0.5), new Vector2D_1.default(0, 0));
AttachInfo.TopCenter = new AttachInfo(new Vector2D_1.default(0.5, 0), new Vector2D_1.default(0.5, 0), new Vector2D_1.default(0, 0));
AttachInfo.BottomCenter = new AttachInfo(new Vector2D_1.default(0.5, 1), new Vector2D_1.default(0.5, 1), new Vector2D_1.default(0, 0));
AttachInfo.RightCenter = new AttachInfo(new Vector2D_1.default(1, 0.5), new Vector2D_1.default(1, 0.5), new Vector2D_1.default(0, 0));
AttachInfo.LeftCenter = new AttachInfo(new Vector2D_1.default(0, 0.5), new Vector2D_1.default(0, 0.5), new Vector2D_1.default(0, 0));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AttachInfo;

},{"../../common/Vector2D":31}],8:[function(require,module,exports){
/// <reference path="../../declarations/pixi.js.d.ts"/>
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var InterfaceElement_1 = require("./InterfaceElement");
var GameEvent_1 = require("../events/GameEvent");
var BaseButton = (function (_super) {
    __extends(BaseButton, _super);
    /**
     * It's a button! Click it!
     * Use the LEFTMOUSECLICK event to listen for clicks.
     * Can't assume it owns its textures, so it doesn't destroy them. Don't use this class directly.
     */
    function BaseButton(normalTex, highlightTex, disabledTex) {
        var _this = _super.call(this) || this;
        _this.onMouseOver = function (e) {
            if (_this.enabled) {
                _this.setHighlight();
            }
        };
        _this.onMouseOut = function (e) {
            if (_this.enabled) {
                _this.setNormal();
            }
        };
        _this.onLeftMouseClick = function (e) {
            //TODO: sound?
        };
        _this._className = "BaseButton";
        _this._debugColor = 0xff66ff;
        _this.clickable = true;
        _this._state = BaseButton.STATE_NORMAL;
        _this._normalTex = normalTex;
        _this._highlightTex = highlightTex;
        _this._disabledTex = disabledTex;
        _this._sprite = new PIXI.Sprite(_this._normalTex);
        _this._displayObject.addChild(_this._sprite);
        _this.resize(_this._sprite.width, _this._sprite.height);
        _this.addEventListeners();
        return _this;
    }
    Object.defineProperty(BaseButton.prototype, "enabled", {
        get: function () {
            return this._state != BaseButton.STATE_DISABLED;
        },
        set: function (enabled) {
            if (enabled) {
                this.setNormal();
            }
            else {
                this.setDisabled();
            }
        },
        enumerable: true,
        configurable: true
    });
    BaseButton.prototype.addEventListeners = function () {
        this.addEventListener(GameEvent_1.default.types.ui.MOUSEOVER, this.onMouseOver);
        this.addEventListener(GameEvent_1.default.types.ui.MOUSEOUT, this.onMouseOut);
        this.addEventListener(GameEvent_1.default.types.ui.LEFTMOUSECLICK, this.onLeftMouseClick);
    };
    BaseButton.prototype.removeEventListeners = function () {
        this.removeEventListener(GameEvent_1.default.types.ui.MOUSEOVER, this.onMouseOver);
        this.removeEventListener(GameEvent_1.default.types.ui.MOUSEOUT, this.onMouseOut);
        this.removeEventListener(GameEvent_1.default.types.ui.LEFTMOUSECLICK, this.onLeftMouseClick);
    };
    BaseButton.prototype.setNormal = function () {
        this._state = BaseButton.STATE_NORMAL;
        this._sprite.texture = this._normalTex;
    };
    BaseButton.prototype.setHighlight = function () {
        this._state = BaseButton.STATE_HIGHLIGHT;
        this._sprite.texture = this._highlightTex;
    };
    BaseButton.prototype.setDisabled = function () {
        this._state = BaseButton.STATE_DISABLED;
        this._sprite.texture = this._disabledTex;
    };
    return BaseButton;
}(InterfaceElement_1.default));
BaseButton.STATE_NORMAL = 1;
BaseButton.STATE_HIGHLIGHT = 2;
BaseButton.STATE_DISABLED = 3;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BaseButton;

},{"../events/GameEvent":5,"./InterfaceElement":11}],9:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="../../declarations/pixi.js.d.ts"/>
var InterfaceElement_1 = require("./InterfaceElement");
var ElementList = (function (_super) {
    __extends(ElementList, _super);
    function ElementList(width, orientation, padding, align) {
        if (orientation === void 0) { orientation = ElementList.VERTICAL; }
        if (padding === void 0) { padding = 5; }
        if (align === void 0) { align = ElementList.LEFT; }
        var _this = _super.call(this) || this;
        _this._childBounds = [];
        _this._childPadding = [];
        _this._debugColor = 0xffff00;
        _this._orientation = orientation;
        _this._padding = padding;
        _this._alignment = align;
        _this._className = "ElementList";
        if (orientation == ElementList.VERTICAL) {
            _this._width = width;
        }
        else {
            _this._height = width;
        }
        return _this;
    }
    ElementList.prototype.addChild = function (child, extraPadding, redoLayout) {
        if (extraPadding === void 0) { extraPadding = 0; }
        if (redoLayout === void 0) { redoLayout = true; }
        _super.prototype.addChild.call(this, child);
        this._childBounds.push(0);
        this._childPadding.push(this._padding + extraPadding);
        if (redoLayout) {
            this.redoLayout(child);
        }
    };
    ElementList.prototype.addChildAt = function (child, index, extraPadding, redoLayout) {
        if (extraPadding === void 0) { extraPadding = 0; }
        if (redoLayout === void 0) { redoLayout = true; }
        _super.prototype.addChildAt.call(this, child, index);
        this._childBounds.push(0);
        this._childPadding.splice(index, 0, extraPadding);
        if (redoLayout) {
            this.redoLayout(child);
        }
    };
    ElementList.prototype.removeChild = function (child) {
        var index = this._children.indexOf(child);
        _super.prototype.removeChild.call(this, child);
        if (index != -1 && index < this._children.length) {
            this._childBounds.pop();
            this.redoLayout(this._children[index]);
        }
    };
    ElementList.prototype.redoLayout = function (fromChild) {
        if (fromChild === void 0) { fromChild = null; }
        var index = -1;
        if (fromChild == null && this._children.length > 0) {
            index = 0;
        }
        else if (fromChild != null) {
            index = this._children.indexOf(fromChild);
        }
        if (index == -1)
            return;
        var offset = 0;
        var child;
        if (index > 0)
            offset = this._childBounds[index - 1];
        for (; index < this._children.length; index++) {
            child = this._children[index];
            if (this._orientation == ElementList.VERTICAL) {
                child.y = offset;
                offset += child.height + this._childPadding[index];
                switch (this._alignment) {
                    case ElementList.LEFT:
                        child.x = 0;
                        break;
                    case ElementList.RIGHT:
                        child.x = this.width - child.width;
                        break;
                    case ElementList.CENTRE:
                        child.x = (this.width - child.width) / 2;
                        break;
                }
            }
            else {
                child.x = offset;
                offset += child.width + this._childPadding[index];
                switch (this._alignment) {
                    case ElementList.TOP:
                        child.y = 0;
                        break;
                    case ElementList.BOTTOM:
                        child.y = this.height - child.height;
                        break;
                    case ElementList.CENTRE:
                        child.y = (this.height - child.height) / 2;
                        break;
                }
            }
            this._childBounds[index] = offset;
        }
        var length = 0;
        if (this._children.length > 0) {
            var startElement = this._children[0];
            var endElement = this._children[this._children.length - 1];
            if (this._orientation == ElementList.VERTICAL) {
                length = (endElement.y + endElement.height) - startElement.y;
            }
            else {
                length = (endElement.x + endElement.width) - startElement.x;
            }
        }
        if (this._orientation == ElementList.VERTICAL) {
            this._height = length;
        }
        else {
            this._width = length;
        }
        this.onResize(false); //don't tell children that this has resized
    };
    return ElementList;
}(InterfaceElement_1.default));
ElementList.HORIZONTAL = 0;
ElementList.VERTICAL = 1;
ElementList.NONE = -1;
ElementList.LEFT = 0;
ElementList.TOP = ElementList.LEFT;
ElementList.RIGHT = 1;
ElementList.BOTTOM = ElementList.RIGHT;
ElementList.CENTRE = 2;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ElementList;

},{"./InterfaceElement":11}],10:[function(require,module,exports){
"use strict";
/// <reference path="../../declarations/jquery.d.ts"/>
var Vector2D_1 = require("../../common/Vector2D");
var Game_1 = require("../Game");
var GameEvent_1 = require("../events/GameEvent");
/**
 * Wrangles all them silly events and suchlike.
 * Doing anything in the game proper should be relegated to a different class (probably?)
 *
 * Singleton!
 */
var InputManager = (function () {
    function InputManager() {
        var _this = this;
        this.dragThreshold = 8;
        this._initialized = false;
        this._mouseCoords = new Vector2D_1.default(0, 0);
        this._leftMouseDownCoords = null;
        this._leftMouseDownElement = null;
        this._hoverElement = null;
        this._focusElement = null;
        this._trackedKeys = {
            "SHIFT": false,
            "CTRL": false,
            "ALT": false,
            "UP": false,
            "DOWN": false,
            "LEFT": false,
            "RIGHT": false
        };
        this._onMouseDown = function (e) {
            var coords = _this.getMouseCoords(e, true);
            var element = Game_1.default.instance.interfaceRoot.getElementAtPoint(coords);
            switch (e.which) {
                case 1:
                    //left
                    _this._leftMouseDownCoords = coords;
                    _this._leftMouseDownElement = element;
                    if (element) {
                        _this.focus(element);
                        //if (element.onMouseDown) element.onMouseDown(coords);
                        element.sendNewEvent(GameEvent_1.default.types.ui.LEFTMOUSEDOWN);
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
        };
        this._onMouseUp = function (e) {
            var coords = _this.getMouseCoords(e, true);
            var element = Game_1.default.instance.interfaceRoot.getElementAtPoint(coords);
            switch (e.which) {
                case 1:
                    //left
                    if (element) {
                        /*if (element.onMouseUp) element.onMouseUp(coords);
                        if (element.onClick && element == this._leftMouseDownElement) element.onClick(coords);*/
                        element.sendNewEvent(GameEvent_1.default.types.ui.LEFTMOUSEUP);
                        if (element == _this._leftMouseDownElement)
                            element.sendNewEvent(GameEvent_1.default.types.ui.LEFTMOUSECLICK);
                    }
                    _this._leftMouseDownCoords = null;
                    _this._leftMouseDownElement = null;
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
        };
        this._onMouseMove = function (e) {
            var coords = _this.getMouseCoords(e, true);
            var element = Game_1.default.instance.interfaceRoot.getElementAtPoint(coords);
            if (_this.leftMouseDown && coords.distanceTo(_this._leftMouseDownCoords) > _this.dragThreshold)
                _this.beginDrag();
            //TODO: check whether we're about to drag it?
            if (_this._hoverElement != element) {
                if (element) {
                    element.sendNewEvent(GameEvent_1.default.types.ui.MOUSEOVER);
                }
                if (_this._hoverElement) {
                    _this._hoverElement.sendNewEvent(GameEvent_1.default.types.ui.MOUSEOUT);
                }
            }
            //TODO: update dragged element
            _this._hoverElement = element;
        };
        this._onMouseScroll = function (e) {
        };
        this._onMouseLeave = function (e) {
            _this._leftMouseDownCoords = null;
            _this._leftMouseDownElement = null;
        };
        this._onKeyDown = function (e) {
            var key = _this.getKeyString(e);
            if (_this._focusElement) {
                //this._focusElement.sendNewEvent(GameEvent.types.ui.KEY, key);
                if (key.length > 1)
                    _this._focusElement.sendNewEvent(GameEvent_1.default.types.ui.KEY, key);
            }
            if (_this._trackedKeys.hasOwnProperty(key)) {
                _this._trackedKeys[key] = true;
            }
            if (preventedKeys.indexOf(e.which) != -1) {
                e.preventDefault();
            }
        };
        this._onKeyUp = function (e) {
            var key = _this.getKeyString(e);
            if (_this._trackedKeys.hasOwnProperty(key)) {
                _this._trackedKeys[key] = false;
            }
        };
        this._onKeyPress = function (e) {
            if (_this._focusElement) {
                _this._focusElement.sendNewEvent(GameEvent_1.default.types.ui.KEY, e.key);
            }
            if (preventedKeys.indexOf(e.which) != -1) {
                e.preventDefault();
            }
        };
        if (InputManager._instance) {
            console.error("InputManager: hey, this is a singleton!");
        }
    }
    Object.defineProperty(InputManager, "instance", {
        get: function () {
            if (InputManager._instance)
                return InputManager._instance;
            InputManager._instance = new InputManager();
            return InputManager._instance;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InputManager.prototype, "leftMouseDown", {
        get: function () { return this._leftMouseDownCoords != null; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InputManager.prototype, "focusedElement", {
        get: function () { return this._focusElement; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InputManager.prototype, "mouseCoords", {
        get: function () { return this._mouseCoords; },
        enumerable: true,
        configurable: true
    });
    InputManager.prototype.init = function (selector) {
        if (this._initialized)
            return;
        this._initialized = true;
        this._div = $(selector);
        if (!this._div) {
            console.error("InputManager: no element found!");
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
        this._div.contextmenu(function (e) {
            e.stopPropagation();
            return false;
        });
    };
    InputManager.prototype.focus = function (element) {
        if (element != this._focusElement) {
            if (this._focusElement) {
                this._focusElement.sendNewEvent(GameEvent_1.default.types.ui.UNFOCUS);
            }
            this._focusElement = element;
            if (element) {
                console.log("InputManager: Focus " + element.fullName);
                element.sendNewEvent(GameEvent_1.default.types.ui.FOCUS);
            }
            else {
                console.log("InputManager: No element focused");
            }
        }
    };
    InputManager.prototype.isKeyDown = function (key) {
        if (this._trackedKeys.hasOwnProperty(key) && this._trackedKeys[key])
            return true;
        return false;
    };
    InputManager.prototype.beginDrag = function () {
    };
    InputManager.prototype.getKeyString = function (e) {
        var name = keyNames[e.which.toString()];
        if (name)
            return name;
        return String.fromCharCode(e.which);
    };
    InputManager.prototype.getMouseCoords = function (e, set) {
        if (set === void 0) { set = false; }
        var offset = this._div.offset();
        var coords = new Vector2D_1.default(e.pageX - offset.left, e.pageY - offset.top);
        if (set)
            this._mouseCoords = coords;
        return coords;
    };
    return InputManager;
}());
InputManager._instance = null;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InputManager;
var preventedKeys = [8, 9, 13, 16, 17, 18, 37, 38, 39, 40];
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
};

},{"../../common/Vector2D":31,"../Game":2,"../events/GameEvent":5}],11:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="../../declarations/pixi.js.d.ts"/>
var Vector2D_1 = require("../../common/Vector2D");
var InputManager_1 = require("./InputManager");
var Game_1 = require("../Game");
var GameEventHandler_1 = require("../events/GameEventHandler");
var InterfaceElement = (function (_super) {
    __extends(InterfaceElement, _super);
    /**
     * Base class for anything in the UI. Has a parent and can have children, like DOM elements.
     * Wraps a PIXI DisplayObjectContainer
     */
    function InterfaceElement() {
        var _this = _super.call(this) || this;
        _this.id = "";
        _this.name = "";
        _this.clickable = false;
        _this.draggable = false;
        _this.useOwnBounds = true; //instead of the container's bounds, use the rect defined by own x,y,width,height
        _this.ignoreChildrenForClick = false; //don't click the kids, click me
        _this.dragElement = null;
        /*public onMouseDown:(coords:Vector2D)=>void;
        public onMouseUp:(coords:Vector2D)=>void;
        public onClick:(coords:Vector2D)=>void;
        public onHoverStart:(coords:Vector2D)=>void;
        public onHoverEnd:(coords:Vector2D)=>void;
        public onFocus:()=>void;
        public onUnfocus:()=>void;
        public onChange:()=>void;
        public onKeyDown:(which:string)=>void;
        public onKeyUp:(which:string)=>void;
        public onKeyPress:(which:string)=>void; //See jQuery documentation for how these differ*/
        _this._displayObject = new PIXI.Container();
        _this._parent = null;
        _this._children = [];
        _this._position = new Vector2D_1.default(0, 0);
        _this._width = 0;
        _this._height = 0;
        _this._attach = null;
        _this._resize = null;
        _this._className = "InterfaceElement";
        _this._debugColor = 0x0000ff;
        return _this;
    }
    Object.defineProperty(InterfaceElement.prototype, "x", {
        // === GET ===
        get: function () { return this._position.x; },
        set: function (x) { this._position.x = x; this.updateDisplayObjectPosition(); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InterfaceElement.prototype, "y", {
        get: function () { return this._position.y; },
        set: function (y) { this._position.y = y; this.updateDisplayObjectPosition(); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InterfaceElement.prototype, "position", {
        get: function () { return this._position; },
        //=== SET ===
        set: function (pos) { this._position.set(pos); this.updateDisplayObjectPosition(); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InterfaceElement.prototype, "width", {
        get: function () { return this._width; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InterfaceElement.prototype, "height", {
        get: function () { return this._height; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InterfaceElement.prototype, "displayObject", {
        get: function () { return this._displayObject; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InterfaceElement.prototype, "children", {
        get: function () { return this._children.slice(); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InterfaceElement.prototype, "fullName", {
        get: function () {
            var s = this._className;
            if (this.id != "")
                s += " #" + this.id;
            if (this.name != "")
                s += " \"" + this.name + "\"";
            if (this.draggable)
                s += " (draggable)";
            if (!this.clickable)
                s += " (not clickable)";
            return s;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InterfaceElement.prototype, "isRoot", {
        get: function () { return this._parent == null && this._displayObject.parent != null; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InterfaceElement.prototype, "isFocused", {
        get: function () { return InputManager_1.default.instance.focusedElement == this; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InterfaceElement.prototype, "visible", {
        get: function () { return this._displayObject.visible; },
        set: function (v) { this._displayObject.visible = v; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InterfaceElement.prototype, "maskSprite", {
        set: function (m) { this._displayObject.mask = m; },
        enumerable: true,
        configurable: true
    });
    InterfaceElement.prototype.getElementAtPoint = function (point) {
        var element = null;
        var checkChildren = this.isRoot;
        if (!checkChildren) {
            var bounds;
            if (this.useOwnBounds) {
                //note: this assumes that children are all within the bounds of this object
                var pos = this.getGlobalPosition();
                bounds = new PIXI.Rectangle(pos.x, pos.y, this._width, this._height);
            }
            else {
                bounds = this._displayObject.getBounds();
            }
            checkChildren = bounds.contains(point.x, point.y);
            if (checkChildren && this.ignoreChildrenForClick) {
                return this;
            }
        }
        if (checkChildren) {
            //Work backwards. Most recently added children are on top.
            for (var i = this._children.length - 1; i >= 0; i--) {
                element = this._children[i].getElementAtPoint(point);
                if (element != null) {
                    break;
                }
            }
            if (element == null && this.clickable) {
                element = this;
            }
        }
        return element;
    };
    InterfaceElement.prototype.getElementById = function (id, maxChecks) {
        if (maxChecks === void 0) { maxChecks = 1000; }
        if (this.id == id)
            return this;
        return this.getElementByFunction(function (e) {
            return e.id == id;
        });
    };
    InterfaceElement.prototype.getElement = function (e) {
        if (this == e)
            return this; //derp
        return this.getElementByFunction(function (e2) {
            return e2 == e;
        });
    };
    //BFS, always call from the lowest known ancestor
    //Hey kid, don't make cyclical structures. I'm putting maxChecks here anyway, just in case.
    InterfaceElement.prototype.getElementByFunction = function (func, maxChecks) {
        if (maxChecks === void 0) { maxChecks = 500; }
        if (func(this))
            return this;
        var toCheck = [this];
        var element;
        var child;
        var len;
        var i;
        while (toCheck.length > 0 && maxChecks > 0) {
            element = toCheck.shift();
            len = element._children.length;
            for (i = 0; i < len; i++) {
                child = element._children[i];
                if (func(child))
                    return child;
                toCheck.push(child);
            }
            maxChecks -= 1;
        }
        if (maxChecks <= 400)
            console.warn("Wasting cycles on InterfaceElement.getElementById");
        else if (maxChecks == 0)
            console.warn("Wasting LOTS of cycles on InterfaceElement.getElementById");
        return null;
    };
    InterfaceElement.prototype.draw = function () {
        if (this.isRoot)
            InterfaceElement.drawTime = Date.now();
        if (!this.visible)
            return; //this could cause problems?
        var len = this._children.length;
        for (var i = 0; i < len; i++) {
            this._children[i].draw();
        }
        if (Game_1.default.useDebugGraphics) {
            var global = this.getGlobalPosition();
            Game_1.default.instance.debugGraphics.lineStyle(1, this._debugColor, 1);
            Game_1.default.instance.debugGraphics.drawRect(global.x, global.y, this._width, this._height);
        }
    };
    InterfaceElement.prototype.resize = function (width, height) {
        this._width = width;
        this._height = height;
        this.onResize();
    };
    InterfaceElement.prototype.resizeToFitChildren = function () {
        var w = 0;
        var h = 0;
        for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (child.width > w)
                w = child.width;
            if (child.height > h)
                h = child.height;
        }
        this.resize(w, h);
    };
    //Used by Game to add the root element, shouldn't be used elsewhere
    InterfaceElement.prototype.addToContainer = function (container) {
        container.addChild(this._displayObject);
    };
    InterfaceElement.prototype.addChild = function (child) {
        this._children.push(child);
        this._displayObject.addChild(child._displayObject);
        child._parent = this;
        child.onAdd();
    };
    InterfaceElement.prototype.addChildAt = function (child, index) {
        if (index === void 0) { index = -1; }
        if (index < 0 || index > this._children.length) {
            this.addChild(child);
            return;
        }
        this._children.splice(index, 0, child);
        this._displayObject.addChildAt(child._displayObject, index);
        child.onAdd();
    };
    /**
     * Subclasses should use this to add listeners if needed
     */
    InterfaceElement.prototype.onAdd = function () {
    };
    /**
     * Subclasses should use this to remove their listeners.
     */
    InterfaceElement.prototype.onRemove = function (fromParent) {
    };
    /**
     * Necessary for cleaning up WebGL memory. If this element isn't going to be used anymore, call this.
     * Called recursively on chldren.
     */
    InterfaceElement.prototype.destroy = function () {
        for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
            var child = _a[_i];
            child.destroy();
        }
        if (this._parent) {
            this.removeSelf(false); //no need to recurse from there, since this already does so
        }
        //base class has no PIXI stuff to destroy (right?)
    };
    InterfaceElement.prototype.removeChild = function (child, recurse) {
        if (recurse === void 0) { recurse = false; }
        var index = this._children.indexOf(child);
        if (index === -1)
            return;
        this._children.splice(index, 1);
        this._displayObject.removeChild(child._displayObject);
        child._parent = null;
        child.detachFromParent();
        child.disableResizeToParent();
        if (recurse) {
            while (child._children.length > 0) {
                child.removeChild(child._children[child._children.length - 1], true);
            }
        }
        child.onRemove(this);
    };
    InterfaceElement.prototype.removeSelf = function (recurse) {
        if (recurse === void 0) { recurse = true; }
        if (this._parent != null)
            this._parent.removeChild(this, recurse);
    };
    InterfaceElement.prototype.moveChildToTop = function (child) {
        this.removeChild(child);
        this.addChild(child);
    };
    InterfaceElement.prototype.attachToParent = function (info) {
        this._attach = info;
        this.positionRelativeTo(this._parent, info);
    };
    InterfaceElement.prototype.detachFromParent = function () {
        this._attach = null;
    };
    InterfaceElement.prototype.resizeToParent = function (info) {
        this._resize = info;
        this.onParentResize();
    };
    InterfaceElement.prototype.disableResizeToParent = function () {
        this._resize = null;
    };
    InterfaceElement.prototype.positionRelativeTo = function (other, info) {
        this._position.x = (other._width * info.to.x) - (this.width * info.from.x) + info.offset.x;
        this._position.y = (other._height * info.to.y) - (this.height * info.from.y) + info.offset.y;
        if (other != this._parent && other._parent != this._parent) {
            //need to account for different contexts
            var thisGlobal = this.getGlobalPosition();
            var otherGlobal = other.getGlobalPosition();
            thisGlobal.sub(this._position);
            otherGlobal.sub(other._position);
            //add the difference in base global position
            var globalDiff = otherGlobal;
            globalDiff.sub(thisGlobal);
            this._position.add(globalDiff);
        }
        //console.log(this.fullName + " position with " + JSON.stringify(info) + ": " + JSON.stringify(this._position));
        this.position = this._position;
    };
    InterfaceElement.prototype.setAttachOffset = function (x, y) {
        if (!this._attach)
            return;
        this._attach.offset.x = x;
        this._attach.offset.y = y;
        this.onParentResize(); //cheaty? or just a naming problem
    };
    InterfaceElement.prototype.clearMask = function () {
        this._displayObject.mask = null;
    };
    InterfaceElement.prototype.getGlobalPosition = function () {
        var pos = this._position.clone();
        var parent = this._parent;
        while (parent != null) {
            pos.add(parent._position);
            parent = parent._parent;
        }
        return pos;
    };
    InterfaceElement.prototype.updateDisplayObjectPosition = function () {
        this._displayObject.position.set(Math.round(this._position.x), Math.round(this._position.y));
    };
    InterfaceElement.prototype.toNearestPixel = function () {
        this._position.round();
        this.updateDisplayObjectPosition();
    };
    InterfaceElement.prototype.onParentResize = function () {
        if (this._resize) {
            var width = this._width;
            var height = this._height;
            if (this._resize.fill.x > 0)
                width = this._parent._width * this._resize.fill.x - this._resize.padding.x * 2;
            if (this._resize.fill.y > 0)
                height = this._parent._height * this._resize.fill.y - this._resize.padding.y * 2;
            this.resize(width, height);
        }
        else if (this._attach) {
            this.positionRelativeTo(this._parent, this._attach);
        }
    };
    InterfaceElement.prototype.onResize = function (notifyChildren) {
        if (notifyChildren === void 0) { notifyChildren = true; }
        if (this._attach)
            this.positionRelativeTo(this._parent, this._attach);
        if (notifyChildren) {
            var len = this._children.length;
            for (var i = 0; i < len; i++) {
                this._children[i].onParentResize();
            }
        }
    };
    return InterfaceElement;
}(GameEventHandler_1.default));
InterfaceElement.maskTexture = null; //8x8
/**
 * Updated every frame by the root UI element.
 */
InterfaceElement.drawTime = 0;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InterfaceElement;

},{"../../common/Vector2D":31,"../Game":2,"../events/GameEventHandler":6,"./InputManager":10}],12:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var InterfaceElement_1 = require("./InterfaceElement");
var MaskElement = (function (_super) {
    __extends(MaskElement, _super);
    function MaskElement(width, height) {
        var _this = _super.call(this) || this;
        _this._debugColor = 0x00ff00;
        //this.visible = false;
        _this._maskSprite = new PIXI.Sprite(InterfaceElement_1.default.maskTexture);
        _this._displayObject.scale.x = width / 8;
        _this._displayObject.scale.y = height / 8;
        _this._displayObject.addChild(_this._maskSprite);
        _this.resize(width, height);
        return _this;
    }
    MaskElement.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this._maskSprite.destroy(false);
    };
    MaskElement.prototype.setAsMask = function (element) {
        element.maskSprite = this._maskSprite;
    };
    return MaskElement;
}(InterfaceElement_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MaskElement;

},{"./InterfaceElement":11}],13:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="../../declarations/pixi.js.d.ts"/>
var InterfaceElement_1 = require("./InterfaceElement");
//import TextureGenerator = require('../textures/TextureGenerator');
var TextureGenerator = require("../textures/TextureGenerator");
var Panel = (function (_super) {
    __extends(Panel, _super);
    function Panel(width, height, style) {
        var _this = _super.call(this) || this;
        _this._debugColor = 0x00ff00;
        _this._needRedraw = true;
        _this._className = "Panel";
        _this._width = width;
        _this._height = height;
        _this._style = style;
        _this._texture = null;
        _this.clickable = true;
        _this.draw();
        _this._sprite = new PIXI.Sprite(_this._texture);
        _this._displayObject.addChild(_this._sprite);
        return _this;
    }
    Panel.prototype.resize = function (width, height) {
        if (width != this._width || height != this._height)
            this._needRedraw = true;
        _super.prototype.resize.call(this, width, height);
    };
    Panel.prototype.draw = function () {
        _super.prototype.draw.call(this);
        if (this._needRedraw) {
            this._needRedraw = false;
            var hadTexture = false;
            if (this._texture) {
                hadTexture = true;
                this._texture.resize(this._width, this._height, true);
            }
            //style check!
            switch (this._style) {
                case Panel.HEADER:
                    this._texture = TextureGenerator.simpleRectangle(this._texture, this._width, this._height, 0x616161);
                    break;
                case Panel.FIELD:
                    this._texture = TextureGenerator.simpleRectangle(this._texture, this._width, this._height, 0x121212, 2, 0x616161);
                    break;
                default:
                    this._texture = TextureGenerator.simpleRectangle(this._texture, this._width, this._height, 0x2b2b2b, 2, 0x616161);
            }
        }
    };
    Panel.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this._sprite.destroy(true);
    };
    return Panel;
}(InterfaceElement_1.default));
Panel.BASIC = 0;
Panel.HEADER = 1;
Panel.FIELD = 2;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Panel;

},{"../textures/TextureGenerator":23,"./InterfaceElement":11}],14:[function(require,module,exports){
/// <reference path="../../declarations/pixi.js.d.ts"/>
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BaseButton_1 = require("./BaseButton");
var AssetCache_1 = require("../../common/AssetCache");
var TextElement_1 = require("./TextElement");
var AttachInfo_1 = require("./AttachInfo");
var TextureGenerator = require("../textures/TextureGenerator");
var TextButton = (function (_super) {
    __extends(TextButton, _super);
    function TextButton(text, colorScheme, width, height, textStyle) {
        if (colorScheme === void 0) { colorScheme = null; }
        if (width === void 0) { width = 100; }
        if (height === void 0) { height = 30; }
        if (textStyle === void 0) { textStyle = null; }
        var _this = this;
        if (!colorScheme)
            colorScheme = TextButton.colorSchemes.blue;
        if (!textStyle)
            textStyle = TextElement_1.default.basicText;
        _this = _super.call(this, TextButton.getOrCreateBg(width, height, colorScheme.normal), TextButton.getOrCreateBg(width, height, colorScheme.highlight), TextButton.getOrCreateBg(width, height, colorScheme.disabled)) || this;
        _this._className = "TextButton";
        _this._textElement = new TextElement_1.default(text, textStyle);
        _this.addChild(_this._textElement);
        _this._textElement.attachToParent(AttachInfo_1.default.Center);
        return _this;
    }
    //Generates a key and checks the texture cache before creating. Inserts if created.
    TextButton.getOrCreateBg = function (width, height, scheme) {
        var key = JSON.stringify(scheme) + width + 'x' + height;
        var tex = TextButton._bgCache.get(key);
        if (!tex) {
            tex = TextureGenerator.simpleRectangle(null, width, height, scheme.bg, 2, scheme.border);
            TextButton._bgCache.set(key, tex);
        }
        return tex;
    };
    Object.defineProperty(TextButton.prototype, "text", {
        get: function () { return this._textElement.text; },
        set: function (s) {
            this._textElement.text = s;
        },
        enumerable: true,
        configurable: true
    });
    return TextButton;
}(BaseButton_1.default));
//note: use the gems in oryx 16 bit items
TextButton.colorSchemes = {
    green: {
        normal: { bg: 0x00852c, border: 0x00ba3e },
        highlight: { bg: 0x00ba3e, border: 0x00ea4e },
        disabled: { bg: 0x2b2b2b, border: 0x616161 }
    },
    red: {
        normal: { bg: 0x910c0c, border: 0xca1010 },
        highlight: { bg: 0xca1010, border: 0xff1414 },
        disabled: { bg: 0x2b2b2b, border: 0x616161 }
    },
    blue: {
        normal: { bg: 0x0c5991, border: 0x107cca },
        highlight: { bg: 0x107cca, border: 0x149dff },
        disabled: { bg: 0x2b2b2b, border: 0x616161 }
    }
};
//Caches background textures. When discarded, call destroy on them.
TextButton._bgCache = new AssetCache_1.default(10, function (deleted) {
    deleted.destroy(true);
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextButton;

},{"../../common/AssetCache":28,"../textures/TextureGenerator":23,"./AttachInfo":7,"./BaseButton":8,"./TextElement":15}],15:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="../../declarations/pixi.js.d.ts"/>
var InterfaceElement_1 = require("./InterfaceElement");
var TextElement = (function (_super) {
    __extends(TextElement, _super);
    function TextElement(text, style) {
        if (text === void 0) { text = ""; }
        if (style === void 0) { style = TextElement.basicText; }
        var _this = _super.call(this) || this;
        _this._debugColor = 0xff0000;
        _this._className = "TextElement";
        _this._text = text;
        _this._pixiText = new PIXI.Text(text, style);
        _this._displayObject.addChild(_this._pixiText);
        _this.resizeToPixiText();
        return _this;
    }
    Object.defineProperty(TextElement.prototype, "text", {
        get: function () { return this._text; },
        set: function (text) {
            this._text = text;
            this.setPixiText();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TextElement.prototype, "style", {
        set: function (style) {
            this._pixiText.style = style;
            this.resizeToPixiText();
        },
        enumerable: true,
        configurable: true
    });
    TextElement.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this._pixiText.destroy(true);
    };
    /**
     * Expensive! Sets the PIXI text twice. Assumes single line.
     * (does this work? does it need a draw frame? time will tell)
     */
    TextElement.prototype.getWidthAtCharacterIndex = function (i) {
        if (i >= this._text.length)
            return -1; //dummy
        this._pixiText.text = this._text.substr(0, i + 1);
        var w = this._pixiText.width;
        this._pixiText.text = this._text;
        return w;
    };
    TextElement.prototype.setPixiText = function () {
        this._pixiText.text = this._text;
        this.resizeToPixiText();
    };
    TextElement.prototype.resizeToPixiText = function () {
        var width = (this._text.length > 0) ? this._pixiText.width : 0;
        this.resize(width, this._pixiText.height);
    };
    return TextElement;
}(InterfaceElement_1.default));
//Open Sans
TextElement.basicText = new PIXI.TextStyle({ fontSize: 14, fontFamily: 'Verdana', fill: 0xffffff, align: 'left' });
TextElement.bigText = new PIXI.TextStyle({ fontSize: 32, fontFamily: 'Verdana', fill: 0xffffff, align: 'left' });
TextElement.veryBigText = new PIXI.TextStyle({ fontSize: 48, fontFamily: 'Verdana', fill: 0xffffff, align: 'left' });
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextElement;

},{"./InterfaceElement":11}],16:[function(require,module,exports){
/// <reference path="../../declarations/pixi.js.d.ts"/>
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Vector2D_1 = require("../../common/Vector2D");
var InterfaceElement_1 = require("./InterfaceElement");
var Panel_1 = require("./Panel");
var TextElement_1 = require("./TextElement");
var MaskElement_1 = require("./MaskElement");
var AttachInfo_1 = require("./AttachInfo");
var GameEvent_1 = require("../events/GameEvent");
var TextField = (function (_super) {
    __extends(TextField, _super);
    /**
     * Allows the user to input text.
     * @param alphabet	Constrains input characters
     * @param validator	Checks validity of the whole string
     */
    function TextField(width, height, textStyle, alphabet, validator) {
        if (alphabet === void 0) { alphabet = null; }
        if (validator === void 0) { validator = null; }
        var _this = _super.call(this) || this;
        _this._text = "";
        _this._blinkTime = -1;
        _this._hidden = false;
        _this._borderPadding = 4;
        _this.onFocus = function (e) {
            _this._cursor.visible = true;
            _this._blinkTime = InterfaceElement_1.default.drawTime;
        };
        _this.onUnfocus = function (e) {
            _this._cursor.visible = false;
        };
        _this.onKey = function (e) {
            var key = e.data;
            if (key == "BACKSPACE") {
                _this.deleteCharacter();
            }
            else if (key == "TAB") {
                _this.sendNewEvent(GameEvent_1.default.types.ui.TAB);
            }
            else if (key == "ENTER") {
                _this.sendNewEvent(GameEvent_1.default.types.ui.SUBMIT);
            }
            else if ((_this._alphabet && !_this._alphabet.test(key)) || key.length > 1) {
                console.log("TextField: ignoring character '" + key + "'");
                return;
            }
            else {
                _this.addCharacter(key);
            }
        };
        _this._className = "TextField";
        _this.resize(width, height);
        _this._alphabet = alphabet;
        _this._validator = validator;
        _this.ignoreChildrenForClick = true;
        _this._bg = new Panel_1.default(width, height, Panel_1.default.FIELD);
        _this._textElement = new TextElement_1.default("", textStyle);
        _this.addChild(_this._bg);
        _this._bg.addChild(_this._textElement);
        //Offset the text slightly to allow for the border (Panel needs some improvement)
        var textAttach = AttachInfo_1.default.LeftCenter.clone();
        textAttach.offset.x = _this._borderPadding;
        _this._textElement.attachToParent(textAttach);
        //Attach the cursor to the right of the text
        _this._cursor = new TextElement_1.default("|", textStyle);
        _this._textElement.addChild(_this._cursor);
        textAttach = new AttachInfo_1.default(new Vector2D_1.default(0, 0.5), new Vector2D_1.default(1, 0.5), new Vector2D_1.default(-2, 0));
        _this._cursor.attachToParent(textAttach);
        _this._cursor.visible = false;
        //Make a mask, centred on the Panel
        _this._mask = new MaskElement_1.default(width - _this._borderPadding * 2, height - _this._borderPadding * 2);
        _this._bg.addChild(_this._mask);
        _this._mask.attachToParent(AttachInfo_1.default.Center);
        _this._mask.setAsMask(_this._textElement);
        _this._mask.setAsMask(_this._cursor);
        return _this;
    }
    Object.defineProperty(TextField.prototype, "hidden", {
        get: function () { return this._hidden; },
        set: function (val) { this._hidden = val; this.updateText(); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TextField.prototype, "text", {
        get: function () {
            return this._text;
        },
        set: function (text) {
            this._text = text;
            this.updateText();
        },
        enumerable: true,
        configurable: true
    });
    TextField.prototype.draw = function () {
        _super.prototype.draw.call(this);
        if (!this.visible)
            return;
        if (this.isFocused) {
            if (InterfaceElement_1.default.drawTime - this._blinkTime >= TextField.BLINK_INTERVAL) {
                if (this._cursor.visible) {
                    this._cursor.visible = false;
                }
                else {
                    this._cursor.visible = true;
                }
                this._blinkTime = InterfaceElement_1.default.drawTime;
            }
        }
    };
    TextField.prototype.onAdd = function () {
        this.addEventListener(GameEvent_1.default.types.ui.FOCUS, this.onFocus);
        this.addEventListener(GameEvent_1.default.types.ui.UNFOCUS, this.onUnfocus);
        this.addEventListener(GameEvent_1.default.types.ui.KEY, this.onKey);
    };
    TextField.prototype.onRemove = function (fromParent) {
        this.removeEventListener(GameEvent_1.default.types.ui.FOCUS, this.onFocus);
        this.removeEventListener(GameEvent_1.default.types.ui.UNFOCUS, this.onUnfocus);
        this.removeEventListener(GameEvent_1.default.types.ui.KEY, this.onKey);
    };
    TextField.prototype.addCharacter = function (char) {
        this._text += char;
        this.updateText();
        this.resetCursorBlink();
    };
    TextField.prototype.deleteCharacter = function () {
        if (this._text.length > 0) {
            this._text = this._text.substr(0, this._text.length - 1);
            this.updateText();
        }
        this.resetCursorBlink();
    };
    TextField.prototype.resetCursorBlink = function () {
        this._blinkTime = InterfaceElement_1.default.drawTime;
        this._cursor.visible = true;
    };
    TextField.prototype.updateText = function () {
        var text;
        if (this._hidden) {
            text = '';
            for (var i = 0; i < this._text.length; i++) {
                text += '*';
            }
        }
        else {
            text = this._text;
        }
        this._textElement.text = text;
        var offset = (this.width - this._borderPadding * 2) - (this._textElement.width + this._cursor.width - 4);
        offset = Math.min(offset, this._borderPadding);
        this._textElement.setAttachOffset(offset, 0);
    };
    return TextField;
}(InterfaceElement_1.default));
TextField.alphabets = {
    abc: /^[a-zA-Z]$/,
    abc123: /^[a-zA-Z0-9]$/
};
TextField.BLINK_INTERVAL = 750;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextField;

},{"../../common/Vector2D":31,"../events/GameEvent":5,"./AttachInfo":7,"./InterfaceElement":11,"./MaskElement":12,"./Panel":13,"./TextElement":15}],17:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var InterfaceElement_1 = require("../InterfaceElement");
var TextElement_1 = require("../TextElement");
var AttachInfo_1 = require("../AttachInfo");
var Panel_1 = require("../Panel");
var ElementList_1 = require("../ElementList");
var TextField_1 = require("../TextField");
var InputManager_1 = require("../InputManager");
var GameEvent_1 = require("../../events/GameEvent");
var TextFieldListManager_1 = require("./TextFieldListManager");
var TextButton_1 = require("../TextButton");
var LoginMenu = (function (_super) {
    __extends(LoginMenu, _super);
    function LoginMenu() {
        var _this = _super.call(this) || this;
        _this.onSubmit = function (e) {
            var userNameField = _this.getElementById("usernameField");
            var passwordField = _this.getElementById("passwordField");
            console.log("LOGIN as " + userNameField.text + "#" + passwordField.text);
        };
        _this.onClickRegister = function (e) {
            console.log("I wanna make an account");
        };
        _this._className = "LoginMenu";
        _this._list = new ElementList_1.default(300, ElementList_1.default.VERTICAL, 6, ElementList_1.default.CENTRE);
        //Add things to list...
        var text;
        var userNameField;
        var passwordField;
        var button;
        //Title
        text = new TextElement_1.default("MMO Online", TextElement_1.default.bigText);
        _this._list.addChild(text, 10); //add extra padding between form and title
        //Username
        text = new TextElement_1.default("Username", TextElement_1.default.basicText);
        text.id = "usernameLabel";
        _this._list.addChild(text);
        userNameField = new TextField_1.default(250, 28, TextElement_1.default.basicText, TextField_1.default.alphabets.abc123);
        userNameField.id = "usernameField";
        _this._list.addChild(userNameField);
        //Pass
        text = new TextElement_1.default("Password", TextElement_1.default.basicText);
        text.id = "passwordLabel";
        _this._list.addChild(text);
        passwordField = new TextField_1.default(250, 28, TextElement_1.default.basicText);
        passwordField.id = "passwordField";
        passwordField.hidden = true;
        _this._list.addChild(passwordField, 10);
        //Buttons (Log In and Register)
        var buttonContainer = new ElementList_1.default(30, ElementList_1.default.HORIZONTAL, 10, ElementList_1.default.CENTRE);
        button = new TextButton_1.default("Log In", TextButton_1.default.colorSchemes.green);
        buttonContainer.addChild(button);
        button.addEventListener(GameEvent_1.default.types.ui.LEFTMOUSECLICK, _this.onSubmit);
        button = new TextButton_1.default("Register");
        buttonContainer.addChild(button);
        button.addEventListener(GameEvent_1.default.types.ui.LEFTMOUSECLICK, _this.onClickRegister);
        _this._list.addChild(buttonContainer);
        //Resize to fit, and attach bg an list
        _this._bg = new Panel_1.default(_this._list.width + 40, _this._list.height + 40, Panel_1.default.BASIC);
        _this.resize(_this._bg.width, _this._bg.height);
        _this.addChild(_this._bg);
        _this.addChild(_this._list);
        _this._bg.attachToParent(AttachInfo_1.default.Center);
        _this._list.attachToParent(AttachInfo_1.default.Center);
        //Focus first field
        InputManager_1.default.instance.focus(_this.getElementById("usernameField"));
        //Set up field manager
        _this._textFieldManager = new TextFieldListManager_1.default([
            userNameField,
            passwordField
        ]);
        _this._textFieldManager.addEventListener(GameEvent_1.default.types.ui.SUBMIT, _this.onSubmit);
        return _this;
    }
    return LoginMenu;
}(InterfaceElement_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LoginMenu;

},{"../../events/GameEvent":5,"../AttachInfo":7,"../ElementList":9,"../InputManager":10,"../InterfaceElement":11,"../Panel":13,"../TextButton":14,"../TextElement":15,"../TextField":16,"./TextFieldListManager":19}],18:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var InterfaceElement_1 = require("../InterfaceElement");
var AttachInfo_1 = require("../AttachInfo");
var LoginMenu_1 = require("./LoginMenu");
var Log = require("../../util/Log");
var MainMenu = (function (_super) {
    __extends(MainMenu, _super);
    function MainMenu() {
        var _this = _super.call(this) || this;
        _this._currentMenuName = "";
        _this._currentMenu = null;
        _this._className = "MainMenu";
        //this._loginMenu = new TextElement("Login!", TextElement.veryBigText);
        _this._loginMenu = new LoginMenu_1.default();
        return _this;
    }
    MainMenu.prototype.showMenu = function (name) {
        if (name == this._currentMenuName) {
            Log.log('debug', 'MainMenu already on "' + name + '"');
            return;
        }
        if (this._currentMenu)
            this.removeChild(this._currentMenu);
        switch (name) {
            case "login":
                this.showLogin();
                break;
        }
        this.resizeToFitChildren();
    };
    MainMenu.prototype.showLogin = function () {
        Log.log('debug', 'MainMenu: login');
        this._currentMenuName = "login";
        this._currentMenu = this._loginMenu;
        this.addChild(this._loginMenu);
        this._loginMenu.attachToParent(AttachInfo_1.default.Center);
    };
    return MainMenu;
}(InterfaceElement_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MainMenu;

},{"../../util/Log":27,"../AttachInfo":7,"../InterfaceElement":11,"./LoginMenu":17}],19:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var GameEvent_1 = require("../../events/GameEvent");
var GameEventHandler_1 = require("../../events/GameEventHandler");
var InputManager_1 = require("../InputManager");
var TextFieldListManager = (function (_super) {
    __extends(TextFieldListManager, _super);
    /**
     * Not an InterfaceElement! Just sets up events (TAB/SUBMIT) for a list of text elements
     */
    function TextFieldListManager(fields) {
        if (fields === void 0) { fields = null; }
        var _this = _super.call(this) || this;
        _this.onTab = function (e) {
            var from = e.from;
            if (!from)
                return;
            var index = _this._fields.indexOf(from);
            if (index === -1)
                return;
            var increment = (InputManager_1.default.instance.isKeyDown("SHIFT")) ? -1 : 1;
            index = (index + increment) % _this._fields.length;
            if (index == -1)
                index = _this._fields.length - 1;
            InputManager_1.default.instance.focus(_this._fields[index]);
        };
        _this.onSubmit = function (e) {
            _this.sendEvent(e);
        };
        if (fields)
            _this.init(fields);
        return _this;
    }
    TextFieldListManager.prototype.init = function (fields) {
        if (this._fields)
            this.cleanup();
        this._fields = fields;
        for (var _i = 0, fields_1 = fields; _i < fields_1.length; _i++) {
            var field = fields_1[_i];
            field.addEventListener(GameEvent_1.default.types.ui.TAB, this.onTab);
            field.addEventListener(GameEvent_1.default.types.ui.SUBMIT, this.onSubmit);
        }
    };
    TextFieldListManager.prototype.cleanup = function () {
        for (var _i = 0, _a = this._fields; _i < _a.length; _i++) {
            var field = _a[_i];
            field.removeEventListener(GameEvent_1.default.types.ui.TAB, this.onTab);
            field.removeEventListener(GameEvent_1.default.types.ui.SUBMIT, this.onSubmit);
        }
    };
    return TextFieldListManager;
}(GameEventHandler_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextFieldListManager;

},{"../../events/GameEvent":5,"../../events/GameEventHandler":6,"../InputManager":10}],20:[function(require,module,exports){
/*
   Code entry point. Keep it clean.
*/
"use strict";
var Game_1 = require("./Game");
var viewDiv = document.getElementById("viewDiv");
var game = new Game_1.default(viewDiv);
game.init();

},{"./Game":2}],21:[function(require,module,exports){
"use strict";
exports.mainMenuMusic = [
    ["music/fortress", "sound/music/fortress.ogg"]
];
exports.interfaceSounds = [
    ["ui/click", "sound/ui/click.ogg"],
    ["ui/rollover", "sound/ui/rollover.ogg"],
    ["ui/nope", "sound/ui/nope.ogg"]
];

},{}],22:[function(require,module,exports){
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
            //done
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
    return SoundManager;
}());
SoundManager._instance = null;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SoundManager;

},{}],23:[function(require,module,exports){
"use strict";
/// <reference path="../../declarations/pixi.js.d.ts"/>
var Game_1 = require("../Game");
function simpleRectangle(target, width, height, color, borderWidth, borderColor) {
    if (borderWidth === void 0) { borderWidth = 0; }
    if (borderColor === void 0) { borderColor = 0; }
    //if (!target) target = new PIXI.RenderTexture(Game.instance.renderer, width, height);
    if (!target)
        target = PIXI.RenderTexture.create(width, height);
    var g = Game_1.default.instance.volatileGraphics;
    g.lineStyle(borderWidth, borderColor, 1);
    g.beginFill(color, 1);
    g.drawRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);
    g.endFill();
    //target.render(g);
    Game_1.default.instance.renderer.render(g, target);
    return target;
}
exports.simpleRectangle = simpleRectangle;
function buttonBackground(width, height, type) {
    var bgColor = 0x3e3bff;
    var borderColor = 0x616161;
}
exports.buttonBackground = buttonBackground;

},{"../Game":2}],24:[function(require,module,exports){
"use strict";
var TextureLoader = (function () {
    function TextureLoader(sheetName, mapName, callback) {
        this._sheet = null;
        this._map = null;
        this._textures = {};
        this._callback = callback;
        var _this = this;
        PIXI.loader.add("sheet", sheetName);
        PIXI.loader.load(function (loader, resources) {
            _this._sheet = resources.sheet.texture.baseTexture;
            _this.onSheetOrMap();
        });
        var req = new XMLHttpRequest();
        req.onreadystatechange = function () {
            if (req.readyState == 4 && req.status == 200) {
                _this._map = JSON.parse(req.responseText).frames;
                _this.onSheetOrMap();
            }
        };
        req.open("GET", mapName, true);
        req.send();
    }
    TextureLoader.prototype.get = function (texName) {
        return this._textures[texName];
    };
    TextureLoader.prototype.getData = function () {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.width = this._sheet.width;
        canvas.height = this._sheet.height;
        context.drawImage(this._sheet.source, 0, 0);
        var data = {};
        var frame;
        for (var texName in this._map) {
            frame = this._map[texName].frame;
            data[texName] = context.getImageData(frame.x, frame.y, frame.w, frame.h);
        }
        return data;
    };
    TextureLoader.prototype.onSheetOrMap = function () {
        var sheet = this._sheet;
        var map = this._map;
        if (sheet === null || map === null)
            return;
        var frame;
        var rect;
        for (var texName in map) {
            frame = map[texName].frame;
            rect = new PIXI.Rectangle(frame.x, frame.y, frame.w, frame.h);
            this._textures[texName] = new PIXI.Texture(sheet, rect);
        }
        this._callback();
    };
    return TextureLoader;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextureLoader;

},{}],25:[function(require,module,exports){
"use strict";
/// <reference path="../../declarations/pixi.js.d.ts"/>
var ColorUtil = require("../util/ColorUtil");
/**
 * Wraps a Worker, and provides async functions for getting recolored sprites.
 * TODO: create sprite sheets, as per previous implementation
 *
 * NOTE: Most of the actual work is done in public/js/mmoo-worker.js, and due to
 * some funky TypeScript nonsense it must be written there.
 */
var TextureWorker = (function () {
    function TextureWorker(scriptURL) {
        var _this = this;
        this._requestNumber = 0;
        this._callbacks = {};
        this._worker = new Worker(scriptURL);
        this._worker.onmessage = function (e) {
            _this._onMessage(e.data);
        };
    }
    TextureWorker.prototype.putTextures = function (texData) {
        var imgData;
        var msg;
        for (var texName in texData) {
            imgData = texData[texName];
            msg = {
                action: "newTexture",
                params: {
                    name: texName,
                    width: imgData.width,
                    height: imgData.height
                },
                data: imgData.data.buffer
            };
            this._worker.postMessage(msg, [msg.data]);
        }
    };
    TextureWorker.prototype.getTexture = function (name, colorMap, callback) {
        var requestKey = this._requestNumber.toString();
        this._requestNumber += 1;
        this._callbacks[requestKey] = callback;
        this._worker.postMessage({
            action: "getTexture",
            params: {
                name: name,
                colorMap: colorMap,
                requestKey: requestKey
            }
        });
        return requestKey;
    };
    TextureWorker.prototype._onMessage = function (msg) {
        switch (msg.action) {
            case "getTexture":
                this.onGetTexture(msg.params, msg.data);
                break;
        }
    };
    TextureWorker.prototype.onGetTexture = function (params, data) {
        var width = params.width;
        var height = params.height;
        var dataArray = new Uint8ClampedArray(data);
        var requestKey = params.requestKey;
        var callback = this._callbacks[requestKey];
        if (callback) {
            callback(requestKey, this.textureFromArray(dataArray, width, height));
            delete this._callbacks[requestKey];
        }
    };
    TextureWorker.prototype.textureFromArray = function (dataArray, width, height) {
        try {
            var imageData = new ImageData(dataArray, width, height); //if on Edge, this will throw an error
        }
        catch (e) {
            return this.textureFromArrayEdge(dataArray, width, height);
        }
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        context.putImageData(imageData, 0, 0);
        return PIXI.Texture.fromCanvas(canvas, PIXI.SCALE_MODES.NEAREST);
    };
    //probably slower, fallback for Edge which can't do ImageData constructors (why?!)
    TextureWorker.prototype.textureFromArrayEdge = function (dataArray, width, height) {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        //use drawRect based on dataArray
        var x = 0;
        var y = 0;
        var runStart = -1; //number of same RGBA
        var same;
        var drawX, drawW;
        for (var i = 0; i < dataArray.length; i += 4) {
            same = false;
            if (x < width - 1)
                same = this.compareRGBA(dataArray, i, i + 4);
            if (same && runStart == -1) {
                runStart = x;
            }
            else if (!same) {
                if (runStart >= 0) {
                    //print the run (which is this color)
                    drawX = runStart;
                    drawW = x - runStart + 1;
                    runStart = -1;
                }
                else {
                    //print just this
                    drawX = x;
                    drawW = 1;
                }
                //if not transparent
                if (dataArray[i + 3] > 0) {
                    context.fillStyle = ColorUtil.rgbString(dataArray[i], dataArray[i + 1], dataArray[i + 2]);
                    context.fillRect(drawX, y, drawW, 1);
                }
            }
            //(do nothing if on a run and next pixel is same rgba)
            x += 1;
            if (x == width) {
                x = 0;
                y += 1;
            }
        }
        return PIXI.Texture.fromCanvas(canvas, PIXI.SCALE_MODES.NEAREST);
    };
    TextureWorker.prototype.compareRGBA = function (a, i1, i2) {
        return (a[i1] == a[i2]
            && a[i1 + 1] == a[i2 + 1]
            && a[i1 + 2] == a[i2 + 2]
            && a[i1 + 3] == a[i2 + 3]);
    };
    return TextureWorker;
}());
TextureWorker._supportsImageDataConstructor = -1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextureWorker;

},{"../util/ColorUtil":26}],26:[function(require,module,exports){
"use strict";
function rgbToNumber(r, g, b) {
    return (r << 16) + (g << 8) + b;
}
exports.rgbToNumber = rgbToNumber;
function hexToRGB(hex) {
    var r = hex >> 16;
    var g = hex >> 8 & 0xFF;
    var b = hex & 0xFF;
    return [r, g, b];
}
exports.hexToRGB = hexToRGB;
function rgbString(r, g, b) {
    return "rgb(" + r + "," + g + "," + b + ")";
}
exports.rgbString = rgbString;
function rgbaString(r, g, b, a) {
    return "rgb(" + r + "," + g + "," + b + "," + a / 255 + ")";
}
exports.rgbaString = rgbaString;

},{}],27:[function(require,module,exports){
"use strict";
/*
   Provides pretty console.log messages, by key.
*/
var types = {};
var isEdge = (function () {
    if (window.clientInformation.appVersion && window.clientInformation.appVersion.indexOf("Edge") != -1)
        return true;
    if (window.clientInformation.userAgent && window.clientInformation.userAgent.indexOf("Edge") != -1)
        return true;
    return false;
})();
var LogType = (function () {
    function LogType(prefix, textColor, bgColor, enabled) {
        if (prefix === void 0) { prefix = ""; }
        if (textColor === void 0) { textColor = "#000"; }
        if (bgColor === void 0) { bgColor = "#fff"; }
        if (enabled === void 0) { enabled = true; }
        this.prefix = prefix;
        this.textColor = textColor;
        this.bgColor = bgColor;
        this.enabled = enabled;
    }
    LogType.prototype.log = function (msg) {
        if (this.enabled) {
            if (isEdge) {
                //doesn't support css in logs
                console.log(this.prefix + msg);
            }
            else {
                console.log("%c" + this.prefix + msg, "background:" + this.bgColor + "; color:" + this.textColor + ";");
            }
        }
    };
    return LogType;
}());
exports.LogType = LogType;
function setLogType(name, type) {
    if (!types.hasOwnProperty(name))
        types[name] = type;
}
exports.setLogType = setLogType;
function log(typeName, msg) {
    if (types.hasOwnProperty(typeName))
        types[typeName].log(msg);
}
exports.log = log;

},{}],28:[function(require,module,exports){
"use strict";
var AssetCache = (function () {
    /**
     * Stores objects by key, and discards the oldest once capacity is reached.
     * TODO: Option to keep the most recently used (move to top when accessed, requires LinkedList)
     *
     * If you use this for PIXI.Texture, be sure to set the onDelete to call destroy.
     */
    function AssetCache(capacity, onDelete) {
        if (onDelete === void 0) { onDelete = null; }
        this._assets = {};
        this._keyQueue = [];
        this.onDelete = null;
        this._capacity = capacity;
        this.onDelete = onDelete;
    }
    Object.defineProperty(AssetCache.prototype, "capacity", {
        get: function () { return this._capacity; },
        set: function (value) { this._capacity = value; this.removeExcess(); },
        enumerable: true,
        configurable: true
    });
    AssetCache.prototype.get = function (key) {
        var asset = this._assets[key];
        if (!asset)
            asset = null;
        return asset;
    };
    AssetCache.prototype.set = function (key, asset) {
        if (this.get(key) === null)
            return;
        this._assets[key] = asset;
        this._keyQueue.push(key);
        this.removeExcess();
    };
    AssetCache.prototype.removeExcess = function () {
        if (this._capacity < 1)
            return;
        var key = this._keyQueue.shift();
        while (this._keyQueue.length > this._capacity) {
            if (this.onDelete)
                this.onDelete(this._assets[key]);
            delete this._assets[key];
        }
    };
    return AssetCache;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AssetCache;

},{}],29:[function(require,module,exports){
"use strict";
/**
 * Generates string IDs from an alphabet. IDs can be relinquished and recycled to keep them short.
 */
var IDPool = (function () {
    /**
     * Generates string IDs from an alphabet. IDs can be relinquished and recycled to keep them short.
     */
    function IDPool(alphabet) {
        if (alphabet === void 0) { alphabet = IDPool._defaultAlphabet; }
        this._indeces = [0];
        this._unused = [];
        this._maxUnused = 100;
        this._alphabet = alphabet;
    }
    Object.defineProperty(IDPool.prototype, "maxUnused", {
        set: function (num) {
            this._maxUnused = num;
            var len = this._unused.length;
            if (len > num)
                this._unused.splice(num - 1, len - num);
        },
        enumerable: true,
        configurable: true
    });
    IDPool.prototype.getID = function () {
        if (this._unused.length > 0)
            return this._unused.pop();
        else
            return this._createID();
    };
    //Use this to keep messaged ids short, saving some bandwidth
    IDPool.prototype.relinquishID = function (id) {
        if (this._unused.length < this._maxUnused)
            this._unused.push(id);
    };
    IDPool.prototype._createID = function () {
        var id = '';
        for (var i = 0; i < this._indeces.length; i++) {
            //allegedly, concat performance is comparable to, if not better than join
            id += this._alphabet[this._indeces[i]];
        }
        this._increment();
        return id;
    };
    IDPool.prototype._increment = function () {
        var index = this._indeces.length - 1;
        while (true) {
            this._indeces[index] += 1;
            if (this._indeces[index] == this._alphabet.length) {
                this._indeces[index] = 0;
                index -= 1;
                if (index < 0)
                    this._indeces.unshift(0);
                else
                    continue;
            }
            break;
        }
    };
    return IDPool;
}());
IDPool._defaultAlphabet = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ~`!@#$%^&*()-_=+[]{}|;:<>,.?/';
IDPool._alphanumeric = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = IDPool;

},{}],30:[function(require,module,exports){
"use strict";
function noop() { }
exports.noop = noop;
////////////////////////////////////////
// Objects
////////////////////////////////////////
function shallowCopy(obj) {
    var ret = {};
    var keys = Object.keys(obj);
    var prop;
    for (var i = 0; i < keys.length; i++) {
        prop = keys[i];
        ret[prop] = obj[prop];
    }
    return ret;
}
exports.shallowCopy = shallowCopy;
////////////////////////////////////////
// Strings
////////////////////////////////////////
/**
 * Slight misnomer. Removes the first and last characters from a string. Assumes it is long enough to do so.
 */
function stripBraces(s) {
    //might more accurately be called stripFirstAndLastCharacters but that's LONG
    return s.substr(1, s.length - 1);
}
exports.stripBraces = stripBraces;
////////////////////////////////////////
// Numbers
////////////////////////////////////////
function clamp(num, min, max) {
    if (num > max)
        return max;
    if (num < min)
        return min;
    return num;
}
exports.clamp = clamp;
////////////////////////////////////////
// Type Checking
////////////////////////////////////////
function isString(x) {
    return (typeof x === 'string' || x instanceof String);
}
exports.isString = isString;
function isInt(x) {
    return (isNumber(x) && Math.floor(x) == x);
}
exports.isInt = isInt;
function isNumber(x) {
    return (typeof x === 'number');
}
exports.isNumber = isNumber;
/**
 * Returns whether x is an array, and optionally, whether its length is len
 */
function isArray(x, len) {
    if (len === void 0) { len = -1; }
    if (Array.isArray(x)) {
        if (len < 0)
            return true;
        return x.length == len;
    }
    return false;
}
exports.isArray = isArray;
function isObject(x, allowNull) {
    if (allowNull === void 0) { allowNull = false; }
    return (typeof x === 'object' && !isArray(x) && (x != null || allowNull));
}
exports.isObject = isObject;
/**
 * Returns true if x is an array of two numbers.
 */
function isCoordinate(x) {
    return (isArray(x) && x.length == 2 && isNumber(x[0]) && isNumber(x[1]));
}
exports.isCoordinate = isCoordinate;

},{}],31:[function(require,module,exports){
"use strict";
var Vector2D = (function () {
    function Vector2D(x, y) {
        this.x = x;
        this.y = y;
    }
    Vector2D.prototype.set = function (v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    };
    Vector2D.prototype.add = function (v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    };
    Vector2D.prototype.sub = function (v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    };
    Vector2D.prototype.round = function () {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    };
    Vector2D.prototype.scale = function (scale) {
        this.x *= scale;
        this.y *= scale;
        return this;
    };
    Vector2D.prototype.offset = function (angle, distance) {
        angle = Vector2D.degToRad(angle);
        this.x += distance * Math.cos(angle);
        this.y += distance * Math.sin(angle);
        return this;
    };
    Vector2D.prototype.normalize = function () {
        if (this.x == 0 && this.y == 0)
            this.x = 1;
        else
            this.scale(1 / this.length());
        return this;
    };
    ///////////////////////////////////////////////////////////////////
    // functions which return a result (not this)
    ///////////////////////////////////////////////////////////////////
    Vector2D.prototype.clone = function () {
        return new Vector2D(this.x, this.y);
    };
    Vector2D.prototype.length = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    Vector2D.prototype.midpoint = function () {
        return this.clone().scale(0.5);
    };
    Vector2D.prototype.midpointTo = function (other) {
        return other.clone().sub(this).midpoint();
    };
    Vector2D.prototype.equals = function (other) {
        return (this.x == other.x && this.y == other.y);
    };
    Vector2D.prototype.distanceTo = function (other) {
        //avoid creating and discarding
        var ret;
        other.sub(this);
        ret = other.length();
        other.add(this);
        return ret;
    };
    Vector2D.prototype.withinDistance = function (other, distance) {
        var xDiff = other.x - this.x;
        var yDiff = other.y - this.y;
        var squareDist = xDiff * xDiff + yDiff * yDiff;
        return (squareDist <= distance * distance);
    };
    Vector2D.prototype.toJSON = function () {
        return [this.x, this.y];
    };
    Vector2D.degToRad = function (angle) {
        return (angle * Math.PI) / 180.0;
    };
    Vector2D.radToDeg = function (angle) {
        return (angle * 180) / Math.PI;
    };
    return Vector2D;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Vector2D;

},{}],32:[function(require,module,exports){
"use strict";
var IDPool_1 = require("../IDPool");
var Vector2D_1 = require("../Vector2D");
//import * as MessageTypes from './MessageTypes'; moved this to bottom because of circular referencing gone wrong
var Util = require("../Util");
var Message = (function () {
    function Message(type) {
        this.type = type;
    }
    Message.prototype.serialize = function () {
        return this.type.toString();
    };
    //<type>[arg1, arg2, ..., argN]
    Message.parse = function (s) {
        var splitIndex = s.indexOf('[');
        if (splitIndex === -1) {
            console.log("parse: nowhere to split");
            return null;
        }
        var msgType = parseInt(s.substring(0, splitIndex), 10);
        if (isNaN(msgType)) {
            console.log("parse: " + s.substring(0, splitIndex) + " is NaN");
            return null;
        }
        var args;
        try {
            args = JSON.parse(s.substring(splitIndex));
        }
        catch (e) {
            console.log("parse: invalid json");
            return null;
        }
        if (!Util.isArray(args))
            return null;
        var msgClass = MessageTypes.getClassByType(msgType);
        if (msgClass === null) {
            console.log("parse: no class for type " + msgType);
            return null;
        }
        var msg = msgClass.fromArgs(args);
        if (msg)
            return msg;
        console.log("parse: class evaluator rejected arguments");
        return null;
        //decrypt, if applicable
    };
    Message.fromArgs = function (args) {
        return null;
    };
    ////////////////////////////////////////
    // serialization
    ////////////////////////////////////////
    Message.serializeParams = function (obj) {
        var s = JSON.stringify(Message.abbreviate(obj));
        return s.substring(1, s.length - 1);
    };
    //returns an object with shorter keys using the abbreviations list
    Message.abbreviate = function (obj) {
        var clone = {};
        var keys = Object.keys(obj);
        var key, val;
        for (var i = 0; i < keys.length; i++) {
            key = keys[i];
            val = obj[key];
            if (val instanceof Vector2D_1.default) {
                val = [val.x, val.y];
            }
            else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                val = Message.abbreviate(val);
            }
            clone[Message.getAbbreviation(key)] = val;
        }
        return clone;
    };
    Message.getAbbreviation = function (term) {
        if (Message._abbreviations == null)
            Message.generateAbbreviations();
        if (term.length > 2) {
            var abbreviation = Message._abbreviations[term];
            if (abbreviation)
                return abbreviation;
        }
        return term;
    };
    ////////////////////////////////////////
    // parsing
    ////////////////////////////////////////
    /**
     * Replaces abbreviated keys with their full counterparts.
     * NOTE: this is in-place!
     */
    Message.expand = function (obj) {
        var keys = Object.keys(obj);
        var key, val, fullKey;
        for (var i = 0; i < keys.length; i++) {
            key = keys[i];
            val = obj[key];
            fullKey = Message.getExpansion(key);
            if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
                Message.expand(val);
            }
            else if (Array.isArray(val)
                && val.length === 2
                && typeof val[0] === 'number' && typeof val[1] === 'number') {
                val = new Vector2D_1.default(val[0], val[1]);
            }
            if (key !== fullKey) {
                obj[fullKey] = val;
                delete obj[key];
            }
        }
    };
    Message.getExpansion = function (term) {
        if (Message._abbreviations == null)
            Message.generateAbbreviations();
        if (term.length > 1) {
            var expansion = Message._expansions[term];
            if (expansion)
                return expansion;
        }
        return term;
    };
    ////////////////////////////////////////
    // private static inits
    ////////////////////////////////////////
    Message.generateAbbreviations = function () {
        Message._abbreviations = {};
        Message._expansions = {};
        var terms = [
            'step',
            'unit',
            'direction',
            'target',
            'amount',
            'source',
            'position',
            'point',
            'destination',
            'queue',
            'killer',
            'success',
            'moveSpeed',
            'attackDamage',
            'attackRange',
            'attackSpeed',
            'radius',
            'name',
            'password',
            'success',
            'alive',
            'name',
            'action',
            'lastBroadcastPosition'
        ];
        var pool = new IDPool_1.default();
        var term, abbreviation;
        for (var i = 0; i < terms.length; i++) {
            term = terms[i];
            abbreviation = '?' + pool.getID();
            Message._abbreviations[term] = abbreviation;
            Message._expansions[abbreviation] = term;
        }
    };
    return Message;
}());
Message._abbreviations = null;
Message._expansions = null;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Message;
var MessageTypes = require("./MessageTypes");

},{"../IDPool":29,"../Util":30,"../Vector2D":31,"./MessageTypes":33}],33:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Message_1 = require("./Message");
var Util = require("../Util");
/**
 * Single-digit numbers should be reserved for very common types
 */
exports.PING = 0;
/**
 * Everything else can incur the whopping 1-character payload increase
 */
exports.USER = 10; //login, create account, character operations
exports.CRYPTO = 11; //wraps some other message
exports.GET_REQUEST = 12; //general-purpose info retrieval (eg rsa key)
exports.GET_RESPONSE = 13;
exports.GAME_JOINED = 14; //also contains information about the game's state
exports.GAME_LEFT = 15;
exports.ROOM_JOINED = 16;
exports.ROOM_LEFT = 17;
/**
 * Giving everything its own class makes things neat and happy. Probably.
 * This file will likely become very long, but it's basically just type checking so oh well.
 */
var classesByType = [];
function getClassByType(type) {
    var c = classesByType[type];
    if (c)
        return c;
    return null;
}
exports.getClassByType = getClassByType;
var Ping = (function (_super) {
    __extends(Ping, _super);
    function Ping() {
        return _super.call(this, exports.PING) || this;
    }
    Ping.fromArgs = function (args) {
        return Ping._instance;
    };
    Ping.prototype.serialize = function () {
        return "0[]";
    };
    return Ping;
}(Message_1.default));
Ping._instance = new Ping();
exports.Ping = Ping;
classesByType[exports.PING] = Ping;
var UserMessage = (function (_super) {
    __extends(UserMessage, _super);
    function UserMessage(action, params) {
        var _this = _super.call(this, exports.USER) || this;
        _this.action = action;
        _this.params = params;
        return _this;
    }
    Object.defineProperty(UserMessage.prototype, "success", {
        get: function () {
            if (this.params && this.params.hasOwnProperty("success") && this.params["success"])
                return true;
            return false;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UserMessage.prototype, "failReason", {
        get: function () {
            if (this.params && this.params.hasOwnProperty("failReason"))
                return this.params["failReason"];
            return "Unknown reason";
        },
        enumerable: true,
        configurable: true
    });
    UserMessage.fromArgs = function (args) {
        var action = args[0];
        var params = args[1];
        if (Util.isString(action) && Util.isObject(params))
            return new UserMessage(action, params);
        return null;
    };
    UserMessage.prototype.serialize = function () {
        var s = _super.prototype.serialize.call(this);
        s += JSON.stringify([this.action, this.params]);
        return s;
    };
    return UserMessage;
}(Message_1.default));
exports.UserMessage = UserMessage;
classesByType[exports.USER] = UserMessage;
var CryptoMessage = (function (_super) {
    __extends(CryptoMessage, _super);
    function CryptoMessage(action, ciphertext) {
        var _this = _super.call(this, exports.CRYPTO) || this;
        _this.action = action;
        _this.ciphertext = ciphertext;
        return _this;
    }
    CryptoMessage.fromArgs = function (args) {
        var action = args[0];
        var ciphertext = args[1];
        if (Util.isString(action) && Util.isString(ciphertext))
            return new CryptoMessage(action, ciphertext);
        return null;
    };
    CryptoMessage.prototype.serialize = function () {
        var s = _super.prototype.serialize.call(this);
        s += JSON.stringify([this.action, this.ciphertext]);
        return s;
    };
    return CryptoMessage;
}(Message_1.default));
exports.CryptoMessage = CryptoMessage;
classesByType[exports.CRYPTO] = CryptoMessage;
/**
 * General-purpose get. Game lists, definitions, whatever.
 */
var GetRequest = (function (_super) {
    __extends(GetRequest, _super);
    function GetRequest(subject, requestKey, params) {
        var _this = _super.call(this, exports.GET_REQUEST) || this;
        _this.subject = subject;
        _this.requestKey = requestKey;
        _this.params = params;
        return _this;
    }
    GetRequest.fromArgs = function (args) {
        if (Util.isString(args[0])
            && Util.isInt(args[1])
            && Util.isObject(args[2])) {
            return new GetRequest(args[0], args[1], args[2]);
        }
        return null;
    };
    GetRequest.prototype.serialize = function () {
        var s = _super.prototype.serialize.call(this);
        s += JSON.stringify([this.subject, this.requestKey, this.params]);
        return s;
    };
    return GetRequest;
}(Message_1.default));
exports.GetRequest = GetRequest;
classesByType[exports.GET_REQUEST] = GetRequest;
var GetResponse = (function (_super) {
    __extends(GetResponse, _super);
    function GetResponse(requestKey, response) {
        var _this = _super.call(this, exports.GET_RESPONSE) || this;
        _this.requestKey = requestKey;
        _this.response = response;
        return _this;
    }
    GetResponse.fromArgs = function (args) {
        if (Util.isInt(args[0]) && args.length == 2)
            return new GetResponse(args[0], args[1]);
        return null;
    };
    GetResponse.prototype.serialize = function () {
        var s = _super.prototype.serialize.call(this);
        s += JSON.stringify([this.requestKey, this.response]);
        return s;
    };
    return GetResponse;
}(Message_1.default));
exports.GetResponse = GetResponse;
classesByType[exports.GET_RESPONSE] = GetResponse;
/**
 * User has joined the Game
 * Reports the Game's current frame and simulation speed
 */
var GameJoined = (function (_super) {
    __extends(GameJoined, _super);
    function GameJoined(gameId, frame, frameInterval) {
        var _this = _super.call(this, exports.GAME_JOINED) || this;
        _this.gameId = gameId;
        _this.frame = frame;
        _this.frameInterval = frameInterval;
        return _this;
    }
    GameJoined.fromArgs = function (args) {
        if (Util.isInt(args[0])
            && Util.isInt(args[1])
            && Util.isNumber(args[2])) {
            return new GameJoined(args[0], args[1], args[2]);
        }
        return null;
    };
    GameJoined.prototype.serialize = function () {
        var s = _super.prototype.serialize.call(this);
        s += JSON.stringify([this.gameId, this.frame, this.frameInterval]);
        return s;
    };
    return GameJoined;
}(Message_1.default));
exports.GameJoined = GameJoined;
classesByType[exports.GAME_JOINED] = GameJoined;
/**
 * User has left the Game
 */
var GameLeft = (function (_super) {
    __extends(GameLeft, _super);
    function GameLeft(gameId, reason) {
        var _this = _super.call(this, exports.GAME_LEFT) || this;
        _this.gameId = gameId;
        _this.reason = reason;
        return _this;
    }
    GameLeft.fromArgs = function (args) {
        if (Util.isInt(args[0]) && Util.isString(args[1])) {
            return new GameLeft(args[0], args[1]);
        }
        return null;
    };
    GameLeft.prototype.serialize = function () {
        var s = _super.prototype.serialize.call(this);
        s += JSON.stringify([this.gameId, this.reason]);
        return s;
    };
    return GameLeft;
}(Message_1.default));
exports.GameLeft = GameLeft;
classesByType[exports.GAME_LEFT] = GameLeft;
/**
 * Player sees a Room. Might need to say more later, hence its own type.
 */
var RoomJoined = (function (_super) {
    __extends(RoomJoined, _super);
    function RoomJoined(gameId) {
        var _this = _super.call(this, exports.ROOM_JOINED) || this;
        _this.roomId = gameId;
        return _this;
    }
    RoomJoined.fromArgs = function (args) {
        if (Util.isInt(args[0])) {
            return new RoomJoined(args[0]);
        }
        return null;
    };
    RoomJoined.prototype.serialize = function () {
        var s = _super.prototype.serialize.call(this);
        s += JSON.stringify([this.roomId]);
        return s;
    };
    return RoomJoined;
}(Message_1.default));
exports.RoomJoined = RoomJoined;
classesByType[exports.ROOM_JOINED] = RoomJoined;
/**
 * Player doesn't see this Room anymore
 */
var RoomLeft = (function (_super) {
    __extends(RoomLeft, _super);
    function RoomLeft(gameId) {
        var _this = _super.call(this, exports.ROOM_LEFT) || this;
        _this.roomId = gameId;
        return _this;
    }
    RoomLeft.fromArgs = function (args) {
        if (Util.isInt(args[0])) {
            return new RoomLeft(args[0]);
        }
        return null;
    };
    RoomLeft.prototype.serialize = function () {
        var s = _super.prototype.serialize.call(this);
        s += JSON.stringify([this.roomId]);
        return s;
    };
    return RoomLeft;
}(Message_1.default));
exports.RoomLeft = RoomLeft;
classesByType[exports.ROOM_LEFT] = RoomLeft;

},{"../Util":30,"./Message":32}]},{},[20]);
