"use strict";
var AssetCache = (function () {
    function AssetCache(capacity) {
        this._assets = {};
        this._keyQueue = [];
        this._capacity = capacity;
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
        while (this._keyQueue.length > this._capacity) {
            delete this._assets[this._keyQueue.shift()];
        }
    };
    return AssetCache;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AssetCache;
//# sourceMappingURL=AssetCache.js.map