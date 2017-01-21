import Character from './Character';
import IDObjectGroup from '../../../common/IDObjectGroup';

export default class CharacterManager {
	public characters:IDObjectGroup<Character> = new IDObjectGroup<Character>();
}