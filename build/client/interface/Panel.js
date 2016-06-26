"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var InterfaceElement_1 = require('./InterfaceElement');
var TextureGenerator = require('../textures/TextureGenerator');
var Panel = (function (_super) {
    __extends(Panel, _super);
    function Panel(width, height, style) {
        _super.call(this);
        this._needRedraw = true;
        this._className = "Panel";
        this._width = width;
        this._height = height;
        this._style = style;
        this._texture = null;
        this.clickable = true;
        this.draw();
        this._sprite = new PIXI.Sprite(this._texture);
        this._displayObject.addChild(this._sprite);
    }
    Panel.prototype.resize = function (width, height) {
        if (width != this._width || height != this._height)
            this._needRedraw = true;
        _super.prototype.resize.call(this, width, height);
    };
    Panel.prototype.draw = function () {
        _super.prototype.draw.call(this);
        if (this._needRedraw) {
            this._needRedraw = false;
            var hadTexture = false;
            if (this._texture) {
                hadTexture = true;
                this._texture.resize(this._width, this._height, true);
            }
            switch (this._style) {
                case Panel.BASICBAR:
                    this._texture = TextureGenerator.simpleRectangle(this._texture, this._width, this._height, 0x999999);
                    break;
                default:
                    this._texture = TextureGenerator.simpleRectangle(this._texture, this._width, this._height, 0x333333, 2, 0x999999);
            }
        }
    };
    Panel.BASIC = 0;
    Panel.BASICBAR = 1;
    return Panel;
}(InterfaceElement_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Panel;
//# sourceMappingURL=Panel.js.map