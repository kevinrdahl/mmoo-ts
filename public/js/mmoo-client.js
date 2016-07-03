(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Log = require("./util/Log");

var Log = _interopRequireWildcard(_Log);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Connection = function () {
    function Connection(hostName, port) {
        var _this = this;

        _classCallCheck(this, Connection);

        this.hostName = hostName;
        this.port = port;
        this.connString = "";
        this.socket = null;
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
            _this.onMessage(message.data);
        };
        Log.setLogType("conn", new Log.LogType("", "#fff", "#06c"));
        Log.setLogType("connSend", new Log.LogType("SEND: ", "#93f"));
        Log.setLogType("connRecv", new Log.LogType("RECV: ", "#06c"));
        this.connString = 'ws://' + hostName + ':' + port;
    }

    _createClass(Connection, [{
        key: "connect",
        value: function connect() {
            if (this.socket != null) {
                this.disconnect("reconnecting");
            }
            this.socket = new WebSocket(this.connString);
            this.socket.addEventListener("open", this.onSocketConnect);
            this.socket.addEventListener("close", this.onSocketDisconnect);
            this.socket.addEventListener("message", this.onSocketMessage);
            this.socket.addEventListener("error", this.onSocketError);
        }
    }, {
        key: "disconnect",
        value: function disconnect() {
            var reason = arguments.length <= 0 || arguments[0] === undefined ? "???" : arguments[0];

            this.socket.close(1000, reason);
            this.socket = null;
        }
    }, {
        key: "send",
        value: function send(msg) {
            try {
                this.socket.send(msg);
            } catch (err) {
                Log.log("error", err.toString());
            }
        }
    }]);

    return Connection;
}();



exports.default = Connection;

},{"./util/Log":12}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Log = require('./util/Log');

var Log = _interopRequireWildcard(_Log);

var _Connection = require('./Connection');

var _Connection2 = _interopRequireDefault(_Connection);

var _TextureLoader = require('./textures/TextureLoader');

var _TextureLoader2 = _interopRequireDefault(_TextureLoader);

var _TextureWorker = require('./textures/TextureWorker');

var _TextureWorker2 = _interopRequireDefault(_TextureWorker);

var _SoundManager = require('./sound/SoundManager');

var _SoundManager2 = _interopRequireDefault(_SoundManager);

var _SoundAssets = require('./sound/SoundAssets');

var SoundAssets = _interopRequireWildcard(_SoundAssets);

var _InterfaceElement = require('./interface/InterfaceElement');

var _InterfaceElement2 = _interopRequireDefault(_InterfaceElement);

var _TextElement = require('./interface/TextElement');

var _TextElement2 = _interopRequireDefault(_TextElement);

var _AttachInfo = require('./interface/AttachInfo');

