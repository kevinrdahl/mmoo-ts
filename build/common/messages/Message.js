"use strict";
var IDPool_1 = require('../IDPool');
var Vector2D_1 = require('../Vector2D');
var Message = (function () {
    function Message(type, params) {
        this.type = type;
        this.params = params;
    }
    Message.prototype.serialize = function () {
        return this.type.toString() + '|' + Message.serializeParams(this.params);
    };
    Message.parse = function (s) {
        var splitIndex = s.indexOf('|');
        if (splitIndex === -1) {
            return null;
        }
        var msgType = parseInt(s.substring(0, splitIndex), 10);
        if (isNaN(msgType)) {
            return null;
        }
        var params;
        try {
            params = JSON.parse('{' + s.substring(splitIndex + 1) + '}');
        }
        catch (e) {
            return null;
        }
        Message.expand(params);
        return new Message(msgType, params);
    };
    Message.getTypeId = function (name) {
        if (Message._typesByName == null)
            Message.generateTypesByName();
        return Message._typesByName[name];
    };
    Message.getTypeName = function (id) {
        return Message._typesByIndex[id];
    };
    Message.serializeParams = function (obj) {
        var s = JSON.stringify(Message.abbreviate(obj));
        return s.substring(1, s.length - 1);
    };
    Message.abbreviate = function (obj) {
        var clone = {};
        var keys = Object.keys(obj);
        var key, val;
        for (var i = 0; i < keys.length; i++) {
            key = keys[i];
            val = obj[key];
            if (val instanceof Vector2D_1.default) {
                val = [val.x, val.y];
            }
            else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                val = Message.abbreviate(val);
            }
            clone[Message.getAbbreviation(key)] = val;
        }
        return clone;
    };
    Message.getAbbreviation = function (term) {
        if (Message._abbreviations == null)
            Message.generateAbbreviations();
        if (term.length > 2) {
            var abbreviation = Message._abbreviations[term];
            if (abbreviation)
                return abbreviation;
        }
        return term;
    };
    Message.expand = function (obj) {
        var keys = Object.keys(obj);
        var key, val, fullKey;
        for (var i = 0; i < keys.length; i++) {
            key = keys[i];
            val = obj[key];
            fullKey = Message.getExpansion(key);
            if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
                Message.expand(val);
            }
            else if (Array.isArray(val)
                && val.length === 2
                && typeof val[0] === 'number' && typeof val[1] === 'number') {
                val = new Vector2D_1.default(val.x, val.y);
            }
            if (key !== fullKey) {
                obj[fullKey] = val;
                delete obj[key];
            }
        }
    };
    Message.getExpansion = function (term) {
        if (Message._abbreviations == null)
            Message.generateAbbreviations();
        if (term.length > 1) {
            var expansion = Message._expansions[term];
            if (expansion)
                return expansion;
        }
        return term;
    };
    Message.generateTypesByName = function () {
        for (var i = 0; i < Message._typesByIndex.length; i++) {
            Message._typesByName[Message._typesByIndex[i]] = i;
        }
    };
    Message.generateAbbreviations = function () {
        Message._abbreviations = {};
        Message._expansions = {};
        var terms = [
            'step',
            'unit',
            'direction',
            'target',
            'amount',
            'source',
            'position',
            'point',
            'destination',
            'queue',
            'killer',
            'success',
            'moveSpeed',
            'attackDamage',
            'attackRange',
            'attackSpeed',
            'radius',
            'name',
            'password',
            'success',
            'alive',
            'name',
            'action',
            'lastBroadcastPosition'
        ];
        var pool = new IDPool_1.default();
        var term, abbreviation;
        for (var i = 0; i < terms.length; i++) {
            term = terms[i];
            abbreviation = '?' + pool.getID();
            Message._abbreviations[term] = abbreviation;
            Message._expansions[abbreviation] = term;
        }
    };
    Message._typesByIndex = [
        'user',
        'world',
        'secure',
        'ping'
    ];
    Message._typesByName = null;
    Message._abbreviations = null;
    Message._expansions = null;
    return Message;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Message;
//# sourceMappingURL=Message.js.map