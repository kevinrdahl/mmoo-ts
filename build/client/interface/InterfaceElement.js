"use strict";
var Vector2D_1 = require('../../common/Vector2D');
var Game_1 = require('../Game');
var InterfaceElement = (function () {
    function InterfaceElement() {
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
    InterfaceElement.prototype.getElementAtPoint = function (point) {
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
    };
    InterfaceElement.prototype.getElementById = function (id, maxChecks) {
        if (maxChecks === void 0) { maxChecks = 1000; }
        if (this.id == id)
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
                if (child.id == id)
                    return child;
                toCheck.push(child);
            }
            maxChecks -= 1;
        }
        if (maxChecks <= 900)
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
        this._position.x = other._position.x + (other._width * info.to.x) - (this.width * info.from.x) + info.offset.x;
        this._position.y = other._position.y + (other._height * info.to.y) - (this.height * info.from.y) + info.offset.y;
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
            this.onResize();
        }
        else if (this._attach) {
            this.positionRelativeTo(this._parent, this._attach);
        }
    };
    InterfaceElement.prototype.onResize = function () {
        if (this._attach)
            this.positionRelativeTo(this._parent, this._attach);
        var len = this._children.length;
        for (var i = 0; i < len; i++) {
            this._children[i].onParentResize();
        }
    };
    return InterfaceElement;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InterfaceElement;
//# sourceMappingURL=InterfaceElement.js.map