var _AttachInfo2 = _interopRequireDefault(_AttachInfo);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Game = function () {
    function Game(viewDiv) {
        var _this = this;

        _classCallCheck(this, Game);

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

    _createClass(Game, [{
        key: 'init',
        value: function init() {
            var _this2 = this;

            Log.setLogType("debug", new Log.LogType("", "#999"));
            Log.setLogType("error", new Log.LogType("ERROR: ", "#f00"));
            Log.log("debug", "Initializing game...");
            if (Game.instance === null) {
                Game.instance = this;
            } else {
                Log.log("error", "There's already a game! Aborting Init");
                return;
            }
            this.stage = new PIXI.Container();
            this.renderer = PIXI.autoDetectRenderer(500, 500, { backgroundColor: 0xaaaaff });
            this.renderer.autoResize = true;
            this.viewDiv.appendChild(this.renderer.view);
            this.textureWorker = new _TextureWorker2.default('js/mmoo-worker.js');
            window.addEventListener('resize', function () {
                return _this2._documentResized = true;
            });
            this.interfaceRoot = new _InterfaceElement2.default();
            this.interfaceRoot.id = "root";
            this.interfaceRoot.name = "root";
            this.interfaceRoot.addToContainer(this.stage);
            this.debugGraphics = new PIXI.Graphics();
            this.stage.addChild(this.debugGraphics);
            this.connect();
            this.render();
        }
    }, {
        key: 'render',
        value: function render() {
            var _this3 = this;

            if (this._documentResized) {
                this._documentResized = false;
                this.resize();
            }
            if (Game.useDebugGraphics) this.debugGraphics.clear();
            this.interfaceRoot.draw();
            var renderer = this.renderer;
            renderer.render(this.stage);
            requestAnimationFrame(function () {
                return _this3.render();
            });
        }
    }, {
        key: 'resize',
        value: function resize() {
            this.viewWidth = this.viewDiv.clientWidth;
            this.viewHeight = this.viewDiv.clientHeight;
            this.renderer.resize(this.viewWidth, this.viewHeight);
            this.interfaceRoot.resize(this.viewWidth, this.viewHeight);
        }
    }, {
        key: 'connect',
        value: function connect() {
            var _this4 = this;

            var loadingText = new _TextElement2.default("Connecting...", _TextElement2.default.veryBigText);
            loadingText.id = "loadingText";
            this.interfaceRoot.addChild(loadingText);
            loadingText.attachToParent(_AttachInfo2.default.Center);
            this.connection = new _Connection2.default("localhost", 9002);
            this.connection.onConnect = function () {
                return _this4.onConnect();
            };
            this.connection.onMessage = function (msg) {
                return _this4.onConnectionMessage(msg);
            };
            this.connection.onError = function (e) {
                return _this4.onConnectionError(e);
            };
            this.connection.onDisconnect = function () {
                return _this4.onDisconnect();
            };
            this.connection.connect();
        }
    }, {
        key: 'onConnect',
        value: function onConnect() {
            this.loadTextures();
            this.connection.send("Hello!");
        }
    }, {
        key: 'onConnectionMessage',
        value: function onConnectionMessage(msg) {}
    }, {
        key: 'onConnectionError',
        value: function onConnectionError(e) {}
    }, {
        key: 'onDisconnect',
        value: function onDisconnect() {}
    }, {
        key: 'loadTextures',
        value: function loadTextures() {
            var _this5 = this;

            Log.log("debug", "=== LOAD TEXTURES ===");
            var loadingText = this.interfaceRoot.getElementById("loadingText");
            loadingText.text = "Loading textures...";
            this.textureLoader = new _TextureLoader2.default("textures.png", "textureMap.json", function () {
                return _this5.onTexturesLoaded();
            });
        }
    }, {
        key: 'onTexturesLoaded',
        value: function onTexturesLoaded() {
            this.sendGraphicsToWorker();
            this.loadSounds();
            this.textureWorker.getTexture('parts/helmet', { from: [0x555555], to: [0xff0000] }, this.onTextureWorkerGetTexture);
        }
    }, {
        key: 'sendGraphicsToWorker',
        value: function sendGraphicsToWorker() {
            var data = this.textureLoader.getData();
            this.textureWorker.putTextures(data);
        }
    }, {
        key: 'loadSounds',
        value: function loadSounds() {
            var _this6 = this;

            var list = SoundAssets.interfaceSounds.concat(SoundAssets.mainMenuMusic);
            _SoundManager2.default.instance.load("initial", list, function (which) {
                return _this6.onSoundsLoaded(which);
            }, function (which, progress) {
                return _this6.onSoundsLoadedProgress(which, progress);
            });
            var loadingText = this.interfaceRoot.getElementById("loadingText");
            loadingText.text = "Loading sounds... (0%)";
        }
    }, {
        key: 'onSoundsLoaded',
        value: function onSoundsLoaded(which) {
            if (which == "initial") {
                _SoundManager2.default.instance.playMusic("music/fortress");
                this.initMainMenu();
            }
        }
    }, {
        key: 'onSoundsLoadedProgress',
        value: function onSoundsLoadedProgress(which, progress) {
            if (which == "initial") {
                var loadingText = this.interfaceRoot.getElementById("loadingText");
                loadingText.text = "Loading sounds... (" + Math.round(progress * 100) + "%)";
            }
        }
    }, {
        key: 'initMainMenu',
        value: function initMainMenu() {
            var loadingText = this.interfaceRoot.getElementById("loadingText");
            this.interfaceRoot.removeChild(loadingText);
        }
    }, {
        key: 'volatileGraphics',
        get: function get() {
            this._volatileGraphics.clear();return this._volatileGraphics;
        }
    }]);

    return Game;
}();

exports.default = Game;

Game.instance = null;
Game.useDebugGraphics = true;


},{"./Connection":1,"./interface/AttachInfo":3,"./interface/InterfaceElement":4,"./interface/TextElement":5,"./sound/SoundAssets":7,"./sound/SoundManager":8,"./textures/TextureLoader":9,"./textures/TextureWorker":10,"./util/Log":12}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Vector2D = require('../../common/Vector2D');

