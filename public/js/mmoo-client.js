(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var Log = require('./util/Log');
var Message_1 = require('../common/messages/Message');
var MessageTypes = require('../common/messages/MessageTypes');
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
    Connection.getRequestId = 0;
    return Connection;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Connection;

},{"../common/messages/Message":23,"../common/messages/MessageTypes":24,"./util/Log":19}],2:[function(require,module,exports){
"use strict";
var Log = require('./util/Log');
var Connection_1 = require('./Connection');
var LoginManager_1 = require('./LoginManager');
var TextureLoader_1 = require('./textures/TextureLoader');
var TextureWorker_1 = require('./textures/TextureWorker');
var SoundManager_1 = require('./sound/SoundManager');
var SoundAssets = require('./sound/SoundAssets');
var InterfaceElement_1 = require('./interface/InterfaceElement');
var TextElement_1 = require('./interface/TextElement');
var AttachInfo_1 = require('./interface/AttachInfo');
var MainMenu_1 = require('./interface/prefabs/MainMenu');
var InputManager_1 = require('./interface/InputManager');
var MessageTypes = require('../common/messages/MessageTypes');
var Game = (function () {
    function Game(viewDiv) {
        this.stage = null;
        this.renderer = null;
        this.viewDiv = null;
        this.viewWidth = 500;
        this.viewHeight = 500;
        this.loginManager = new LoginManager_1.default();
        this._volatileGraphics = new PIXI.Graphics();
        this._documentResized = true;
        this.onTextureWorkerGetTexture = function (requestKey, texture) {
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
        InputManager_1.default.instance.init("#viewDiv");
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
        if (message.type == MessageTypes.USER) {
            this.loginManager.onUserMessage(message);
        }
        else {
            console.log("Received unhandled message from server:" + message.serialize());
        }
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
    Game.instance = null;
    Game.useDebugGraphics = true;
    return Game;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Game;

},{"../common/messages/MessageTypes":24,"./Connection":1,"./LoginManager":3,"./interface/AttachInfo":4,"./interface/InputManager":6,"./interface/InterfaceElement":7,"./interface/TextElement":9,"./interface/prefabs/MainMenu":11,"./sound/SoundAssets":13,"./sound/SoundManager":14,"./textures/TextureLoader":16,"./textures/TextureWorker":17,"./util/Log":19}],3:[function(require,module,exports){
"use strict";
var Util = require('../common/Util');
var MessageTypes = require('../common/messages/MessageTypes');
var Game_1 = require('./Game');
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
            }
            else {
                console.log("Failed to create user: " + msg.failReason);
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

},{"../common/Util":21,"../common/messages/MessageTypes":24,"./Game":2}],4:[function(require,module,exports){
"use strict";
var Vector2D_1 = require('../../common/Vector2D');
var AttachInfo = (function () {
    function AttachInfo(from, to, offset) {
        this.from = from;
        this.to = to;
        this.offset = offset;
    }
    AttachInfo.prototype.clone = function () {
        return new AttachInfo(this.from.clone(), this.to.clone(), this.offset.clone());
    };
    AttachInfo.TLtoTL = new AttachInfo(new Vector2D_1.default(0, 0), new Vector2D_1.default(0, 0), new Vector2D_1.default(0, 0));
    AttachInfo.TRtoTR = new AttachInfo(new Vector2D_1.default(1, 0), new Vector2D_1.default(1, 0), new Vector2D_1.default(0, 0));
    AttachInfo.BLtoBL = new AttachInfo(new Vector2D_1.default(0, 1), new Vector2D_1.default(0, 1), new Vector2D_1.default(0, 0));
    AttachInfo.BRtoBR = new AttachInfo(new Vector2D_1.default(1, 1), new Vector2D_1.default(1, 1), new Vector2D_1.default(0, 0));
    AttachInfo.Center = new AttachInfo(new Vector2D_1.default(0.5, 0.5), new Vector2D_1.default(0.5, 0.5), new Vector2D_1.default(0, 0));
    AttachInfo.TopCenter = new AttachInfo(new Vector2D_1.default(0.5, 0), new Vector2D_1.default(0.5, 0), new Vector2D_1.default(0, 0));
    AttachInfo.BottomCenter = new AttachInfo(new Vector2D_1.default(0.5, 1), new Vector2D_1.default(0.5, 1), new Vector2D_1.default(0, 0));
    AttachInfo.RightCenter = new AttachInfo(new Vector2D_1.default(1, 0.5), new Vector2D_1.default(1, 0.5), new Vector2D_1.default(0, 0));
    AttachInfo.LeftCenter = new AttachInfo(new Vector2D_1.default(0, 0.5), new Vector2D_1.default(0, 0.5), new Vector2D_1.default(0, 0));
    return AttachInfo;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AttachInfo;

},{"../../common/Vector2D":22}],5:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var InterfaceElement_1 = require('./InterfaceElement');
var ElementList = (function (_super) {
    __extends(ElementList, _super);
    function ElementList(width, orientation, padding, align) {
        if (orientation === void 0) { orientation = ElementList.VERTICAL; }
        if (padding === void 0) { padding = 5; }
        if (align === void 0) { align = ElementList.LEFT; }
        _super.call(this);
        this._childBounds = [];
        this._debugColor = 0xffff00;
        this._orientation = orientation;
        this._padding = padding;
        this._alignment = align;
        this._className = "ElementList";
        if (orientation == ElementList.VERTICAL) {
            this._width = width;
        }
        else {
            this._height = width;
        }
    }
    ElementList.prototype.addChild = function (child, redoLayout) {
        if (redoLayout === void 0) { redoLayout = true; }
        _super.prototype.addChild.call(this, child);
        this._childBounds.push(0);
        if (redoLayout) {
            this.redoLayout(child);
        }
    };
    ElementList.prototype.addChildAt = function (child, index, redoLayout) {
        if (redoLayout === void 0) { redoLayout = true; }
        _super.prototype.addChildAt.call(this, child, index);
        this._childBounds.push(0);
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
                offset += child.height + this._padding;
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
                offset += child.width + this._padding;
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
        this.onResize(false);
    };
    ElementList.HORIZONTAL = 0;
    ElementList.VERTICAL = 1;
    ElementList.NONE = -1;
    ElementList.LEFT = 0;
    ElementList.TOP = ElementList.LEFT;
    ElementList.RIGHT = 1;
    ElementList.BOTTOM = ElementList.RIGHT;
    ElementList.CENTRE = 2;
    return ElementList;
}(InterfaceElement_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ElementList;

},{"./InterfaceElement":7}],6:[function(require,module,exports){
"use strict";
var Vector2D_1 = require('../../common/Vector2D');
var Game_1 = require('../Game');
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
        this._onMouseDown = function (e) {
            var coords = _this.getMouseCoords(e, true);
            var element = Game_1.default.instance.interfaceRoot.getElementAtPoint(coords);
            switch (e.which) {
                case 1:
                    _this._leftMouseDownCoords = coords;
                    _this._leftMouseDownElement = element;
                    if (element) {
                        _this.focus(element);
                        if (element.onMouseDown)
                            element.onMouseDown(coords);
                    }
                    break;
                case 2:
                    break;
                case 3:
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
                    if (element) {
                        if (element.onMouseUp)
                            element.onMouseUp(coords);
                        if (element.onClick && element == _this._leftMouseDownElement)
                            element.onClick(coords);
                    }
                    _this._leftMouseDownCoords = null;
                    _this._leftMouseDownElement = null;
                    break;
                case 2:
                    break;
                case 3:
                    break;
                default:
                    console.warn("InputManager: mouse input with which=" + e.which + "?");
            }
        };
        this._onMouseMove = function (e) {
            var coords = _this.getMouseCoords(e, true);
            var element = Game_1.default.instance.interfaceRoot.getElementAtPoint(coords);
            if (_this.leftMouseDown && coords.distanceTo(_this._leftMouseDownCoords) > _this.dragThreshold)
                _this.beginDrag();
            if (_this._hoverElement && _this._hoverElement != element && _this._hoverElement.onHoverEnd) {
                _this._hoverElement.onHoverEnd(coords);
            }
            _this._hoverElement = element;
        };
        this._onMouseScroll = function (e) {
        };
        this._onMouseLeave = function (e) {
            _this._leftMouseDownCoords = null;
            _this._leftMouseDownElement = null;
        };
        this._onKeyDown = function (e) {
            if (_this._focusElement && _this._focusElement.onKeyDown) {
                _this._focusElement.onKeyDown(String.fromCharCode(e.which));
            }
        };
        this._onKeyUp = function (e) {
            if (_this._focusElement && _this._focusElement.onKeyUp) {
                _this._focusElement.onKeyUp(String.fromCharCode(e.which));
            }
        };
        this._onKeyPress = function (e) {
            if (_this._focusElement && _this._focusElement.onKeyPress) {
                _this._focusElement.onKeyPress(String.fromCharCode(e.which));
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
        this._div.keydown(this._onKeyDown);
        this._div.contextmenu(function (e) {
            e.stopPropagation();
            return false;
        });
    };
    InputManager.prototype.focus = function (element) {
        if (element != this._focusElement) {
            if (this._focusElement && this._focusElement.onUnfocus) {
                this._focusElement.onUnfocus();
            }
            if (element) {
                this._focusElement = element;
                if (element.onFocus) {
                    element.onFocus();
                }
            }
        }
    };
    InputManager.prototype.beginDrag = function () {
    };
    InputManager.prototype.getMouseCoords = function (e, set) {
        if (set === void 0) { set = false; }
        var offset = this._div.offset();
        var coords = new Vector2D_1.default(e.pageX - offset.left, e.pageY - offset.top);
        if (set)
            this._mouseCoords = coords;
        return coords;
    };
    InputManager._instance = null;
    return InputManager;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InputManager;

},{"../../common/Vector2D":22,"../Game":2}],7:[function(require,module,exports){
"use strict";
var Vector2D_1 = require('../../common/Vector2D');
var InputManager_1 = require('./InputManager');
var Game_1 = require('../Game');
var InterfaceElement = (function () {
    function InterfaceElement() {
        this.id = "";
        this.name = "";
        this.clickable = false;
        this.draggable = false;
        this.useOwnBounds = true;
        this.dragElement = null;
        this.maskSprite = null;
        this._displayObject = new PIXI.Container();
        this._parent = null;
        this._children = [];
        this._position = new Vector2D_1.default(0, 0);
        this._width = 0;
        this._height = 0;
        this._attach = null;
        this._resize = null;
        this._className = "InterfaceElement";
        this._debugColor = 0x0000ff;
    }
    Object.defineProperty(InterfaceElement.prototype, "x", {
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
        get: function () { return this._position.clone(); },
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
    InterfaceElement.prototype.getElementAtPoint = function (point) {
        var element = null;
        var checkChildren = this.isRoot;
        if (!checkChildren) {
            var bounds;
            if (this.useOwnBounds) {
                var pos = this.getGlobalPosition();
                bounds = new PIXI.Rectangle(pos.x, pos.y, this._width, this._height);
            }
            else {
                bounds = this._displayObject.getBounds();
            }
            checkChildren = bounds.contains(point.x, point.y);
        }
        if (checkChildren) {
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
            return this;
        return this.getElementByFunction(function (e2) {
            return e2 == e;
        });
    };
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
    InterfaceElement.prototype.addToContainer = function (container) {
        container.addChild(this._displayObject);
    };
    InterfaceElement.prototype.addChild = function (child) {
        this._children.push(child);
        this._displayObject.addChild(child._displayObject);
        child._parent = this;
    };
    InterfaceElement.prototype.addChildAt = function (child, index) {
        if (index === void 0) { index = -1; }
        if (index < 0 || index > this._children.length) {
            this.addChild(child);
            return;
        }
        this._children.splice(index, 0, child);
        this._displayObject.addChildAt(child._displayObject, index);
    };
    InterfaceElement.prototype.removeChild = function (child, recurse) {
        if (recurse === void 0) { recurse = false; }
        this._children.splice(this._children.indexOf(child), 1);
        this._displayObject.removeChild(child._displayObject);
        child._parent = null;
        child.detachFromParent();
        child.disableResizeToParent();
        if (recurse) {
            while (child._children.length > 0) {
                child.removeChild(child._children[child._children.length - 1], true);
            }
        }
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
            var thisGlobal = this.getGlobalPosition();
            var otherGlobal = other.getGlobalPosition();
            thisGlobal.sub(this._position);
            otherGlobal.sub(other._position);
            var globalDiff = otherGlobal;
            globalDiff.sub(thisGlobal);
            this._position.add(globalDiff);
        }
        this.position = this._position;
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
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InterfaceElement;

},{"../../common/Vector2D":22,"../Game":2,"./InputManager":6}],8:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var InterfaceElement_1 = require('./InterfaceElement');
var TextureGenerator = require('../textures/TextureGenerator');
var Panel = (function (_super) {
    __extends(Panel, _super);
    function Panel(width, height, style) {
        _super.call(this);
        this._debugColor = 0x00ff00;
        this._needRedraw = true;
        this._className = "Panel";
        this._width = width;
        this._height = height;
        this._style = style;
        this._texture = null;
        this.clickable = true;
        this.draw();
        this._sprite = new PIXI.Sprite(this._texture);
        this._displayObject.addChild(this._sprite);
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
            switch (this._style) {
                case Panel.BASICBAR:
                    this._texture = TextureGenerator.simpleRectangle(this._texture, this._width, this._height, 0x999999);
                    break;
                default:
                    this._texture = TextureGenerator.simpleRectangle(this._texture, this._width, this._height, 0x333333, 2, 0x999999);
            }
        }
    };
    Panel.BASIC = 0;
    Panel.BASICBAR = 1;
    return Panel;
}(InterfaceElement_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Panel;

},{"../textures/TextureGenerator":15,"./InterfaceElement":7}],9:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var InterfaceElement_1 = require('./InterfaceElement');
var TextElement = (function (_super) {
    __extends(TextElement, _super);
    function TextElement(text, style) {
        if (text === void 0) { text = ""; }
        if (style === void 0) { style = TextElement.basicText; }
        _super.call(this);
        this._debugColor = 0xff0000;
        this._className = "TextElement";
        this._pixiText = new PIXI.Text(text, style);
        this._displayObject.addChild(this._pixiText);
        this.resizeToPixiText();
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
    TextElement.prototype.setPixiText = function () {
        this._pixiText.text = this._text;
        this.resizeToPixiText();
    };
    TextElement.prototype.resizeToPixiText = function () {
        this.resize(this._pixiText.width, this._pixiText.height);
    };
    TextElement.basicText = new PIXI.TextStyle({ fontSize: 14, fontFamily: 'Open Sans', fill: 0xffffff, align: 'left' });
    TextElement.bigText = new PIXI.TextStyle({ fontSize: 32, fontFamily: 'Open Sans', fill: 0xffffff, align: 'left' });
    TextElement.veryBigText = new PIXI.TextStyle({ fontSize: 48, fontFamily: 'Open Sans', fill: 0xffffff, align: 'left' });
    return TextElement;
}(InterfaceElement_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextElement;

},{"./InterfaceElement":7}],10:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var InterfaceElement_1 = require('../InterfaceElement');
var TextElement_1 = require('../TextElement');
var AttachInfo_1 = require('../AttachInfo');
var Panel_1 = require('../Panel');
var ElementList_1 = require('../ElementList');
var LoginMenu = (function (_super) {
    __extends(LoginMenu, _super);
    function LoginMenu() {
        _super.call(this);
        this._bg = new Panel_1.default(350, 500, Panel_1.default.BASICBAR);
        this.addChild(this._bg);
        this._list = new ElementList_1.default(350, ElementList_1.default.VERTICAL, 5, ElementList_1.default.CENTRE);
        this.addChild(this._list);
        var strings = ['One way', 'or another', "I'm gonna find ya"];
        for (var i = 0; i < strings.length; i++) {
            var text = new TextElement_1.default(strings[i], TextElement_1.default.bigText);
            this._list.addChild(text);
        }
        this._width = this._bg.width;
        this._height = this._bg.height;
        this._bg.attachToParent(AttachInfo_1.default.Center);
        this._list.attachToParent(AttachInfo_1.default.Center);
    }
    return LoginMenu;
}(InterfaceElement_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LoginMenu;

},{"../AttachInfo":4,"../ElementList":5,"../InterfaceElement":7,"../Panel":8,"../TextElement":9}],11:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var InterfaceElement_1 = require('../InterfaceElement');
var AttachInfo_1 = require('../AttachInfo');
var LoginMenu_1 = require('./LoginMenu');
var Log = require('../../util/Log');
var MainMenu = (function (_super) {
    __extends(MainMenu, _super);
    function MainMenu() {
        _super.call(this);
        this._currentMenuName = "";
        this._currentMenu = null;
        this._className = "MainMenu";
        this._loginMenu = new LoginMenu_1.default();
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

},{"../../util/Log":19,"../AttachInfo":4,"../InterfaceElement":7,"./LoginMenu":10}],12:[function(require,module,exports){
"use strict";
var Game_1 = require('./Game');
var viewDiv = document.getElementById("viewDiv");
var game = new Game_1.default(viewDiv);
game.init();

},{"./Game":2}],13:[function(require,module,exports){
"use strict";
exports.mainMenuMusic = [
    ["music/fortress", "sound/music/fortress.ogg"]
];
exports.interfaceSounds = [
    ["ui/click", "sound/ui/click.ogg"],
    ["ui/rollover", "sound/ui/rollover.ogg"],
    ["ui/nope", "sound/ui/nope.ogg"]
];

},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
"use strict";
var Game_1 = require('../Game');
function simpleRectangle(target, width, height, color, borderWidth, borderColor) {
    if (borderWidth === void 0) { borderWidth = 0; }
    if (borderColor === void 0) { borderColor = 0; }
    if (!target)
        target = PIXI.RenderTexture.create(width, height);
    var g = Game_1.default.instance.volatileGraphics;
    g.lineStyle(borderWidth, borderColor, 1);
    g.beginFill(color, 1);
    g.drawRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);
    g.endFill();
    Game_1.default.instance.renderer.render(g, target);
    return target;
}
exports.simpleRectangle = simpleRectangle;

},{"../Game":2}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
"use strict";
var ColorUtil = require('../util/ColorUtil');
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
            var imageData = new ImageData(dataArray, width, height);
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
    TextureWorker.prototype.textureFromArrayEdge = function (dataArray, width, height) {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        var x = 0;
        var y = 0;
        var runStart = -1;
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
                    drawX = runStart;
                    drawW = x - runStart + 1;
                    runStart = -1;
                }
                else {
                    drawX = x;
                    drawW = 1;
                }
                if (dataArray[i + 3] > 0) {
                    context.fillStyle = ColorUtil.rgbString(dataArray[i], dataArray[i + 1], dataArray[i + 2]);
                    context.fillRect(drawX, y, drawW, 1);
                }
            }
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
    TextureWorker._supportsImageDataConstructor = -1;
    return TextureWorker;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextureWorker;

},{"../util/ColorUtil":18}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
"use strict";
var types = {};
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
        if (this.enabled)
            console.log("%c" + this.prefix + msg, "background:" + this.bgColor + "; color:" + this.textColor + ";");
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

},{}],20:[function(require,module,exports){
"use strict";
var IDPool = (function () {
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
    IDPool.prototype.relinquishID = function (id) {
        if (this._unused.length < this._maxUnused)
            this._unused.push(id);
    };
    IDPool.prototype._createID = function () {
        var id = '';
        for (var i = 0; i < this._indeces.length; i++) {
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
    IDPool._defaultAlphabet = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ~`!@#$%^&*()-_=+[]{}|;:<>,.?/';
    IDPool._alphanumeric = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return IDPool;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = IDPool;

},{}],21:[function(require,module,exports){
"use strict";
function noop() { }
exports.noop = noop;
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
function stripBraces(s) {
    return s.substr(1, s.length - 1);
}
exports.stripBraces = stripBraces;
function clamp(num, min, max) {
    if (num > max)
        return max;
    if (num < min)
        return min;
    return num;
}
exports.clamp = clamp;
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
function isArray(x) {
    return Array.isArray(x);
}
exports.isArray = isArray;
function isObject(x, allowNull) {
    if (allowNull === void 0) { allowNull = false; }
    return (typeof x === 'object' && !isArray(x) && (x != null || allowNull));
}
exports.isObject = isObject;
function isCoordinate(x) {
    return (isArray(x) && x.length == 2 && isNumber(x[0]) && isNumber(x[1]));
}
exports.isCoordinate = isCoordinate;

},{}],22:[function(require,module,exports){
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

},{}],23:[function(require,module,exports){
"use strict";
var IDPool_1 = require('../IDPool');
var Vector2D_1 = require('../Vector2D');
var Util = require('../Util');
var Message = (function () {
    function Message(type) {
        this.type = type;
    }
    Message.prototype.serialize = function () {
        return this.type.toString();
    };
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
    };
    Message.fromArgs = function (args) {
        return null;
    };
    Message.serializeParams = function (obj) {
        var s = JSON.stringify(Message.abbreviate(obj));
        return s.substring(1, s.length - 1);
    };
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
                val = new Vector2D_1.default(val.x, val.y);
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
    Message._abbreviations = null;
    Message._expansions = null;
    return Message;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Message;
var MessageTypes = require('./MessageTypes');

},{"../IDPool":20,"../Util":21,"../Vector2D":22,"./MessageTypes":24}],24:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Message_1 = require('./Message');
var Util = require('../Util');
exports.PING = 0;
exports.USER = 10;
exports.CRYPTO = 11;
exports.GET_REQUEST = 12;
exports.GET_RESPONSE = 13;
exports.GAME_STATUS = 14;
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
        _super.call(this, exports.PING);
    }
    Ping.fromArgs = function (args) {
        return Ping._instance;
    };
    Ping.prototype.serialize = function () {
        return "0[]";
    };
    Ping._instance = new Ping();
    return Ping;
}(Message_1.default));
exports.Ping = Ping;
classesByType[exports.PING] = Ping;
var UserMessage = (function (_super) {
    __extends(UserMessage, _super);
    function UserMessage(action, params) {
        _super.call(this, exports.USER);
        this.action = action;
        this.params = params;
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
        _super.call(this, exports.CRYPTO);
        this.action = action;
        this.ciphertext = ciphertext;
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
var GetRequest = (function (_super) {
    __extends(GetRequest, _super);
    function GetRequest(subject, requestKey, params) {
        _super.call(this, exports.GET_REQUEST);
        this.subject = subject;
        this.requestKey = requestKey;
        this.params = params;
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
        _super.call(this, exports.GET_RESPONSE);
        this.requestKey = requestKey;
        this.response = response;
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
var GameStatus = (function (_super) {
    __extends(GameStatus, _super);
    function GameStatus(gameId, frame, frameInterval) {
        _super.call(this, exports.GAME_STATUS);
        this.gameId = gameId;
        this.frame = frame;
        this.frameInterval = frameInterval;
    }
    GameStatus.fromArgs = function (args) {
        if (Util.isInt(args[0])
            && Util.isInt(args[1])
            && Util.isNumber(args[2])) {
            return new GameStatus(args[0], args[1], args[2]);
        }
        return null;
    };
    GameStatus.prototype.serialize = function () {
        var s = _super.prototype.serialize.call(this);
        s += JSON.stringify([this.gameId, this.frame, this.frameInterval]);
        return s;
    };
    return GameStatus;
}(Message_1.default));
exports.GameStatus = GameStatus;
classesByType[exports.GAME_STATUS] = GameStatus;

},{"../Util":21,"./Message":23}]},{},[12]);
