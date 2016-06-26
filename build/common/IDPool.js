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
    return IDPool;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = IDPool;
//# sourceMappingURL=IDPool.js.map