var _Vector2D2 = _interopRequireDefault(_Vector2D);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AttachInfo = function () {
    function AttachInfo(from, to, offset) {
        _classCallCheck(this, AttachInfo);

        this.from = from;
        this.to = to;
        this.offset = offset;
    }

    _createClass(AttachInfo, [{
        key: 'clone',
        value: function clone() {
            return new AttachInfo(this.from.clone(), this.to.clone(), this.offset.clone());
        }
    }]);

    return AttachInfo;
}();

exports.default = AttachInfo;

AttachInfo.TLtoTL = new AttachInfo(new _Vector2D2.default(0, 0), new _Vector2D2.default(0, 0), new _Vector2D2.default(0, 0));
AttachInfo.TRtoTR = new AttachInfo(new _Vector2D2.default(1, 0), new _Vector2D2.default(1, 0), new _Vector2D2.default(0, 0));
AttachInfo.BLtoBL = new AttachInfo(new _Vector2D2.default(0, 1), new _Vector2D2.default(0, 1), new _Vector2D2.default(0, 0));
AttachInfo.BRtoBR = new AttachInfo(new _Vector2D2.default(1, 1), new _Vector2D2.default(1, 1), new _Vector2D2.default(0, 0));
AttachInfo.Center = new AttachInfo(new _Vector2D2.default(0.5, 0.5), new _Vector2D2.default(0.5, 0.5), new _Vector2D2.default(0, 0));
AttachInfo.TopCenter = new AttachInfo(new _Vector2D2.default(0.5, 0), new _Vector2D2.default(0.5, 0), new _Vector2D2.default(0, 0));
AttachInfo.BottomCenter = new AttachInfo(new _Vector2D2.default(0.5, 1), new _Vector2D2.default(0.5, 1), new _Vector2D2.default(0, 0));
AttachInfo.RightCenter = new AttachInfo(new _Vector2D2.default(1, 0.5), new _Vector2D2.default(1, 0.5), new _Vector2D2.default(0, 0));
AttachInfo.LeftCenter = new AttachInfo(new _Vector2D2.default(0, 0.5), new _Vector2D2.default(0, 0.5), new _Vector2D2.default(0, 0));


},{"../../common/Vector2D":13}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Vector2D = require('../../common/Vector2D');

var _Vector2D2 = _interopRequireDefault(_Vector2D);

var _Game = require('../Game');

