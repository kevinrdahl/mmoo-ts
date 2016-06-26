"use strict";
var Vector2 = (function () {
    function Vector2(x, y) {
        this.x = x;
        this.y = y;
    }
    Vector2.prototype.clone = function () {
        return new Vector2(this.x, this, y);
    };
    return Vector2;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Vector2;
//# sourceMappingURL=Vector2.js.map