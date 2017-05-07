import Entity from './Entity';
import Order from './Order';
import Vector2D from '../../../../common/Vector2D';
import Message from '../../../../common/messages/Message';
import * as MessageTypes from '../../../../common/messages/MessageTypes';
import Character from '../../character/Character';

export default class Unit extends Entity {
    public static readonly MoveTypes = {
        NONE: 0,
        WALK: 1
    }
    public static readonly numMoveDirections:number = 16;

    protected _orders:Array<Order> = [];
    protected _messages:Array<Message> = [];

    public nextPosition:Vector2D = new Vector2D();
    public moveType:number = Unit.MoveTypes.WALK;
    public moveSpeed:number = 50; //units per second that this unit CAN move, if it is moving
    public moveDirection:number = -1;
    public attackRange:number = 10; //attack distance is only considered to be between the two circles the units occupy
    public characterId:number = -1;
    public name:string = "Unit";

    public get hasMessages():boolean { return this._messages.length > 0; }

    constructor() {
        super();
    }

    public initForCharacter(character:Character) {
        this.characterId = character.id;
        this.name = character.name;
    }

    /**
     * To be called at the end of a frame, by the room.
     * Collects all messages about this unit to be sent to its observers.
     */
    public getAndClearMessages():Array<Message> {
        var ret = this._messages;
        this._messages = [];
        return ret;
    }

    /**
     * Data to be presented to clients upon seeing a unit.
     * Contains the essential information about this unit.
     */
    public getBasicData():any {
        var data = {
            id: this.id,
            name:this.name,
            hp: this.health,
            maxHp: this.maxHealth,
            position: this.position.clone(),
            direction: this.moveDirection,
            speed: this.moveSpeed,
            characterId: this.characterId
        }

        return data;
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

    /**
     * Also updates position, after movement
     */
    public updateAction(timeDelta:number) {
        this.position.set(this.nextPosition);
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
        if (this.position.withinDistance(dest, this.moveSpeed * timeDelta)) {
            this.nextPosition.set(dest);
            this.setDirection(-1, true); //stop
            return true;
        }

        var direction:number = Unit.getDirectionIndex(this.position.angleTo(dest));
        var offsetAngle: number = direction * (360 / Unit.numMoveDirections);
        var offsetAmount: number = this.moveSpeed * timeDelta;

        this.nextPosition.set(this.position).offset(offsetAngle, offsetAmount);
        this.setDirection(direction);
        return false;
    }

    /**
     * Gets the integer direction to move, based on the number of allowed directions
     */
    private static getDirectionIndex(angle:number):number {
        angle = (angle + 360) % 360;
        var ret = Math.floor(angle / (360 / Unit.numMoveDirections));
        return ret;
    }

    /**
     * This is the direction index, for messaging changes in direction
     */
    private setDirection(direction:number, force:boolean = false) {
        if (direction == this.moveDirection && !force) return;
        this.moveDirection = direction;

        this._messages.push(new MessageTypes.UnitMoved(this.id, direction, this.nextPosition.clone()));
    }
}