var _Game2 = _interopRequireDefault(_Game);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var InterfaceElement = function () {
    function InterfaceElement() {
        _classCallCheck(this, InterfaceElement);

        this.id = "";
        this.name = "";
        this.clickable = false;
        this.draggable = false;
        this.dragElement = null;
        this.maskSprite = null;
        this.onMouseDown = null;
        this.onMouseUp = null;
        this.onClick = null;
        this.onHoverStart = null;
        this.onHoverEnd = null;
        this.onChange = null;
        this._displayObject = new PIXI.Container();
        this._parent = null;
        this._children = [];
        this._position = new _Vector2D2.default(0, 0);
        this._width = 0;
        this._height = 0;
        this._attach = null;
        this._resize = null;
        this._className = "InterfaceElement";
        this._debugColor = 0x0000ff;
    }

    _createClass(InterfaceElement, [{
        key: 'getElementAtPoint',
        value: function getElementAtPoint(point) {
            var element = null;
            var bounds = this._displayObject.getBounds();
            if (bounds.contains(point.x, point.y)) {
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
    }, {
        key: 'getElementById',
        value: function getElementById(id) {
            var maxChecks = arguments.length <= 1 || arguments[1] === undefined ? 1000 : arguments[1];

            if (this.id == id) return this;
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
                    if (child.id == id) return child;
                    toCheck.push(child);
                }
                maxChecks -= 1;
            }
            if (maxChecks <= 900) console.warn("Wasting cycles on InterfaceElement.getElementById");else if (maxChecks == 0) console.warn("Wasting LOTS of cycles on InterfaceElement.getElementById");
            return null;
        }
    }, {
        key: 'draw',
        value: function draw() {
            var len = this._children.length;
            for (var i = 0; i < len; i++) {
                this._children[i].draw();
            }
            if (_Game2.default.useDebugGraphics) {
                var global = this.getGlobalPosition();
                _Game2.default.instance.debugGraphics.lineStyle(1, this._debugColor, 1);
                _Game2.default.instance.debugGraphics.drawRect(global.x, global.y, this._width, this._height);
            }
        }
    }, {
        key: 'resize',
        value: function resize(width, height) {
            this._width = width;
            this._height = height;
            this.onResize();
        }
    }, {
        key: 'addToContainer',
        value: function addToContainer(container) {
            container.addChild(this._displayObject);
        }
    }, {
        key: 'addChild',
        value: function addChild(child) {
            this._children.push(child);
            this._displayObject.addChild(child._displayObject);
            child._parent = this;
        }
    }, {
        key: 'addChildAt',
        value: function addChildAt(child) {
            var index = arguments.length <= 1 || arguments[1] === undefined ? -1 : arguments[1];

            if (index < 0 || index > this._children.length) {
                this.addChild(child);
                return;
            }
            this._children.splice(index, 0, child);
            this._displayObject.addChildAt(child._displayObject, index);
        }
    }, {
        key: 'removeChild',
        value: function removeChild(child) {
            var recurse = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

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
    }, {
        key: 'removeSelf',
        value: function removeSelf() {
            var recurse = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

            if (this._parent != null) this._parent.removeChild(this, recurse);
        }
    }, {
        key: 'moveChildToTop',
        value: function moveChildToTop(child) {
            this.removeChild(child);
            this.addChild(child);
        }
    }, {
        key: 'attachToParent',
        value: function attachToParent(info) {
            this._attach = info;
            this.positionRelativeTo(this._parent, info);
        }
    }, {
        key: 'detachFromParent',
        value: function detachFromParent() {
            this._attach = null;
        }
    }, {
        key: 'resizeToParent',
        value: function resizeToParent(info) {
            this._resize = info;
            this.onParentResize();
        }
    }, {
        key: 'disableResizeToParent',
        value: function disableResizeToParent() {
            this._resize = null;
        }
    }, {
        key: 'positionRelativeTo',
        value: function positionRelativeTo(other, info) {
            this._position.x = other._position.x + other._width * info.to.x - this.width * info.from.x + info.offset.x;
            this._position.y = other._position.y + other._height * info.to.y - this.height * info.from.y + info.offset.y;
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
        }
    }, {
        key: 'getGlobalPosition',
        value: function getGlobalPosition() {
            var pos = this._position.clone();
            var parent = this._parent;
            while (parent != null) {
                pos.add(parent._position);
                parent = parent._parent;
            }
            return pos;
        }
    }, {
        key: 'updateDisplayObjectPosition',
        value: function updateDisplayObjectPosition() {
            this._displayObject.position.set(Math.round(this._position.x), Math.round(this._position.y));
        }
    }, {
        key: 'toNearestPixel',
        value: function toNearestPixel() {
            this._position.round();
            this.updateDisplayObjectPosition();
        }
    }, {
        key: 'onParentResize',
        value: function onParentResize() {
            if (this._resize) {
                var width = this._width;
                var height = this._height;
                if (this._resize.fill.x > 0) width = this._parent._width * this._resize.fill.x - this._resize.padding.x * 2;
                if (this._resize.fill.y > 0) height = this._parent._height * this._resize.fill.y - this._resize.padding.y * 2;
                this.resize(width, height);
                this.onResize();
            } else if (this._attach) {
                this.positionRelativeTo(this._parent, this._attach);
            }
        }
    }, {
        key: 'onResize',
        value: function onResize() {
            if (this._attach) this.positionRelativeTo(this._parent, this._attach);
            var len = this._children.length;
            for (var i = 0; i < len; i++) {
                this._children[i].onParentResize();
            }
        }
    }, {
        key: 'x',
        get: function get() {
            return this._position.x;
        },
        set: function set(x) {
            this._position.x = x;this.updateDisplayObjectPosition();
        }
    }, {
        key: 'y',
        get: function get() {
            return this._position.y;
        },
        set: function set(y) {
            this._position.y = y;this.updateDisplayObjectPosition();
        }
    }, {
        key: 'position',
        get: function get() {
            return this._position.clone();
        },
        set: function set(pos) {
            this._position.set(pos);this.updateDisplayObjectPosition();
        }
    }, {
        key: 'width',
        get: function get() {
            return this._width;
        }
    }, {
        key: 'height',
        get: function get() {
            return this._height;
        }
    }, {
        key: 'displayObject',
        get: function get() {
            return this._displayObject;
        }
    }, {
        key: 'children',
        get: function get() {
            return this._children.slice();
        }
    }, {
        key: 'fullName',
        get: function get() {
            var s = this._className;
            if (this.id != "") s += " #" + this.id;
            if (this.name != "") s += " \"" + this.name + "\"";
            if (this.draggable) s += " (draggable)";
            if (!this.clickable) s += " (not clickable)";
            return s;
        }
    }]);

    return InterfaceElement;
}();



exports.default = InterfaceElement;

},{"../../common/Vector2D":13,"../Game":2}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _InterfaceElement2 = require("./InterfaceElement");

