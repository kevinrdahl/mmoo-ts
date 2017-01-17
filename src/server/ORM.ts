let sequelize = require('sequelize');

export default class ORM {
	private sql = null;

	//tables
	public User;
	public Character;
	public World;

	constructor(options:any = null) {
		if (options) this.init(options);
	}

	public init (options) {
		console.log("ORM: init");

		var S = sequelize.Sequelize;

		this.sql = new S(
			options.database,
			options.user,
			options.password,
			{
				host: options.host,
				dialect: 'mysql',

				pool: {
					max: 5,
					min: 0,
					idle: 10000
				}
			}
		);

		//////////////////////////////////////////////////
		// User
		//////////////////////////////////////////////////
		this.User = this.sql.define(
			'User',
			{
				id: { type:S.INTEGER.UNSIGNED, field:'user_id', primaryKey:true, autoIncrement:true },
				name: { type:S.STRING(50), field:'name' },
				password: { type:S.STRING(120), field:'password' }
			},
			{
				freezeTableName: true,
				timestamps: false
			}
		);

		//////////////////////////////////////////////////
		// Character
		//////////////////////////////////////////////////
		this.Character = this.sql.define(
			'Character',
			{
				id: { type:S.INTEGER.UNSIGNED, field:'character_id', primaryKey:true, autoIncrement:true },
				name: { type:S.STRING(50), field:'name' },
				properties: { type:S.TEXT, field:'properties' },
				userId: { type:S.INTEGER.UNSIGNED, field:'user_id' },
				worldId: { type:S.INTEGER.UNSIGNED, field:'world_id' }
			},
			{
				freezeTableName: true,
				timestamps: false
			}
		);

		//////////////////////////////////////////////////
		// World
		//////////////////////////////////////////////////
		this.World = this.sql.define(
			'World',
			{
				id: { type:S.INTEGER.UNSIGNED, field:'world_id', primaryKey:true, autoIncrement:true },
				name: { type:S.STRING(50), field:'name' },
				host: { type:S.STRING(250), field:'host' },
				wsPort: { type:S.INTEGER.UNSIGNED, field:'ws_port' },
				httpPort: { type:S.INTEGER.UNSIGNED, field:'http_port' }
			},
			{
				freezeTableName: true,
				timestamps: false
			}
		);
	}
}