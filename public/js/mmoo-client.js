(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
const Log = require("./util/Log"); //import Log = require('./util/Log');
const Message_1 = require("../common/messages/Message");
const MessageTypes = require("../common/messages/MessageTypes");
class Connection {
    constructor(hostName, port) {
        this.hostName = hostName;
        this.port = port;
        this.connString = "";
        this.socket = null;
        this.pendingGetCallbacks = {};
        this.onSocketConnect = (e) => {
            Log.log("conn", "Connected to " + this.connString);
            this.onConnect();
        };
        this.onSocketDisconnect = (e) => {
            Log.log("conn", "Disconnected from " + this.connString);
        };
        this.onSocketError = (e) => {
            Log.log("error", "CONNECTION " + e.toString());
            this.onError(e);
        };
        this.onSocketMessage = (message) => {
            Log.log("connRecv", message.data);
            var parsedMessage = Message_1.default.parse(message.data);
            if (parsedMessage) {
                if (parsedMessage.type == MessageTypes.GET_RESPONSE) {
                    this.onGetResponse(parsedMessage);
                }
                else {
                    this.onMessage(parsedMessage);
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
    connect() {
        if (this.socket != null) {
            this.disconnect("reconnecting");
        }
        this.socket = new WebSocket(this.connString);
        this.socket.addEventListener("open", this.onSocketConnect);
        this.socket.addEventListener("close", this.onSocketDisconnect);
        this.socket.addEventListener("message", this.onSocketMessage);
        this.socket.addEventListener("error", this.onSocketError);
    }
    disconnect(reason = "???") {
        this.socket.close(1000, reason);
        this.socket = null;
    }
    send(msg) {
        try {
            this.socket.send(msg);
        }
        catch (err) {
            Log.log("error", err.toString());
        }
    }
    sendMessage(msg) {
        this.send(msg.serialize());
    }
    getRequest(subject, params, callback) {
        var request = new MessageTypes.GetRequest(subject, Connection.getRequestId, params);
        Connection.getRequestId += 1;
        this.pendingGetCallbacks[request.requestKey] = callback;
        this.sendMessage(request);
    }
    onGetResponse(response) {
        var callback = this.pendingGetCallbacks[response.requestKey];
        if (callback) {
            delete this.pendingGetCallbacks[response.requestKey];
            callback(response.response);
        }
    }
}
Connection.getRequestId = 0;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Connection;

},{"../common/messages/Message":25,"../common/messages/MessageTypes":26,"./util/Log":21}],2:[function(require,module,exports){
/// <reference path="../declarations/pixi.js.d.ts"/>
/// <reference path="../declarations/createjs/soundjs.d.ts"/>
"use strict";
//import Log = require('./util/Log');
const Log = require("./util/Log");
const Connection_1 = require("./Connection");
const LoginManager_1 = require("./LoginManager");
const TextureLoader_1 = require("./textures/TextureLoader");
const TextureWorker_1 = require("./textures/TextureWorker");
const SoundManager_1 = require("./sound/SoundManager");
//import SoundAssets = require('./sound/SoundAssets');
const SoundAssets = require("./sound/SoundAssets");
const InterfaceElement_1 = require("./interface/InterfaceElement");
const TextElement_1 = require("./interface/TextElement");
const AttachInfo_1 = require("./interface/AttachInfo");
const MainMenu_1 = require("./interface/prefabs/MainMenu");
const InputManager_1 = require("./interface/InputManager");
const GameView_1 = require("./GameView");
const MessageTypes = require("../common/messages/MessageTypes");
class Game {
    constructor(viewDiv) {
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
        this.onTextureWorkerGetTexture = (requestKey, texture) => {
            /*var sprite:PIXI.Sprite = new PIXI.Sprite(texture);
            sprite.scale.x = 5;
            sprite.scale.y = 5;
            sprite.position.x = 100;
            sprite.position.y = 100;
            this.stage.addChild(sprite);*/
        };
        this.viewDiv = viewDiv;
    }
    get volatileGraphics() { this._volatileGraphics.clear(); return this._volatileGraphics; }
    init() {
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
        this.renderer = PIXI.autoDetectRenderer(500, 500, { backgroundColor: 0xaaaaff });
        this.renderer.autoResize = true; //TS PIXI doesn't like this as an option
        this.viewDiv.appendChild(this.renderer.view);
        //Worker
        this.textureWorker = new TextureWorker_1.default('js/mmoo-worker.js');
        //Listen for resize
        window.addEventListener('resize', () => this._documentResized = true);
        //Add root UI element
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
    }
    //actually seeing the game world will be relegated to ENTERING the game
    //joining a game lets you manager characters before entering
    onJoinGame(gameId) {
        this.joinedGameId = gameId;
        //this.gameView.init(currentFrame, frameInterval);
    }
    render() {
        if (this._documentResized) {
            this._documentResized = false;
            this.resize();
        }
        if (Game.useDebugGraphics)
            this.debugGraphics.clear();
        this.interfaceRoot.draw();
        var renderer = this.renderer;
        renderer.render(this.stage);
        requestAnimationFrame(() => this.render());
    }
    resize() {
        this.viewWidth = this.viewDiv.clientWidth;
        this.viewHeight = this.viewDiv.clientHeight;
        this.renderer.resize(this.viewWidth, this.viewHeight);
        this.interfaceRoot.resize(this.viewWidth, this.viewHeight);
    }
    connect() {
        var loadingText = new TextElement_1.default("Connecting...", TextElement_1.default.veryBigText);
        loadingText.id = "loadingText";
        this.interfaceRoot.addChild(loadingText);
        loadingText.attachToParent(AttachInfo_1.default.Center);
        this.connection = new Connection_1.default("localhost", 9191);
        this.connection.onConnect = () => this.onConnect();
        this.connection.onMessage = (msg) => this.onConnectionMessage(msg);
        this.connection.onError = (e) => this.onConnectionError(e);
        this.connection.onDisconnect = () => this.onDisconnect();
        this.connection.connect();
    }
    onConnect() {
        this.loadTextures();
    }
    onConnectionMessage(message) {
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
    }
    onGameStatusMessage(message) {
    }
    onConnectionError(e) {
        alert("Connection error! Is the server down?");
    }
    onDisconnect() {
        alert("Disconnected from server!");
    }
    loadTextures() {
        Log.log("debug", "=== LOAD TEXTURES ===");
        var loadingText = this.interfaceRoot.getElementById("loadingText");
        loadingText.text = "Loading textures...";
        this.textureLoader = new TextureLoader_1.default("textures.png", "textureMap.json", () => this.onTexturesLoaded());
    }
    onTexturesLoaded() {
        this.sendGraphicsToWorker();
        this.loadSounds();
        //this.textureWorker.getTexture('parts/helmet', {from:[0x555555], to:[0xff0000]}, this.onTextureWorkerGetTexture);
    }
    sendGraphicsToWorker() {
        var data = this.textureLoader.getData();
        this.textureWorker.putTextures(data);
    }
    loadSounds() {
        var list = SoundAssets.interfaceSounds.concat(SoundAssets.mainMenuMusic);
        SoundManager_1.default.instance.load("initial", list, (which) => this.onSoundsLoaded(which), (which, progress) => this.onSoundsLoadedProgress(which, progress));
        var loadingText = this.interfaceRoot.getElementById("loadingText");
        loadingText.text = "Loading sounds... (0%)";
    }
    onSoundsLoaded(which) {
        if (which == "initial") {
            //SoundManager.instance.playMusic("music/fortress");
            this.initMainMenu();
        }
    }
    onSoundsLoadedProgress(which, progress) {
        if (which == "initial") {
            var loadingText = this.interfaceRoot.getElementById("loadingText");
            loadingText.text = "Loading sounds... (" + Math.round(progress * 100) + "%)";
        }
    }
    initMainMenu() {
        var loadingText = this.interfaceRoot.getElementById("loadingText");
        this.interfaceRoot.removeChild(loadingText);
        var mainMenu = new MainMenu_1.default();
        this.interfaceRoot.addChild(mainMenu);
        mainMenu.attachToParent(AttachInfo_1.default.Center);
        mainMenu.showMenu("login");
        this.loginManager.login("testy", "abc123");
    }
}
Game.instance = null;
Game.useDebugGraphics = true;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Game;

},{"../common/messages/MessageTypes":26,"./Connection":1,"./GameView":3,"./LoginManager":4,"./interface/AttachInfo":5,"./interface/InputManager":7,"./interface/InterfaceElement":8,"./interface/TextElement":10,"./interface/prefabs/MainMenu":13,"./sound/SoundAssets":15,"./sound/SoundManager":16,"./textures/TextureLoader":18,"./textures/TextureWorker":19,"./util/Log":21}],3:[function(require,module,exports){
"use strict";
class GameView {
    constructor() {
        this._frame = -1;
        this._frameInterval = 10; //ms
        this._firstFrameNumber = -1;
    }
    init(currentFrame, frameInterval) {
        this._frame = currentFrame;
        this._firstFrameNumber = currentFrame;
        this._frameInterval = frameInterval;
        this._firstFrameTime = Date.now();
    }
    update() {
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GameView;

},{}],4:[function(require,module,exports){
/// <reference path="../declarations/jquery.d.ts"/>
"use strict";
const Util = require("../common/Util");
const MessageTypes = require("../common/messages/MessageTypes");
const Game_1 = require("./Game");
class LoginManager {
    constructor() {
        this.userId = -1;
        this.userName = "Naebdy!";
    }
    get userString() { return "User " + this.userId + " (" + this.userName + ")"; }
    login(name, pass) {
        var msg = new MessageTypes.UserMessage("login", {
            name: name,
            pass: pass
        });
        Game_1.default.instance.connection.sendMessage(msg);
    }
    createUser(name, pass, loginOnSuccess = false) {
        var msg = new MessageTypes.UserMessage("createUser", {
            name: name,
            pass: pass
        });
        Game_1.default.instance.connection.sendMessage(msg);
    }
    onUserMessage(msg) {
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
    }
    onLogin() {
        console.log("Logged in as " + this.userString);
        Game_1.default.instance.connection.getRequest("games", {}, function (response) {
            if (response && Util.isArray(response)) {
                console.log("Current games:\n" + JSON.stringify(response));
            }
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LoginManager;

},{"../common/Util":23,"../common/messages/MessageTypes":26,"./Game":2}],5:[function(require,module,exports){
"use strict";
const Vector2D_1 = require("../../common/Vector2D");
class AttachInfo {
    constructor(from, to, offset) {
        this.from = from;
        this.to = to;
        this.offset = offset;
    }
    clone() {
        return new AttachInfo(this.from.clone(), this.to.clone(), this.offset.clone());
    }
}
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

},{"../../common/Vector2D":24}],6:[function(require,module,exports){
"use strict";
/// <reference path="../../declarations/pixi.js.d.ts"/>
const InterfaceElement_1 = require("./InterfaceElement");
class ElementList extends InterfaceElement_1.default {
    constructor(width, orientation = ElementList.VERTICAL, padding = 5, align = ElementList.LEFT) {
        super();
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
    addChild(child, redoLayout = true) {
        super.addChild(child);
        this._childBounds.push(0);
        if (redoLayout) {
            this.redoLayout(child);
        }
    }
    addChildAt(child, index, redoLayout = true) {
        super.addChildAt(child, index);
        this._childBounds.push(0);
        if (redoLayout) {
            this.redoLayout(child);
        }
    }
    removeChild(child) {
        var index = this._children.indexOf(child);
        super.removeChild(child);
        if (index != -1 && index < this._children.length) {
            this._childBounds.pop();
            this.redoLayout(this._children[index]);
        }
    }
    redoLayout(fromChild = null) {
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
        this.onResize(false); //don't tell children that this has resized
    }
}
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

},{"./InterfaceElement":8}],7:[function(require,module,exports){
"use strict";
/// <reference path="../../declarations/jquery.d.ts"/>
const Vector2D_1 = require("../../common/Vector2D");
const Game_1 = require("../Game");
/**
 * Wrangles all them silly events and suchlike.
 * Doing anything in the game proper should be relegated to a different class (probably?)
 *
 * Singleton!
 */
class InputManager {
    constructor() {
        this.dragThreshold = 8;
        this._initialized = false;
        this._mouseCoords = new Vector2D_1.default(0, 0);
        this._leftMouseDownCoords = null;
        this._leftMouseDownElement = null;
        this._hoverElement = null;
        this._focusElement = null;
        this._onMouseDown = (e) => {
            var coords = this.getMouseCoords(e, true);
            var element = Game_1.default.instance.interfaceRoot.getElementAtPoint(coords);
            switch (e.which) {
                case 1:
                    //left
                    this._leftMouseDownCoords = coords;
                    this._leftMouseDownElement = element;
                    if (element) {
                        this.focus(element);
                        if (element.onMouseDown)
                            element.onMouseDown(coords);
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
        this._onMouseUp = (e) => {
            var coords = this.getMouseCoords(e, true);
            var element = Game_1.default.instance.interfaceRoot.getElementAtPoint(coords);
            switch (e.which) {
                case 1:
                    //left
                    if (element) {
                        if (element.onMouseUp)
                            element.onMouseUp(coords);
                        if (element.onClick && element == this._leftMouseDownElement)
                            element.onClick(coords);
                    }
                    this._leftMouseDownCoords = null;
                    this._leftMouseDownElement = null;
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
        this._onMouseMove = (e) => {
            var coords = this.getMouseCoords(e, true);
            var element = Game_1.default.instance.interfaceRoot.getElementAtPoint(coords);
            if (this.leftMouseDown && coords.distanceTo(this._leftMouseDownCoords) > this.dragThreshold)
                this.beginDrag();
            //TODO: check whether we're about to drag it?
            if (this._hoverElement && this._hoverElement != element && this._hoverElement.onHoverEnd) {
                this._hoverElement.onHoverEnd(coords);
            }
            //TODO: update dragged element
            this._hoverElement = element;
        };
        this._onMouseScroll = (e) => {
        };
        this._onMouseLeave = (e) => {
            this._leftMouseDownCoords = null;
            this._leftMouseDownElement = null;
        };
        this._onKeyDown = (e) => {
            var key = this.getKeyString(e);
            if (this._focusElement && this._focusElement.onKeyDown) {
                this._focusElement.onKeyDown(key);
            }
            if (preventedKeys.indexOf(e.which) != -1) {
                e.preventDefault();
            }
        };
        this._onKeyPress = (e) => {
            var key = this.getKeyString(e);
            if (this._focusElement && this._focusElement.onKeyPress) {
                this._focusElement.onKeyPress(key);
            }
            if (preventedKeys.indexOf(e.which) != -1) {
                e.preventDefault();
            }
        };
        if (InputManager._instance) {
            console.error("InputManager: hey, this is a singleton!");
        }
    }
    static get instance() {
        if (InputManager._instance)
            return InputManager._instance;
        InputManager._instance = new InputManager();
        return InputManager._instance;
    }
    get leftMouseDown() { return this._leftMouseDownCoords != null; }
    get focusedElement() { return this._focusElement; }
    init(selector) {
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
        $(window).keypress(this._onKeyPress);
        //disable right click context menu
        this._div.contextmenu(function (e) {
            e.stopPropagation();
            return false;
        });
    }
    focus(element) {
        if (element != this._focusElement) {
            if (this._focusElement && this._focusElement.onUnfocus) {
                this._focusElement.onUnfocus();
            }
            if (element) {
                this._focusElement = element;
                if (element.onFocus) {
                    console.log("Focus " + element.fullName);
                    element.onFocus();
                }
            }
        }
    }
    beginDrag() {
    }
    getKeyString(e) {
        var name = keyNames[e.which.toString()];
        if (name)
            return name;
        return String.fromCharCode(e.which);
    }
    getMouseCoords(e, set = false) {
        var offset = this._div.offset();
        var coords = new Vector2D_1.default(e.pageX - offset.left, e.pageY - offset.top);
        if (set)
            this._mouseCoords = coords;
        return coords;
    }
}
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

},{"../../common/Vector2D":24,"../Game":2}],8:[function(require,module,exports){
"use strict";
/// <reference path="../../declarations/pixi.js.d.ts"/>
const Vector2D_1 = require("../../common/Vector2D");
const InputManager_1 = require("./InputManager");
const Game_1 = require("../Game");
/**
 * Base class for anything in the UI. Has a parent and can have children, like DOM elements.
 */
class InterfaceElement {
    constructor() {
        this.id = "";
        this.name = "";
        this.clickable = false;
        this.draggable = false;
        this.useOwnBounds = true; //instead of the container's bounds, use the rect defined by own x,y,width,height
        this.ignoreChildrenForClick = false; //don't click the kids, click me
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
    // === GET ===
    get x() { return this._position.x; }
    get y() { return this._position.y; }
    get position() { return this._position; }
    get width() { return this._width; }
    get height() { return this._height; }
    get displayObject() { return this._displayObject; }
    get children() { return this._children.slice(); }
    get fullName() {
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
    }
    get isRoot() { return this._parent == null && this._displayObject.parent != null; }
    get isFocused() { return InputManager_1.default.instance.focusedElement == this; }
    get visible() { return this._displayObject.visible; }
    //=== SET ===
    set position(pos) { this._position.set(pos); this.updateDisplayObjectPosition(); }
    set x(x) { this._position.x = x; this.updateDisplayObjectPosition(); }
    set y(y) { this._position.y = y; this.updateDisplayObjectPosition(); }
    set visible(v) { this._displayObject.visible = v; }
    getElementAtPoint(point) {
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
    }
    getElementById(id, maxChecks = 1000) {
        if (this.id == id)
            return this;
        return this.getElementByFunction(function (e) {
            return e.id == id;
        });
    }
    getElement(e) {
        if (this == e)
            return this; //derp
        return this.getElementByFunction(function (e2) {
            return e2 == e;
        });
    }
    //BFS, always call from the lowest known ancestor
    //Hey kid, don't make cyclical structures. I'm putting maxChecks here anyway, just in case.
    getElementByFunction(func, maxChecks = 500) {
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
    }
    draw() {
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
    }
    resize(width, height) {
        this._width = width;
        this._height = height;
        this.onResize();
    }
    resizeToFitChildren() {
        var w = 0;
        var h = 0;
        for (var child of this._children) {
            if (child.width > w)
                w = child.width;
            if (child.height > h)
                h = child.height;
        }
        this.resize(w, h);
    }
    //Used by Game to add the root element, shouldn't be used elsewhere
    addToContainer(container) {
        container.addChild(this._displayObject);
    }
    addChild(child) {
        this._children.push(child);
        this._displayObject.addChild(child._displayObject);
        child._parent = this;
    }
    addChildAt(child, index = -1) {
        if (index < 0 || index > this._children.length) {
            this.addChild(child);
            return;
        }
        this._children.splice(index, 0, child);
        this._displayObject.addChildAt(child._displayObject, index);
    }
    removeChild(child, recurse = false) {
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
    }
    removeSelf(recurse = true) {
        if (this._parent != null)
            this._parent.removeChild(this, recurse);
    }
    moveChildToTop(child) {
        this.removeChild(child);
        this.addChild(child);
    }
    attachToParent(info) {
        this._attach = info;
        this.positionRelativeTo(this._parent, info);
    }
    detachFromParent() {
        this._attach = null;
    }
    resizeToParent(info) {
        this._resize = info;
        this.onParentResize();
    }
    disableResizeToParent() {
        this._resize = null;
    }
    positionRelativeTo(other, info) {
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
    }
    getGlobalPosition() {
        var pos = this._position.clone();
        var parent = this._parent;
        while (parent != null) {
            pos.add(parent._position);
            parent = parent._parent;
        }
        return pos;
    }
    updateDisplayObjectPosition() {
        this._displayObject.position.set(Math.round(this._position.x), Math.round(this._position.y));
    }
    toNearestPixel() {
        this._position.round();
        this.updateDisplayObjectPosition();
    }
    onParentResize() {
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
    }
    onResize(notifyChildren = true) {
        if (this._attach)
            this.positionRelativeTo(this._parent, this._attach);
        if (notifyChildren) {
            var len = this._children.length;
            for (var i = 0; i < len; i++) {
                this._children[i].onParentResize();
            }
        }
    }
}
/**
 * Updated every frame by the root UI element.
 */
InterfaceElement.drawTime = 0;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InterfaceElement;

},{"../../common/Vector2D":24,"../Game":2,"./InputManager":7}],9:[function(require,module,exports){
"use strict";
/// <reference path="../../declarations/pixi.js.d.ts"/>
const InterfaceElement_1 = require("./InterfaceElement");
//import TextureGenerator = require('../textures/TextureGenerator');
const TextureGenerator = require("../textures/TextureGenerator");
class Panel extends InterfaceElement_1.default {
    constructor(width, height, style) {
        super();
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
    resize(width, height) {
        if (width != this._width || height != this._height)
            this._needRedraw = true;
        super.resize(width, height);
    }
    draw() {
        super.draw();
        if (this._needRedraw) {
            this._needRedraw = false;
            var hadTexture = false;
            if (this._texture) {
                hadTexture = true;
                this._texture.resize(this._width, this._height, true);
            }
            //style check!
            switch (this._style) {
                case Panel.BASICBAR:
                    this._texture = TextureGenerator.simpleRectangle(this._texture, this._width, this._height, 0x999999);
                    break;
                default:
                    this._texture = TextureGenerator.simpleRectangle(this._texture, this._width, this._height, 0x333333, 2, 0x999999);
            }
        }
    }
}
Panel.BASIC = 0;
Panel.BASICBAR = 1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Panel;

},{"../textures/TextureGenerator":17,"./InterfaceElement":8}],10:[function(require,module,exports){
"use strict";
/// <reference path="../../declarations/pixi.js.d.ts"/>
const InterfaceElement_1 = require("./InterfaceElement");
class TextElement extends InterfaceElement_1.default {
    constructor(text = "", style = TextElement.basicText) {
        super();
        this._debugColor = 0xff0000;
        this._className = "TextElement";
        this._pixiText = new PIXI.Text(text, style);
        this._displayObject.addChild(this._pixiText);
        this.resizeToPixiText();
    }
    get text() { return this._text; }
    set text(text) {
        this._text = text;
        this.setPixiText();
    }
    set style(style) {
        this._pixiText.style = style;
        this.resizeToPixiText();
    }
    //TODO: hidden text fields (*****)
    setPixiText() {
        this._pixiText.text = this._text;
        this.resizeToPixiText();
    }
    resizeToPixiText() {
        this.resize(this._pixiText.width, this._pixiText.height);
    }
}
TextElement.basicText = new PIXI.TextStyle({ fontSize: 14, fontFamily: 'Open Sans', fill: 0xffffff, align: 'left' });
TextElement.bigText = new PIXI.TextStyle({ fontSize: 32, fontFamily: 'Open Sans', fill: 0xffffff, align: 'left' });
TextElement.veryBigText = new PIXI.TextStyle({ fontSize: 48, fontFamily: 'Open Sans', fill: 0xffffff, align: 'left' });
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextElement;

},{"./InterfaceElement":8}],11:[function(require,module,exports){
/// <reference path="../../declarations/pixi.js.d.ts"/>
"use strict";
const Vector2D_1 = require("../../common/Vector2D");
const InterfaceElement_1 = require("./InterfaceElement");
const Panel_1 = require("./Panel");
const TextElement_1 = require("./TextElement");
const AttachInfo_1 = require("./AttachInfo");
class TextField extends InterfaceElement_1.default {
    /**
     * Allows the user to input text.
     * @param alphabet	Constrains input characters
     * @param validator	Checks validity of the whole string
     */
    constructor(width, height, textStyle, alphabet = null, validator = null) {
        super();
        this._text = "";
        this._blinkTime = -1;
        this._hidden = false;
        this._className = "TextField";
        this.resize(width, height);
        this._alphabet = alphabet;
        this._validator = validator;
        this.ignoreChildrenForClick = true;
        this._bg = new Panel_1.default(width, height, Panel_1.default.BASIC);
        this._textElement = new TextElement_1.default("", textStyle);
        this.addChild(this._bg);
        this._bg.addChild(this._textElement);
        //Offset the text slightly to allow for the border (Panel needs some improvement)
        var textAttach = AttachInfo_1.default.LeftCenter.clone();
        textAttach.offset.x = 4;
        this._textElement.attachToParent(textAttach);
        //Attach the cursor to the right of the text
        this._cursor = new TextElement_1.default("|", textStyle);
        this._textElement.addChild(this._cursor);
        textAttach = new AttachInfo_1.default(new Vector2D_1.default(0, 0.5), new Vector2D_1.default(1, 0.5), new Vector2D_1.default(0, 0));
        this._cursor.attachToParent(textAttach);
        this._cursor.visible = false;
        //Set up listeners
        this.onFocus = () => {
            this._onFocus();
        };
        this.onUnfocus = () => {
            this._onUnfocus();
        };
        this.onKeyPress = (s) => {
            this._onKeyPress(s);
        };
        this.onKeyDown = (s) => {
            if (s == "BACKSPACE") {
                this.deleteCharacter();
            }
        };
    }
    get hidden() { return this._hidden; }
    set hidden(val) { this._hidden = val; this.updateText(); }
    set text(text) {
        this._text = text;
        this.updateText();
    }
    draw() {
        super.draw();
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
    }
    _onFocus() {
        this._cursor.visible = true;
        this._blinkTime = InterfaceElement_1.default.drawTime;
    }
    _onUnfocus() {
        this._cursor.visible = false;
    }
    _onKeyPress(key) {
        if (key == "BACKSPACE") {
            this.deleteCharacter();
        }
        else if (this._alphabet && !this._alphabet.test(key)) {
            console.log("TextField: ignoring character '" + key + "'");
            return;
        }
        else {
            this._text += key;
            this.updateText();
        }
    }
    deleteCharacter() {
        if (this._text.length > 0) {
            this._text = this._text.substr(0, this._text.length - 1);
            this.updateText();
        }
    }
    updateText() {
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
    }
}
TextField.alphabets = {
    abc: /^[a-zA-Z]$/,
    abc123: /^[a-zA-Z0-9]$/
};
TextField.BLINK_INTERVAL = 750;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextField;

},{"../../common/Vector2D":24,"./AttachInfo":5,"./InterfaceElement":8,"./Panel":9,"./TextElement":10}],12:[function(require,module,exports){
"use strict";
const InterfaceElement_1 = require("../InterfaceElement");
const TextElement_1 = require("../TextElement");
const AttachInfo_1 = require("../AttachInfo");
const Panel_1 = require("../Panel");
const ElementList_1 = require("../ElementList");
const TextField_1 = require("../TextField");
class LoginMenu extends InterfaceElement_1.default {
    constructor() {
        super();
        this._className = "LoginMenu";
        this.resize(350, 500);
        this._bg = new Panel_1.default(350, 500, Panel_1.default.BASICBAR);
        this.addChild(this._bg);
        this._list = new ElementList_1.default(350, ElementList_1.default.VERTICAL, 5, ElementList_1.default.CENTRE);
        this.addChild(this._list);
        var strings = ['One way', 'or another', "I'm gonna find ya"];
        for (var i = 0; i < strings.length; i++) {
            var text = new TextElement_1.default(strings[i], TextElement_1.default.bigText);
            this._list.addChild(text);
        }
        var field = new TextField_1.default(300, 30, TextElement_1.default.basicText);
        this._list.addChild(field);
        this._bg.attachToParent(AttachInfo_1.default.Center);
        this._list.attachToParent(AttachInfo_1.default.Center);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LoginMenu;

},{"../AttachInfo":5,"../ElementList":6,"../InterfaceElement":8,"../Panel":9,"../TextElement":10,"../TextField":11}],13:[function(require,module,exports){
"use strict";
const InterfaceElement_1 = require("../InterfaceElement");
const AttachInfo_1 = require("../AttachInfo");
const LoginMenu_1 = require("./LoginMenu");
const Log = require("../../util/Log");
class MainMenu extends InterfaceElement_1.default {
    constructor() {
        super();
        this._currentMenuName = "";
        this._currentMenu = null;
        this._className = "MainMenu";
        //this._loginMenu = new TextElement("Login!", TextElement.veryBigText);
        this._loginMenu = new LoginMenu_1.default();
    }
    showMenu(name) {
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
    }
    showLogin() {
        Log.log('debug', 'MainMenu: login');
        this._currentMenuName = "login";
        this._currentMenu = this._loginMenu;
        this.addChild(this._loginMenu);
        this._loginMenu.attachToParent(AttachInfo_1.default.Center);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MainMenu;

},{"../../util/Log":21,"../AttachInfo":5,"../InterfaceElement":8,"./LoginMenu":12}],14:[function(require,module,exports){
/*
   Code entry point. Keep it clean.
*/
"use strict";
const Game_1 = require("./Game");
var viewDiv = document.getElementById("viewDiv");
var game = new Game_1.default(viewDiv);
game.init();

},{"./Game":2}],15:[function(require,module,exports){
"use strict";
exports.mainMenuMusic = [
    ["music/fortress", "sound/music/fortress.ogg"]
];
exports.interfaceSounds = [
    ["ui/click", "sound/ui/click.ogg"],
    ["ui/rollover", "sound/ui/rollover.ogg"],
    ["ui/nope", "sound/ui/nope.ogg"]
];

},{}],16:[function(require,module,exports){
"use strict";
class SoundLoadRequest {
    constructor(name, list, onComplete, onProgress = null) {
        this.name = name;
        this.list = list;
        this.onComplete = onComplete;
        this.onProgress = onProgress;
    }
}
class SoundManager {
    constructor() {
        this._requests = [];
        this._musicVolume = 1;
        this._volume = 1;
        this._music = null;
        createjs.Sound.addEventListener("fileload", () => this.onSoundLoaded());
        createjs.Sound.alternateExtensions = ['mp3'];
    }
    static get instance() {
        if (SoundManager._instance == null)
            SoundManager._instance = new SoundManager();
        return SoundManager._instance;
    }
    get volume() { return this._volume; }
    set volume(volume) { this._volume = volume; this.onVolumeChange(); }
    get musicVolume() { return this._musicVolume; }
    set musicVolume(volume) { this._musicVolume = volume; this.onMusicVolumeChange(); }
    load(requestName, assetList, onComplete, onProgress = null) {
        this._requests.push(new SoundLoadRequest(requestName, assetList, onComplete, onProgress));
        if (this._requests.length == 1)
            this._load();
    }
    playMusic(name) {
        this.stopMusic();
        this._music = createjs.Sound.play(name, { loop: -1 });
    }
    stopMusic() {
        if (this._music != null)
            this._music.stop();
        this._music = null;
    }
    _load() {
        this._numLoaded = 0;
        var list = this._requests[0].list;
        for (var i = 0; i < list.length; i++) {
            console.log("Registering " + list[i][1] + " as " + list[i][0]);
            createjs.Sound.registerSound({ id: list[i][0], src: list[i][1] });
        }
    }
    onSoundLoaded() {
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
    }
    onVolumeChange() {
        this.onMusicVolumeChange();
    }
    onMusicVolumeChange() {
        if (this._music)
            this._music.volume = this._musicVolume * this._volume;
    }
}
SoundManager._instance = null;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SoundManager;

},{}],17:[function(require,module,exports){
"use strict";
/// <reference path="../../declarations/pixi.js.d.ts"/>
const Game_1 = require("../Game");
function simpleRectangle(target, width, height, color, borderWidth = 0, borderColor = 0) {
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

},{"../Game":2}],18:[function(require,module,exports){
"use strict";
class TextureLoader {
    constructor(sheetName, mapName, callback) {
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
    get(texName) {
        return this._textures[texName];
    }
    getData() {
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
    }
    onSheetOrMap() {
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
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextureLoader;

},{}],19:[function(require,module,exports){
"use strict";
/// <reference path="../../declarations/pixi.js.d.ts"/>
const ColorUtil = require("../util/ColorUtil");
/**
 * Wraps a Worker, and provides async functions for getting recolored sprites.
 * TODO: create sprite sheets, as per previous implementation
 *
 * NOTE: Most of the actual work is done in public/js/mmoo-worker.js, and due to
 * some funky TypeScript nonsense it must be written there.
 */
class TextureWorker {
    constructor(scriptURL) {
        this._requestNumber = 0;
        this._callbacks = {};
        this._worker = new Worker(scriptURL);
        this._worker.onmessage = (e) => {
            this._onMessage(e.data);
        };
    }
    putTextures(texData) {
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
    }
    getTexture(name, colorMap, callback) {
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
    }
    _onMessage(msg) {
        switch (msg.action) {
            case "getTexture":
                this.onGetTexture(msg.params, msg.data);
                break;
        }
    }
    onGetTexture(params, data) {
        var width = params.width;
        var height = params.height;
        var dataArray = new Uint8ClampedArray(data);
        var requestKey = params.requestKey;
        var callback = this._callbacks[requestKey];
        if (callback) {
            callback(requestKey, this.textureFromArray(dataArray, width, height));
            delete this._callbacks[requestKey];
        }
    }
    textureFromArray(dataArray, width, height) {
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
    }
    //probably slower, fallback for Edge which can't do ImageData constructors (why?!)
    textureFromArrayEdge(dataArray, width, height) {
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
    }
    compareRGBA(a, i1, i2) {
        return (a[i1] == a[i2]
            && a[i1 + 1] == a[i2 + 1]
            && a[i1 + 2] == a[i2 + 2]
            && a[i1 + 3] == a[i2 + 3]);
    }
}
TextureWorker._supportsImageDataConstructor = -1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextureWorker;

},{"../util/ColorUtil":20}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
"use strict";
/*
   Provides pretty console.log messages, by key.
*/
var types = {};
class LogType {
    constructor(prefix = "", textColor = "#000", bgColor = "#fff", enabled = true) {
        this.prefix = prefix;
        this.textColor = textColor;
        this.bgColor = bgColor;
        this.enabled = enabled;
    }
    log(msg) {
        if (this.enabled)
            console.log("%c" + this.prefix + msg, "background:" + this.bgColor + "; color:" + this.textColor + ";");
    }
}
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

},{}],22:[function(require,module,exports){
"use strict";
/**
 * Generates string IDs from an alphabet. IDs can be relinquished and recycled to keep them short.
 */
class IDPool {
    /**
     * Generates string IDs from an alphabet. IDs can be relinquished and recycled to keep them short.
     */
    constructor(alphabet = IDPool._defaultAlphabet) {
        this._indeces = [0];
        this._unused = [];
        this._maxUnused = 100;
        this._alphabet = alphabet;
    }
    set maxUnused(num) {
        this._maxUnused = num;
        var len = this._unused.length;
        if (len > num)
            this._unused.splice(num - 1, len - num);
    }
    getID() {
        if (this._unused.length > 0)
            return this._unused.pop();
        else
            return this._createID();
    }
    //Use this to keep messaged ids short, saving some bandwidth
    relinquishID(id) {
        if (this._unused.length < this._maxUnused)
            this._unused.push(id);
    }
    _createID() {
        var id = '';
        for (var i = 0; i < this._indeces.length; i++) {
            //allegedly, concat performance is comparable to, if not better than join
            id += this._alphabet[this._indeces[i]];
        }
        this._increment();
        return id;
    }
    _increment() {
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
    }
}
IDPool._defaultAlphabet = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ~`!@#$%^&*()-_=+[]{}|;:<>,.?/';
IDPool._alphanumeric = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = IDPool;

},{}],23:[function(require,module,exports){
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
function isArray(x, len = -1) {
    if (Array.isArray(x)) {
        if (len < 0)
            return true;
        return x.length == len;
    }
    return false;
}
exports.isArray = isArray;
function isObject(x, allowNull = false) {
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

},{}],24:[function(require,module,exports){
"use strict";
class Vector2D {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    set(v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    }
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    round() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }
    scale(scale) {
        this.x *= scale;
        this.y *= scale;
        return this;
    }
    offset(angle, distance) {
        angle = Vector2D.degToRad(angle);
        this.x += distance * Math.cos(angle);
        this.y += distance * Math.sin(angle);
        return this;
    }
    normalize() {
        if (this.x == 0 && this.y == 0)
            this.x = 1;
        else
            this.scale(1 / this.length());
        return this;
    }
    ///////////////////////////////////////////////////////////////////
    // functions which return a result (not this)
    ///////////////////////////////////////////////////////////////////
    clone() {
        return new Vector2D(this.x, this.y);
    }
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    midpoint() {
        return this.clone().scale(0.5);
    }
    midpointTo(other) {
        return other.clone().sub(this).midpoint();
    }
    equals(other) {
        return (this.x == other.x && this.y == other.y);
    }
    distanceTo(other) {
        //avoid creating and discarding
        var ret;
        other.sub(this);
        ret = other.length();
        other.add(this);
        return ret;
    }
    withinDistance(other, distance) {
        var xDiff = other.x - this.x;
        var yDiff = other.y - this.y;
        var squareDist = xDiff * xDiff + yDiff * yDiff;
        return (squareDist <= distance * distance);
    }
    toJSON() {
        return [this.x, this.y];
    }
    static degToRad(angle) {
        return (angle * Math.PI) / 180.0;
    }
    static radToDeg(angle) {
        return (angle * 180) / Math.PI;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Vector2D;

},{}],25:[function(require,module,exports){
"use strict";
const IDPool_1 = require("../IDPool");
const Vector2D_1 = require("../Vector2D");
//import * as MessageTypes from './MessageTypes'; moved this to bottom because of circular referencing gone wrong
const Util = require("../Util");
class Message {
    constructor(type) {
        this.type = type;
    }
    serialize() {
        return this.type.toString();
    }
    //<type>[arg1, arg2, ..., argN]
    static parse(s) {
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
    }
    static fromArgs(args) {
        return null;
    }
    ////////////////////////////////////////
    // serialization
    ////////////////////////////////////////
    static serializeParams(obj) {
        var s = JSON.stringify(Message.abbreviate(obj));
        return s.substring(1, s.length - 1);
    }
    //returns an object with shorter keys using the abbreviations list
    static abbreviate(obj) {
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
    }
    static getAbbreviation(term) {
        if (Message._abbreviations == null)
            Message.generateAbbreviations();
        if (term.length > 2) {
            var abbreviation = Message._abbreviations[term];
            if (abbreviation)
                return abbreviation;
        }
        return term;
    }
    ////////////////////////////////////////
    // parsing
    ////////////////////////////////////////
    /**
     * Replaces abbreviated keys with their full counterparts.
     * NOTE: this is in-place!
     */
    static expand(obj) {
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
    }
    static getExpansion(term) {
        if (Message._abbreviations == null)
            Message.generateAbbreviations();
        if (term.length > 1) {
            var expansion = Message._expansions[term];
            if (expansion)
                return expansion;
        }
        return term;
    }
    ////////////////////////////////////////
    // private static inits
    ////////////////////////////////////////
    static generateAbbreviations() {
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
    }
}
Message._abbreviations = null;
Message._expansions = null;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Message;
const MessageTypes = require("./MessageTypes");

},{"../IDPool":22,"../Util":23,"../Vector2D":24,"./MessageTypes":26}],26:[function(require,module,exports){
"use strict";
const Message_1 = require("./Message");
const Util = require("../Util");
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
class Ping extends Message_1.default {
    constructor() {
        super(exports.PING);
    }
    static fromArgs(args) {
        return Ping._instance;
    }
    serialize() {
        return "0[]";
    }
}
Ping._instance = new Ping();
exports.Ping = Ping;
classesByType[exports.PING] = Ping;
class UserMessage extends Message_1.default {
    get success() {
        if (this.params && this.params.hasOwnProperty("success") && this.params["success"])
            return true;
        return false;
    }
    get failReason() {
        if (this.params && this.params.hasOwnProperty("failReason"))
            return this.params["failReason"];
        return "Unknown reason";
    }
    constructor(action, params) {
        super(exports.USER);
        this.action = action;
        this.params = params;
    }
    static fromArgs(args) {
        var action = args[0];
        var params = args[1];
        if (Util.isString(action) && Util.isObject(params))
            return new UserMessage(action, params);
        return null;
    }
    serialize() {
        var s = super.serialize();
        s += JSON.stringify([this.action, this.params]);
        return s;
    }
}
exports.UserMessage = UserMessage;
classesByType[exports.USER] = UserMessage;
class CryptoMessage extends Message_1.default {
    constructor(action, ciphertext) {
        super(exports.CRYPTO);
        this.action = action;
        this.ciphertext = ciphertext;
    }
    static fromArgs(args) {
        var action = args[0];
        var ciphertext = args[1];
        if (Util.isString(action) && Util.isString(ciphertext))
            return new CryptoMessage(action, ciphertext);
        return null;
    }
    serialize() {
        var s = super.serialize();
        s += JSON.stringify([this.action, this.ciphertext]);
        return s;
    }
}
exports.CryptoMessage = CryptoMessage;
classesByType[exports.CRYPTO] = CryptoMessage;
/**
 * General-purpose get. Game lists, definitions, whatever.
 */
class GetRequest extends Message_1.default {
    constructor(subject, requestKey, params) {
        super(exports.GET_REQUEST);
        this.subject = subject;
        this.requestKey = requestKey;
        this.params = params;
    }
    static fromArgs(args) {
        if (Util.isString(args[0])
            && Util.isInt(args[1])
            && Util.isObject(args[2])) {
            return new GetRequest(args[0], args[1], args[2]);
        }
        return null;
    }
    serialize() {
        var s = super.serialize();
        s += JSON.stringify([this.subject, this.requestKey, this.params]);
        return s;
    }
}
exports.GetRequest = GetRequest;
classesByType[exports.GET_REQUEST] = GetRequest;
class GetResponse extends Message_1.default {
    constructor(requestKey, response) {
        super(exports.GET_RESPONSE);
        this.requestKey = requestKey;
        this.response = response;
    }
    static fromArgs(args) {
        if (Util.isInt(args[0]) && args.length == 2)
            return new GetResponse(args[0], args[1]);
        return null;
    }
    serialize() {
        var s = super.serialize();
        s += JSON.stringify([this.requestKey, this.response]);
        return s;
    }
}
exports.GetResponse = GetResponse;
classesByType[exports.GET_RESPONSE] = GetResponse;
/**
 * User has joined the Game
 * Reports the Game's current frame and simulation speed
 */
class GameJoined extends Message_1.default {
    constructor(gameId, frame, frameInterval) {
        super(exports.GAME_JOINED);
        this.gameId = gameId;
        this.frame = frame;
        this.frameInterval = frameInterval;
    }
    static fromArgs(args) {
        if (Util.isInt(args[0])
            && Util.isInt(args[1])
            && Util.isNumber(args[2])) {
            return new GameJoined(args[0], args[1], args[2]);
        }
        return null;
    }
    serialize() {
        var s = super.serialize();
        s += JSON.stringify([this.gameId, this.frame, this.frameInterval]);
        return s;
    }
}
exports.GameJoined = GameJoined;
classesByType[exports.GAME_JOINED] = GameJoined;
/**
 * User has left the Game
 */
class GameLeft extends Message_1.default {
    constructor(gameId, reason) {
        super(exports.GAME_LEFT);
        this.gameId = gameId;
        this.reason = reason;
    }
    static fromArgs(args) {
        if (Util.isInt(args[0]) && Util.isString(args[1])) {
            return new GameLeft(args[0], args[1]);
        }
        return null;
    }
    serialize() {
        var s = super.serialize();
        s += JSON.stringify([this.gameId, this.reason]);
        return s;
    }
}
exports.GameLeft = GameLeft;
classesByType[exports.GAME_LEFT] = GameLeft;
/**
 * Player sees a Room. Might need to say more later, hence its own type.
 */
class RoomJoined extends Message_1.default {
    constructor(gameId) {
        super(exports.ROOM_JOINED);
        this.roomId = gameId;
    }
    static fromArgs(args) {
        if (Util.isInt(args[0])) {
            return new RoomJoined(args[0]);
        }
        return null;
    }
    serialize() {
        var s = super.serialize();
        s += JSON.stringify([this.roomId]);
        return s;
    }
}
exports.RoomJoined = RoomJoined;
classesByType[exports.ROOM_JOINED] = RoomJoined;
/**
 * Player doesn't see this Room anymore
 */
class RoomLeft extends Message_1.default {
    constructor(gameId) {
        super(exports.ROOM_LEFT);
        this.roomId = gameId;
    }
    static fromArgs(args) {
        if (Util.isInt(args[0])) {
            return new RoomLeft(args[0]);
        }
        return null;
    }
    serialize() {
        var s = super.serialize();
        s += JSON.stringify([this.roomId]);
        return s;
    }
}
exports.RoomLeft = RoomLeft;
classesByType[exports.ROOM_LEFT] = RoomLeft;

},{"../Util":23,"./Message":25}]},{},[14]);