var _InterfaceElement3 = _interopRequireDefault(_InterfaceElement2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TextElement = function (_InterfaceElement) {
    _inherits(TextElement, _InterfaceElement);

    function TextElement() {
        var text = arguments.length <= 0 || arguments[0] === undefined ? "" : arguments[0];
        var style = arguments.length <= 1 || arguments[1] === undefined ? TextElement.basicText : arguments[1];

        _classCallCheck(this, TextElement);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(TextElement).call(this));

        _this._className = "TextElement";
        _this._pixiText = new PIXI.Text(text, style);
        _this._displayObject.addChild(_this._pixiText);
        _this.resizeToPixiText();
        return _this;
    }

    _createClass(TextElement, [{
        key: "setPixiText",
        value: function setPixiText() {
            this._pixiText.text = this._text;
            this.resizeToPixiText();
        }
    }, {
        key: "resizeToPixiText",
        value: function resizeToPixiText() {
            this.resize(this._pixiText.width, this._pixiText.height);
        }
    }, {
        key: "text",
        get: function get() {
            return this._text;
        },
        set: function set(text) {
            this._text = text;
            this.setPixiText();
        }
    }, {
        key: "style",
        set: function set(style) {
            this._pixiText.style = style;
            this.resizeToPixiText();
        }
    }]);

    return TextElement;
}(_InterfaceElement3.default);

