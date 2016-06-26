"use strict";
var WebsocketClient = (function () {
    function WebsocketClient(socket) {
        var _this = this;
        this.messageQueue = [];
        this._onMessage = function (data) {
            _this.onMessage(_this, data);
        };
        this._onDisconnect = function () {
            _this.onDisconnect(_this);
        };
        this._id = WebsocketClient._idNum.toString();
        WebsocketClient._idNum++;
        this._socket = socket;
        socket.on("close", this._onDisconnect);
        socket.on("message", this._onMessage);
    }
    Object.defineProperty(WebsocketClient.prototype, "id", {
        get: function () { return this._id; },
        enumerable: true,
        configurable: true
    });
    WebsocketClient.prototype.send = function (msg) {
        try {
            this._socket.send(msg);
        }
        catch (e) {
            console.error("WS SEND ERROR: " + e.toString());
        }
    };
    WebsocketClient._idNum = 0;
    return WebsocketClient;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = WebsocketClient;
//# sourceMappingURL=WebsocketClient.js.map