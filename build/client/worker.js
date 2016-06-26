/*
 * Makes sprite sheets!
 */

var Log = require('./util/log');
var AssetCache = require('./../common/AssetCache');

Log.setLogType("worker", new Log.LogType("Worker: ", "#0c0"));
Log.log("worker", "Worker thread created.");

//self.postMessage({action:"status", params:{ready:true}});

////////////////////////////////////////
// worker variables
////////////////////////////////////////
var textureAssets = {};
var animSets = {};
var partDefs = {};
var recolorCache = new AssetCache.default(50);


/*
 * Message format:
 * 		{action:string, params:Object, params:ArrayBuffer}
 * Sending:
 *		worker.postMessage(msg, [msg.params]);
 */
self.onmessage = function (e) {
    var msg = e.data;

    switch(msg.action) {
    	case "getSpritesheet": returnSpriteSheet(msg.params); break;
    	case "newTexture": onNewTexture(msg.params, msg.data); break;
    	case "getTexture": returnTexture(msg.params); break;
    	case "newAnimSet": onNewAnimSet(msg.params); break;
    	case "newPartDef": onNewPartDef(msg.params); break;
    	default: Log.log("worker", "Unknown action \"" + msg.action + "\"");
    }
};

////////////////////////////////////////
// spritesheet functions
////////////////////////////////////////
/*
 * animSet: {animName:anim, animName:anim, ...}
 * 		anim: {gridSize:[w,h], defaultDuration:number, defaultOrigin:[x,y], frames:[frame, frame, ...]}
 * 		frame: {duration?:number, origin?:[x,y], points:[point, point, ...]}
 * 		point: {name:string, coords:[x,y]}
 * 
 * parts: {pointName:[part, part, ...], pointName:[part, part, ...], ...}
 * 		part: {part:partDefName, offset?:[x,y]}
 *
 * colorMap:{colorName:color, colorName:color, ...}
 * NOTE this is different from the colorMap format used in part recoloring, cause I suck at names
 */
function returnSpriteSheet(params) {
	var startTime = performance.now();

	var animSet = animSets[params.animSet];
	var parts = params.parts;
	var colorMap = params.colorMap;
	var dimensions = getSpritesheetDimensions(animSet);
	var buffer = new ArrayBuffer(dimensions[0] * dimensions[1] * 4);
	var imageAsset = new TextureAsset(animSet.name, dimensions[0], dimensions[1], buffer);
	imageAsset.data.fill(0); //black, transparent

	var partMaps = {}; //will hold color maps for each version of each part
	var animAtlas = {};
	var x, y, 
		animName, anim, 
		frameNum, frame, 
		pointNum, point, coords, attachedParts, 
		attachNum, attach, 
		partDef, offset, partImage, partMap, textureAsset;

	y = 0;

	//for each animation (row)
	for (animName in animSet) {
		x = 0;
		anim = animSet[animName];

		//for each frame (column)
		for (frameNum = 0; frameNum < anim.frames.length; frameNum++) {
			frame = anim.frames[frameNum];

			//for each attachment point
			for (pointNum = 0; pointNum < frame.points.length; pointNum++) {
				point = frame.points[pointNum];
				coords = point.coords;

				//part defs can override their texture for certain frames/animations
				altNum = point.name + animName + pointNum;
				altStar = point.name + animName + '*';

				attachedParts = parts[point.name];

				//for each part attached to the point
				for (attachNum = 0; attachNum < attachedParts.length; attachNum++) {
					attach = attachedParts[attachNum];
					partDef = partDefs[attach.part];
					offset = attach.offet; 
					if (!offset) offset = [0,0];

					//get the actual image path to use
					partImage = partDef[altNum];
					if (!partImage) partImage = partDef[altStar];
					if (!partImage) partImage = partDef.basic; //'default' is a keyword, gotta be a bitch

					partMap = getPartColorMap(partMaps, partDef, colorMap);
					textureAsset = getTexture(partImage, partMap);
					copyTextureData(textureAsset, imageAsset, x + coords[0] + offset[0], y + coords[1] + offset[1]);
				}
			}

			x += anim.gridSize[0];
		}
		animAtlas[animName] = y;
		y += anim.gridSize[1];
	}

	var timeTaken = performance.now() - startTime;
	Log.log("worker", "Generated spritesheet \"" + params.animSet + "\" in " + timeTaken + "ms");

	var msg = {
		action:"getSpritesheet",
		params:{
			width:imageAsset.width,
			height:imageAsset.height,
			name:imageAsset.name,
			atlas:animAtlas,
			requestKey:params.requestKey
		},
		data:imageAsset.data.buffer
	}
	self.postMessage(msg, [msg.data]);
}