exports.default = TextElement;

TextElement.basicText = { font: '14px Open Sans', fill: 0xffffff, align: 'left' };
TextElement.bigText = { font: '32px Open Sans', fill: 0xffffff, align: 'left' };
TextElement.veryBigText = { font: '48px Open Sans', fill: 0xffffff, align: 'left' };


},{"./InterfaceElement":4}],6:[function(require,module,exports){
"use strict";

var _Game = require("./Game");

var _Game2 = _interopRequireDefault(_Game);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var viewDiv = document.getElementById("viewDiv");
var game = new _Game2.default(viewDiv);
game.init();


},{"./Game":2}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var mainMenuMusic = exports.mainMenuMusic = [["music/fortress", "sound/music/fortress.ogg"]];
var interfaceSounds = exports.interfaceSounds = [["ui/click", "sound/ui/click.ogg"], ["ui/rollover", "sound/ui/rollover.ogg"], ["ui/nope", "sound/ui/nope.ogg"]];


},{}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SoundLoadRequest = function SoundLoadRequest(name, list, onComplete) {
    var onProgress = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

    _classCallCheck(this, SoundLoadRequest);

    this.name = name;
    this.list = list;
    this.onComplete = onComplete;
    this.onProgress = onProgress;
};

var SoundManager = function () {
    function SoundManager() {
        var _this = this;

        _classCallCheck(this, SoundManager);

        this._requests = [];
        this._musicVolume = 1;
        this._volume = 1;
        this._music = null;
        createjs.Sound.addEventListener("fileload", function () {
            return _this.onSoundLoaded();
        });
        createjs.Sound.alternateExtensions = ['mp3'];
    }

    _createClass(SoundManager, [{
        key: "load",
        value: function load(requestName, assetList, onComplete) {
            var onProgress = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

            this._requests.push(new SoundLoadRequest(requestName, assetList, onComplete, onProgress));
            if (this._requests.length == 1) this._load();
        }
    }, {
        key: "playMusic",
        value: function playMusic(name) {
            this.stopMusic();
            this._music = createjs.Sound.play(name, { loop: -1 });
        }
    }, {
        key: "stopMusic",
        value: function stopMusic() {
            if (this._music != null) this._music.stop();
            this._music = null;
        }
    }, {
        key: "_load",
        value: function _load() {
            this._numLoaded = 0;
            var list = this._requests[0].list;
            for (var i = 0; i < list.length; i++) {
                console.log("Registering " + list[i][1] + " as " + list[i][0]);
                createjs.Sound.registerSound({ id: list[i][0], src: list[i][1] });
            }
        }
    }, {
        key: "onSoundLoaded",
        value: function onSoundLoaded() {
            this._numLoaded += 1;
            var req = this._requests[0];
            if (req.onProgress) {
                req.onProgress(req.name, this._numLoaded / req.list.length);
            }
            if (this._numLoaded >= req.list.length) {
                req.onComplete(req.name);
                this._requests.shift();
                if (this._requests.length > 0) this._load();
            }
        }
    }, {
        key: "onVolumeChange",
        value: function onVolumeChange() {
            this.onMusicVolumeChange();
        }
    }, {
        key: "onMusicVolumeChange",
        value: function onMusicVolumeChange() {
            if (this._music) this._music.volume = this._musicVolume * this._volume;
        }
    }, {
        key: "volume",
        get: function get() {
            return this._volume;
        },
        set: function set(volume) {
            this._volume = volume;this.onVolumeChange();
        }
    }, {
        key: "musicVolume",
        get: function get() {
            return this._musicVolume;
        },
        set: function set(volume) {
            this._musicVolume = volume;this.onMusicVolumeChange();
        }
    }], [{
        key: "instance",
        get: function get() {
            if (SoundManager._instance == null) SoundManager._instance = new SoundManager();
            return SoundManager._instance;
        }
    }]);

    return SoundManager;
}();

exports.default = SoundManager;

