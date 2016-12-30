import Vector2D from '../../../../common/Vector2D';

/**
 * Base class for anything that exists in a room. Units, objects, items, whatever.
 * Needn't necessarily occupy physical space, eg a visual effect.
 */
export default class Entity {
	protected _position:Vector2D = new Vector2D(0,0);

	constructor() {

	}

	public distanceToEntity(entity:Entity):number {
		return this._position.distanceTo(entity._position);
	}
}