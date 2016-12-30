import Vector2D from '../../common/Vector2D';

export default class AttachInfo {
	public static TLtoTL:AttachInfo = new AttachInfo(new Vector2D(0,0), new Vector2D(0,0), new Vector2D(0,0));
	public static TRtoTR:AttachInfo = new AttachInfo(new Vector2D(1,0), new Vector2D(1,0), new Vector2D(0,0));
	public static BLtoBL:AttachInfo = new AttachInfo(new Vector2D(0,1), new Vector2D(0,1), new Vector2D(0,0));
	public static BRtoBR:AttachInfo = new AttachInfo(new Vector2D(1,1), new Vector2D(1,1), new Vector2D(0,0));

	public static Center:AttachInfo = 		new AttachInfo(		new Vector2D(0.5,0.5), 	new Vector2D(0.5,0.5), 	new Vector2D(0,0));
	public static TopCenter:AttachInfo = 		new AttachInfo(	new Vector2D(0.5,0), 	new Vector2D(0.5,0), 	new Vector2D(0,0));
	public static BottomCenter:AttachInfo = 	new AttachInfo(	new Vector2D(0.5,1), 	new Vector2D(0.5,1), 	new Vector2D(0,0));
	public static RightCenter:AttachInfo = 	new AttachInfo(	new Vector2D(1,0.5), 	new Vector2D(1,0.5), 	new Vector2D(0,0));
	public static LeftCenter:AttachInfo = 		new AttachInfo(	new Vector2D(0,0.5), 	new Vector2D(0,0.5), 	new Vector2D(0,0));

	constructor (
		public from:Vector2D,
		public to:Vector2D,
		public offset:Vector2D
	) {}

	public clone():AttachInfo {
		return new AttachInfo(this.from.clone(), this.to.clone(), this.offset.clone());
	}
}