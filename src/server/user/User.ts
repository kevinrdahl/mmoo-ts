import UserOptions from './UserOptions';

/**
 * Handles the user as they exist in the database. Boring clerical stuff ONLY!
 * Save the cool things for Player
 */
export default class User {
	public id:number;
	public name:string;
	public password:string = null;
	public options:UserOptions;

	public get pass():string { return this.password; }

	constructor(data:Object = null) {
		if (data != null) {
			this.readData(data);
		}
	}

	public readData(data:Object) {
		if (data.hasOwnProperty('user_id')) this.id = data['user_id'];
		if (data.hasOwnProperty('name')) this.name = data['name'];
		if (data.hasOwnProperty('password')) this.password = data['password'];

		this.options = UserOptions.createDefault();
	}
}