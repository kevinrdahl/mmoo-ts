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
//# sourceMappingURL=Vector2D.js.map