function copyTextureData(source, target, startX, startY) {
	var sourceData = source.data;
	var targetData = target.data;
	var sourceIndex, targetIndex;

	for (var y = 0; y < source.height && y + startY < target.height; y++) {
		sourceIndex = (source.width * y + x) * 4;
		targetIndex = (target.width * (startY + y) + startX + x) * 4;
		for (var x = 0; x < source.width && x + startX < target.width; x++) {
			if (sourceData[sourceIndex+3] == 0) continue; //transparent, skip

			//only opaque and transparent allowed
			targetData[targetIndex] = sourceData[sourceIndex];
			targetData[targetIndex+1] = sourceData[sourceIndex+1];
			targetData[targetIndex+2] = sourceData[sourceIndex+2];
			targetData[targetIndex+3] = 255;

			sourceIndex += 4;
			targetIndex += 4;
		}
	}
}

/* 
 * parameter colorMap is in syntax described above, but this returns the format used
 * by the recolor functions below
 *
 * ick!
 */ 
getPartColorMap = function(partMaps, part, colorMap) {
	var map = partMaps[part.name];
	if (map) return map;

	map = new ColorMap();

	var toColor;
	var colorNames = Object.keys(part.colors);
	var colorName;
	colorNames.sort(); //ensure successive getTexture calls generate the same key for the same colors
	for (var i = colorNames.length-1; i >= 0; i--) {
		colorName = colorNames[i];
		toColor = colorMap[colorName];
		if (!toColor) continue;
		map.from.push(part.colors[colorName]);
		map.to.push(toColor);
	}

	map.key = JSON.stringify(map.to);
	partMaps[part.name] = map;
	return map;
}

getSpritesheetDimensions = function(animSet) {
	var width = 0;
	var height = 0;
	var anim, animWidth;
	for (var animName in animSet) {
		anim = animSet[animName];
		height += anim.gridSize[1];
		animWidth = anim.gridSize[0] * anim.frames.length;
		if (animWidth > width) width = animWidth;
	}

	return [width, height];
}

onNewAnimSet = function(params) {
	animSets[params.name] = params.animSet;
}

onNewPartDef = function(params) {
	partDefs[params.name] = params.partDef;
}

////////////////////////////////////////
// recolor functions
////////////////////////////////////////

//stores a copy of an uncolored texture for later use
onNewTexture = function(params, data) {
	var asset = new TextureAsset(params.name, params.width, params.height, data);
	textureAssets[params.name] = asset;
}

//returns a copy of a colored texture to the main thread
returnTexture = function(params) {
	var asset = getTexture(params.name, params.colorMap);
	params.width = asset.width;
	params.height = asset.height;
	self.postMessage({
		action:"getTexture",
		params:{
			name:asset.name,
			width:asset.width,
			height:asset.height,
			requestKey:params.requestKey
		},
		data:asset.data.buffer
	});
}

//retrieves or creates a colored texture
getTexture = function(name, colorMap) {
	if (colorMap.key) colorMap.key = JSON.stringify(colorMap.to);
	var key = name + "|" + colorMap.key;
	var texture = recolorCache.get(key);

	if (texture == null) {
		texture = createTexture(name, colorMap);
		texture.name = key;
		recolorCache.set(key, texture);
	}

	return texture;
}

//guess what this does
createTexture = function(name, colorMap) {
	var asset = textureAssets[name];
	var totalPixels = asset.width * asset.height;
	var data = asset.data;
	var newData = new Uint8ClampedArray(new ArrayBuffer(totalPixels * 4));

	var fromR = [];
	var toRGB = [];
	var len = colorMap.from.length;
	for (var i = 0; i < len; i++) {
		fromR.push(hexToRGB(colorMap.from[i])[0]);
		toRGB.push(hexToRGB(colorMap.to[i]));
	}

	var toColor;
	var prevR = -1;
	var currentR;
	for (var i = 0; i < totalPixels * 4; i += 4) {
		//I expect the number of to-and-from pairs to be very small, hence this icky cached linear search
		currentR = data[i];
		if (currentR != prevR) toColor = toRGB[fromR.indexOf(currentR)];
		if (toColor) {
			newData[i] = toColor[0];
			newData[i+1] = toColor[1];
			newData[i+2] = toColor[2];
			newData[i+3] = 255;
		} else {
			newData[i] = data[i];
			newData[i+1] = data[i+1];
			newData[i+2] = data[i+2];
			newData[i+3] = data[i+3];
		}
		prevR = currentR;
	}

	return new TextureAsset(name, asset.width, asset.height, newData);
}

hexToRGB = function(hex){
    var r = hex >> 16;
    var g = hex >> 8 & 0xFF;
    var b = hex & 0xFF;
    return [r,g,b];
}

////////////////////////////////////////
// params classes
////////////////////////////////////////
function TextureAsset(name, width, height, data) {
	//style points for using only names that text editors highlight
	this.name = name;
	this.width = width;
	this.height = height;
	this.data = new Uint8ClampedArray(data);
}

function ColorMap() {
	this.from = [];
	this.to = [];
	this.key = "[]";
}