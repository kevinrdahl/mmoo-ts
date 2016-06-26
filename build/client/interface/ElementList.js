"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var InterfaceElement_1 = require('./InterfaceElement');
var ElementList = (function (_super) {
    __extends(ElementList, _super);
    function ElementList(orientation, padding) {
        if (orientation === void 0) { orientation = ElementList.VERTICAL; }
        if (padding === void 0) { padding = 5; }
        _super.call(this);
        this._childBounds = [];
        this._orientation = orientation;
        this._padding = padding;
        this._className = "ElementList";
    }
    ElementList.prototype.addChild = function (child) {
        _super.prototype.addChild.call(this, child);
        this._childBounds.push(0);
        this.redoLayout(child);
    };
    ElementList.prototype.addChildAt = function (child, index) {
        _super.prototype.addChildAt.call(this, child, index);
        this._childBounds.push(0);
        this.redoLayout(child);
    };
    ElementList.prototype.removeChild = function (child) {
        var index = this._children.indexOf(child);
        _super.prototype.removeChild.call(this, child);
        this._childBounds.pop();
        if (index != -1 && index < this._children.length)
            this.redoLayout(this._children[index]);
    };
    ElementList.prototype.redoLayout = function (fromChild) {
        if (fromChild === void 0) { fromChild = null; }
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
                offset += child.height;
            }
            else {
                child.x = offset;
                offset += child.width;
            }
            this._childBounds[index] = offset;
        }
    };
    ElementList.HORIZONTAL = 0;
    ElementList.VERTICAL = 1;
    return ElementList;
}(InterfaceElement_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ElementList;
//# sourceMappingURL=ElementList.js.map