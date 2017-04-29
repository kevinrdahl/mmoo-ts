import Vector2D from '../../../../common/Vector2D';
import Room from '../Room';

/**
 * Unit, Projectile, Ground Item, etc
 */
export default class Entity {
    //ID nonsense
    protected static _idNum:number = 0;
    private _id:number = -1;
    public get id():number { return this._id; }

    public room:Room = null;

    public position:Vector2D = new Vector2D();
    public radius:number = 24;
    public health:number = 1;
    public maxHealth:number = 1;

    public get isAlive():boolean {
        return this.health > 0;
    }

    constructor() {
        this._id = Entity._idNum++;
    }

    public distanceTo(other:Entity):number {
        return this.position.distanceTo(other.position);
    }
}