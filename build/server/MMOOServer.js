"use strict";
var MMOOServer = (function () {
    function MMOOServer() {
        this.wsClients = {};
    }
    MMOOServer.prototype.onClientConnect = function (client) {
    };
    MMOOServer.prototype.onClientMessage = function (client, msg) {
    };
    MMOOServer.prototype.onClientDisconnect = function (clielt, msg) {
    };
    return MMOOServer;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MMOOServer;
//# sourceMappingURL=MMOOServer.js.map