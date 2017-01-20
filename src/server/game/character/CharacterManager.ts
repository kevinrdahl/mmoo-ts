import Character from './Character';

export default class CharacterManager {
	/**
	 * DO NOT modify! User the utility functions this class provides. This is only public so you can iterate on it.
	 */
	public characters:Array<Character> = [];
	private _charactersById:Object = {};

	constructor() {

	}

	public characterExistsById(id:number):boolean {
		return this._charactersById.hasOwnProperty(id.toString());
	}

	public characterExists(character:Character) {
		return this.characterExistsById(character.id);
	}

	public addCharacter(character:Character) {
		if (this.characterExists(character)) return;

		this.characters.push(character);
		this._charactersById[character.id.toString()] = character;
	}

	public removeCharacter(character:Character) {
		if (!this.characterExists(character)) return;

		var index:number = this.characters.indexOf(character);
		this.characters.splice(index, 1);
		delete this._charactersById[character.id.toString()];
	}

	public getCharacterById(id:number):Character {
		var character:Character = this._charactersById[id.toString()];
		if (character) return character;
		return null;
	}
}