SoundManager._instance = null;


},{}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TextureLoader = function () {
    function TextureLoader(sheetName, mapName, callback) {
        _classCallCheck(this, TextureLoader);

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

    _createClass(TextureLoader, [{
        key: "get",
        value: function get(texName) {
            return this._textures[texName];
        }
    }, {
        key: "getData",
        value: function getData() {
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
    }, {
        key: "onSheetOrMap",
        value: function onSheetOrMap() {
            var sheet = this._sheet;
            var map = this._map;
            if (sheet === null || map === null) return;
            var frame;
            var rect;
            for (var texName in map) {
                frame = map[texName].frame;
                rect = new PIXI.Rectangle(frame.x, frame.y, frame.w, frame.h);
                this._textures[texName] = new PIXI.Texture(sheet, rect);
            }
            this._callback();
        }
    }]);

    return TextureLoader;
}();



exports.default = TextureLoader;

},{}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ColorUtil = require("../util/ColorUtil");

var ColorUtil = _interopRequireWildcard(_ColorUtil);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TextureWorker = function () {
    function TextureWorker(scriptURL) {
        var _this = this;

        _classCallCheck(this, TextureWorker);

        this._requestNumber = 0;
        this._callbacks = {};
        this._worker = new Worker(scriptURL);
        this._worker.onmessage = function (e) {
            _this._onMessage(e.data);
        };
    }

    _createClass(TextureWorker, [{
        key: "putTextures",
        value: function putTextures(texData) {
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
    }, {
        key: "getTexture",
        value: function getTexture(name, colorMap, callback) {
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
    }, {
        key: "_onMessage",
        value: function _onMessage(msg) {
            switch (msg.action) {
                case "getTexture":
                    this.onGetTexture(msg.params, msg.data);
                    break;
            }
        }
    }, {
        key: "onGetTexture",
        value: function onGetTexture(params, data) {
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
    }, {
        key: "textureFromArray",
        value: function textureFromArray(dataArray, width, height) {
            try {
                var imageData = new ImageData(dataArray, width, height);
            } catch (e) {
                return this.textureFromArrayEdge(dataArray, width, height);
            }
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            canvas.width = width;
            canvas.height = height;
            context.putImageData(imageData, 0, 0);
            return PIXI.Texture.fromCanvas(canvas, PIXI.SCALE_MODES.NEAREST);
        }
    }, {
        key: "textureFromArrayEdge",
        value: function textureFromArrayEdge(dataArray, width, height) {
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
                if (x < width - 1) same = this.compareRGBA(dataArray, i, i + 4);
                if (same && runStart == -1) {
                    runStart = x;
                } else if (!same) {
                    if (runStart >= 0) {
                        drawX = runStart;
                        drawW = x - runStart + 1;
                        runStart = -1;
                    } else {
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
        }
    }, {
        key: "compareRGBA",
        value: function compareRGBA(a, i1, i2) {
            return a[i1] == a[i2] && a[i1 + 1] == a[i2 + 1] && a[i1 + 2] == a[i2 + 2] && a[i1 + 3] == a[i2 + 3];
        }
    }]);

    return TextureWorker;
}();

exports.default = TextureWorker;

TextureWorker._supportsImageDataConstructor = -1;


},{"../util/ColorUtil":11}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.rgbToNumber = rgbToNumber;
exports.hexToRGB = hexToRGB;
exports.rgbString = rgbString;
exports.rgbaString = rgbaString;
function rgbToNumber(r, g, b) {
    return (r << 16) + (g << 8) + b;
}
function hexToRGB(hex) {
    var r = hex >> 16;
    var g = hex >> 8 & 0xFF;
    var b = hex & 0xFF;
    return [r, g, b];
}
function rgbString(r, g, b) {
    return "rgb(" + r + "," + g + "," + b + ")";
}
function rgbaString(r, g, b, a) {
    return "rgb(" + r + "," + g + "," + b + "," + a / 255 + ")";
}


},{}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.setLogType = setLogType;
exports.log = log;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var types = {};

var LogType = exports.LogType = function () {
    function LogType() {
        var prefix = arguments.length <= 0 || arguments[0] === undefined ? "" : arguments[0];
        var textColor = arguments.length <= 1 || arguments[1] === undefined ? "#000" : arguments[1];
        var bgColor = arguments.length <= 2 || arguments[2] === undefined ? "#fff" : arguments[2];
        var enabled = arguments.length <= 3 || arguments[3] === undefined ? true : arguments[3];

        _classCallCheck(this, LogType);

        this.prefix = prefix;
        this.textColor = textColor;
        this.bgColor = bgColor;
        this.enabled = enabled;
    }

    _createClass(LogType, [{
        key: "log",
        value: function log(msg) {
            if (this.enabled) console.log("%c" + this.prefix + msg, "background:" + this.bgColor + "; color:" + this.textColor + ";");
        }
    }]);

    return LogType;
}();

function setLogType(name, type) {
    if (!types.hasOwnProperty(name)) types[name] = type;
}
function log(typeName, msg) {
    if (types.hasOwnProperty(typeName)) types[typeName].log(msg);
}


},{}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Vector2D = function () {
    function Vector2D(x, y) {
        _classCallCheck(this, Vector2D);

        this.x = x;
        this.y = y;
    }

    _createClass(Vector2D, [{
        key: "set",
        value: function set(v) {
            this.x = v.x;
            this.y = v.y;
            return this;
        }
    }, {
        key: "add",
        value: function add(v) {
            this.x += v.x;
            this.y += v.y;
            return this;
        }
    }, {
        key: "sub",
        value: function sub(v) {
            this.x -= v.x;
            this.y -= v.y;
            return this;
        }
    }, {
        key: "round",
        value: function round() {
            this.x = Math.round(this.x);
            this.y = Math.round(this.y);
            return this;
        }
    }, {
        key: "scale",
        value: function scale(_scale) {
            this.x *= _scale;
            this.y *= _scale;
            return this;
        }
    }, {
        key: "offset",
        value: function offset(angle, distance) {
            angle = Vector2D.degToRad(angle);
            this.x += distance * Math.cos(angle);
            this.y += distance * Math.sin(angle);
            return this;
        }
    }, {
        key: "normalize",
        value: function normalize() {
            if (this.x == 0 && this.y == 0) this.x = 1;else this.scale(1 / this.length());
            return this;
        }
    }, {
        key: "clone",
        value: function clone() {
            return new Vector2D(this.x, this.y);
        }
    }, {
        key: "length",
        value: function length() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }
    }, {
        key: "midpoint",
        value: function midpoint() {
            return this.clone().scale(0.5);
        }
    }, {
        key: "midpointTo",
        value: function midpointTo(other) {
            return other.clone().sub(this).midpoint();
        }
    }, {
        key: "equals",
        value: function equals(other) {
            return this.x == other.x && this.y == other.y;
        }
    }, {
        key: "distanceTo",
        value: function distanceTo(other) {
            var ret;
            other.sub(this);
            ret = other.length();
            other.add(this);
            return ret;
        }
    }, {
        key: "withinDistance",
        value: function withinDistance(other, distance) {
            var xDiff = other.x - this.x;
            var yDiff = other.y - this.y;
            var squareDist = xDiff * xDiff + yDiff * yDiff;
            return squareDist <= distance * distance;
        }
    }, {
        key: "toJSON",
        value: function toJSON() {
            return [this.x, this.y];
        }
    }], [{
        key: "degToRad",
        value: function degToRad(angle) {
            return angle * Math.PI / 180.0;
        }
    }, {
        key: "radToDeg",
        value: function radToDeg(angle) {
            return angle * 180 / Math.PI;
        }
    }]);

    return Vector2D;
}();



exports.default = Vector2D;

},{}]},{},[6]);
