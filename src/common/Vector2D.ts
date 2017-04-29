export default class Vector2D {
	constructor (
		public x:number = 0,
		public y:number = 0
	) {}

	public set(v:Vector2D):Vector2D {
		this.x = v.x;
		this.y = v.y;
		return this;
	}

	public add(v:Vector2D):Vector2D {
		this.x += v.x;
		this.y += v.y;
		return this;
	}

	public addScaled(v:Vector2D, scale:number):Vector2D {
		this.x += v.x * scale;
		this.y += v.y * scale;
		return this;
	}

	public sub(v:Vector2D):Vector2D {
		this.x -= v.x;
		this.y -= v.y;
		return this;
	}

	public round():Vector2D {
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);
		return this;
	}

	public scale(scale:number):Vector2D {
		this.x *= scale;
		this.y *= scale;
		return this;
	}

	public offset(angle:number, distance:number):Vector2D {
		angle = Vector2D.degToRad(angle);
		this.x += distance * Math.cos(angle);
        this.y += distance * Math.sin(angle);
        return this;
	}

	public normalize():Vector2D {
		if (this.x == 0 && this.y == 0) this.x = 1;
		else this.scale(1 / this.length());
		return this;
	}


	///////////////////////////////////////////////////////////////////
	// functions which return a result (not this)
	///////////////////////////////////////////////////////////////////
	public clone():Vector2D {
		return new Vector2D(this.x, this.y);
	}

	public length():number {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	public midpoint():Vector2D {
		return this.clone().scale(0.5);
	}

	public midpointTo(other:Vector2D):Vector2D {
		return other.clone().sub(this).midpoint();
	}

	public equals(other:Vector2D):boolean {
		return (this.x == other.x && this.y == other.y);
	}

	public distanceTo(other:Vector2D):number {
		//avoid creating and discarding
		var ret;
		other.sub(this);
		ret = other.length();
		other.add(this);
		return ret;
	}

	public angleTo(other:Vector2D):number {
		return Vector2D.radToDeg(Math.atan2(other.y - this.y, other.x - this.x));
	}

	public withinDistance(other:Vector2D, distance:number):boolean {
		var xDiff = other.x - this.x;
		var yDiff = other.y - this.y;
		var squareDist = xDiff * xDiff + yDiff * yDiff;
		return (squareDist <= distance * distance);
	}

	public toJSON() {
		return [this.x, this.y];
	}

	public static polar(angle:number, distance:number) {
		return new Vector2D(0, 0).offset(angle, distance);
	}

	public static degToRad(angle:number):number {
		return (angle*Math.PI)/180.0;
	}

	public static radToDeg(angle:number):number {
		return (angle*180)/Math.PI;
	}
}