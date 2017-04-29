import Entity from './Entity';
import Order from './Order';
import Vector2D from '../../../../common/Vector2D';

export default class Unit extends Entity {
    public static readonly MoveTypes = {
        NONE: 0,
        WALK: 1
    }
    public static readonly numMoveDirections:number = 8;

    protected _orders:Array<Order> = [];
    public nextPosition:Vector2D = new Vector2D();
    public moveType:number = Unit.MoveTypes.WALK;
    public moveSpeed:number = 100; //units per second
    public moveDirection:number = -1;
    public attackRange:number = 10; //attack distance is only considered to be between the two circles the units occupy

    constructor() {
        super();
    }

    public updateMovement(timeDelta:number) {
        this.checkOrders();

        if (this._orders.length > 0) {
            var order:Order = this._orders[0];

            if (order.checkMoveNeeded()) {
                var dest:Vector2D = order.getMoveTarget();
                var complete:boolean = this.stepToPoint(dest, timeDelta);
                if (complete) {
                    this.orderCompleted();
                }
            }
        }
    }

    public updateAction(timeDelta:number) {
        
    }

    public addOrder(order:Order, clearQueue:boolean) {
        if (clearQueue) {
            this.clearOrders();
        }

        this._orders.push(order);
        order.forUnit = this;
    }

    public clearOrders() {
        this._orders = [];
    }

    public getMaxDistanceToAttackEntity(e:Entity) {
        return this.radius + e.radius + this.attackRange;
    }

    private orderCompleted() {
        this._orders.shift();
    }

    /**
     * Removes invalid orders from the front of the queue
     */
    private checkOrders() {
        var order:Order;
        var targetUnit:Unit;
        var len:number = this._orders.length;

        for (var i = 0; i < len; i++) {
            order = this._orders[i];
            if (order.checkValid()) {
                //if we passed over any orders, remove them all
                if (i > 0) {
                    this._orders.splice(0, i);
                }

                //current order is valid, we're done
                break;
            }
            else if (i == len - 1) {
                //nothing is valid!
                this.clearOrders();
            }
        }
    }

    /**
     * Moves toward dest, and returns true if the unit has reached it
     */
    private stepToPoint(dest:Vector2D, timeDelta:number):boolean {
        if (this.position.withinDistance(dest, this.moveSpeed)) {
            this.nextPosition.set(dest);
            this.setDirection(-1); //stop
            return true;
        }

        var direction:number = Unit.getDirection(this.position.angleTo(dest));
        this.nextPosition.set(this.position).offset(direction * (360 / Unit.numMoveDirections), this.moveSpeed * timeDelta);
        this.setDirection(direction);
        return false;
    }

    /**
     * Gets the integer direction to move, based on the number of allowed directions
     */
    private static getDirection(angle):number {
        return Math.floor(((angle + 360) % 360) / Unit.numMoveDirections);
    }

    /**
     * This is the direction index, for messaging changes in direction
     */
    private setDirection(direction:number) {
        if (direction == this.moveDirection) return;
        this.moveDirection = direction;

        //TODO: message
    }
}