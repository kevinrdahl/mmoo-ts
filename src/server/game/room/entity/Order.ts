import Vector2D from '../../../../common/Vector2D';
import Unit from './Unit';

export default class Order {
    public static readonly types = {
        MOVE: 0,
        ATTACK: 1,
        STOP: 2,
        MOVE_TO_ENTITY: 3
    }

    private _type:number = Order.types.STOP;
    public get type():number { return this._type; }

    public targetPoint:Vector2D = null;
    public targetUnitID:number = -1;
    public forUnit:Unit = null;

    constructor() {

    }

    public initMove(dest:Vector2D) {
        this._type = Order.types.MOVE;
        this.targetPoint = dest;
    }

    public initAttack(entityID:number) {
        this._type = Order.types.ATTACK;
        this.targetUnitID = entityID;
    }

    /**
     * Orders are stop by default, but for the sake of completeness...
     */
    public initStop()
    {
        this._type = Order.types.STOP;
    }

    public initMoveToEntity(entityID:number)
    {
        this._type = Order.types.MOVE_TO_ENTITY;
        this.targetUnitID = entityID;
    }

    /**
     * To be called potentially every frame. Not for sanitizing user input.
     * Rather, checks that it can STILL be performed.
     * 
     * ex: an order to attack a unit is no longer valid if the unit dies or becomes friendly
     */
    public checkValid():boolean {
        if (this.targetUnitID) {
            var targetUnit:Unit = this.forUnit.room.getUnitByID(this.targetUnitID) as Unit;
            if (targetUnit == null) return false;
            if (this.type == Order.types.ATTACK && !targetUnit.isAlive) return false;
        }

        return true;
    }

    public checkMoveNeeded():boolean {
        switch (this._type) {
            case Order.types.MOVE:
            case Order.types.MOVE_TO_ENTITY:
                return true;

            case Order.types.ATTACK:
                //return true if not in range
                //VS Code is flipping its lid at me that getUnitByID return an Entity, which it doesn't.
                var target:Unit = this.forUnit.room.getUnitByID(this.targetUnitID) as Unit;
                if (target && this.forUnit.distanceTo(target) > this.forUnit.getMaxDistanceToAttackEntity(target)) {
                    return true;
                }
                return false;

            default:
                return false;
        }
    }

    public getMoveTarget():Vector2D {
        if (this.targetPoint) return this.targetPoint;
        
        if (this.targetUnitID) {
            var targetUnit:Unit = this.forUnit.room.getUnitByID(this.targetUnitID) as Unit;
            var dist:number = 0;
            
            if (this._type == Order.types.ATTACK) {
                dist = this.forUnit.getMaxDistanceToAttackEntity(targetUnit);
            }
            else if (this._type == Order.types.MOVE_TO_ENTITY) {
                dist = this.forUnit.radius + targetUnit.radius;
            }

            return targetUnit.position.clone().offset(targetUnit.position.angleTo(this.forUnit.position), dist);
        }

        return new Vector2D();
    }
}