import Vector2D from '../../common/Vector2D';
import AssetCache from '../../common/AssetCache';

export default class ResizeInfo {
	//Lots of things will probably end up sharing ResizeInfo, but unlike AttachInfo there aren't natural constants
	private static cache:AssetCache<ResizeInfo> = new AssetCache<ResizeInfo>(100);
	
	public static get(fillX:number, fillY:number, paddingX:number, paddingY:number):ResizeInfo {
		var key:string = JSON.stringify([fillX, fillY, paddingX, paddingY]);
		var info:ResizeInfo = ResizeInfo.cache.get(key);
		
		if (!info) {
			info = new ResizeInfo(new Vector2D(fillX, fillY), new Vector2D(paddingX, paddingY));
			ResizeInfo.cache.set(key, info);
		}
		
		return info;
	}
	
	constructor (
		public fill:Vector2D,
		public padding:Vector2D
	) {}
	
	public clone():ResizeInfo {
		return new ResizeInfo(this.fill.clone(), this.padding.clone());
	}
}