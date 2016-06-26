"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var InterfaceElement_1 = require('./InterfaceElement');
var TextElement = (function (_super) {
    __extends(TextElement, _super);
    function TextElement(text, style) {
        if (text === void 0) { text = ""; }
        if (style === void 0) { style = TextElement.basicText; }
        _super.call(this);
        this._className = "TextElement";
        this._pixiText = new PIXI.Text(text, style);
        this._displayObject.addChild(this._pixiText);
        this.resizeToPixiText();
    }
    Object.defineProperty(TextElement.prototype, "text", {
        get: function () { return this._text; },
        set: function (text) {
            this._text = text;
            this.setPixiText();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TextElement.prototype, "style", {
        set: function (style) {
            this._pixiText.style = style;
            this.resizeToPixiText();
        },
        enumerable: true,
        configurable: true
    });
    TextElement.prototype.setPixiText = function () {
        this._pixiText.text = this._text;
        this.resizeToPixiText();
    };
    TextElement.prototype.resizeToPixiText = function () {
        this.resize(this._pixiText.width, this._pixiText.height);
    };
    TextElement.basicText = { font: '14px Open Sans', fill: 0xffffff, align: 'left' };
    TextElement.bigText = { font: '32px Open Sans', fill: 0xffffff, align: 'left' };
    TextElement.veryBigText = { font: '48px Open Sans', fill: 0xffffff, align: 'left' };
    return TextElement;
}(InterfaceElement_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextElement;
//# sourceMappingURL=TextElement.js.map