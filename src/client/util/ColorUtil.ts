export function rgbToNumber(r:number, g:number, b:number):number {
	return (r << 16) + (g << 8) + b;
}

export function hexToRGB(hex:number):Array<number> {
	var r = hex >> 16;
    var g = hex >> 8 & 0xFF;
    var b = hex & 0xFF;
    return [r,g,b];
}

export function rgbString(r:number, g:number, b:number):string {
	return "rgb(" + r + "," + g + "," + b + ")";
}

export function rgbaString(r:number, g:number, b:number, a:number):string {
	return "rgb(" + r + "," + g + "," + b + "," + a/255 + ")";
}