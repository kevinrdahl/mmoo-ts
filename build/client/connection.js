"use strict";
var Log = require('./util/Log');
var Connection = (function () {
    function Connection(hostName, port) {
        var _this = this;
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
    return Connection;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Connection;
//# sourceMappingURL=Connection.js.map