import * as Util from '../../../common/Util';
import Player from '../Player';

var acceptedCreateCharacterProperties:Object = {
	"appearance":true
};

var acceptedAppearanceProperties:Object = {
	"sprite":true
};

export default class Character {
	private _data:any = null;

	public get id():number {
		if (this._data) return this._data.id;
		return -1;
	}

	public get userId():number {
		if (this._data) return this._data.userId;
		return -1;
	}

	public get name():string {
		if (this._data) return this._data.name;
		return "???";
	}

	public player:Player = null;

	constructor(data:any = null) {
		if (data) {
			this.readData(data);
		}
	}

	/**
	 * Initializes from a Sequelize Instance
	 */
	public readData(data:any) {
		this._data = data;
	}

	/**
	 * Modifies the "properties" from a "createUser" UserMessage's params.
	 * Also serves to generate a default object (albeit suboptimally)
	 *
	 * Name and gameId are handled elsewhere
	 */
	public static sanitizeCreateCharacterProperties(properties:Object) {
		for (var propName in properties) {
			if (!acceptedCreateCharacterProperties[propName]) {
				delete properties[propName];
			}
		}

		if (Util.isObject(properties['appearance'])) {
			var appearance:Object = properties['appearance'];
			for (var propName in appearance) {
				if (!acceptedAppearanceProperties[propName]) {
					delete appearance[propName];
				}
			}

			if (Util.isInt(appearance['sprite'])) {
				appearance['sprite'] = Util.clamp(appearance['sprite'], 0, 3); //you can choose one of 4 different sprites! Neat!
			} else {
				appearance['sprite'] = Math.floor(Math.random() * 4);
			}

		} else {
			properties['appearance'] = {sprite: 0};
		}
	}
}