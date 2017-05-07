import InterfaceElement from '../InterfaceElement';
import TextElement from '../TextElement';
import TextField from '../TextField';
import AttachInfo from '../AttachInfo';
import GenericListDialog from './GenericListDialog';
import GameEvent from '../../events/GameEvent';
import TextButton from '../TextButton';
import InterfaceRoot from './InterfaceRoot';
import Game from '../../Game';
import * as Log from '../../util/Log';

export default class MainMenu extends InterfaceElement {
	private _currentMenu:InterfaceElement = null;

	private _loginMenu:InterfaceElement;
	private _registerMenu:InterfaceElement;

	constructor() {
		super();

		this._className = "MainMenu";
		//this._loginMenu = new TextElement("Login!", TextElement.veryBigText);
		//this._loginMenu = new LoginMenu();

		var login:GenericListDialog = new GenericListDialog(300);
		login.addBigTitle("MMO Online");
		login.addLabeledTextField("Username", "username", TextField.alphabets.abc123, false, "", null, 5);
		login.addLabeledTextField("Password", "password", TextField.alphabets.abc123, true, "", null, 15);
		login.addButtons([
			{ text: "Login", colorScheme: TextButton.colorSchemes.green, onClick: (e: GameEvent) => { login.submit(); } },
			{ text: "Register", colorScheme: TextButton.colorSchemes.blue, onClick: (e: GameEvent) => {
				InterfaceRoot.instance.showWarningPopup("I haven't made that dialog yet.");
			}}
		])
		login.finalize();
		login.onSubmit = this.onLoginSubmit;

		this._loginMenu = login;
	}

	public showLogin() {
		Log.log('debug', 'MainMenu: login');

		this.showMenu(this._loginMenu);
	}

	private showMenu(menu:InterfaceElement) {
		if (this._currentMenu == menu) return;

		if (this._currentMenu) this.removeChild(this._currentMenu);
		this.addChild(menu);
		menu.attachToParent(AttachInfo.Center);
		this._currentMenu = menu;

		this.resizeToFitChildren();
	}

	private onLoginSubmit = (data:Object) => {
		var username:string = data["username"];
		var password:string = data["password"];

		console.log("LOGIN as " + username + "#");// + password);
		Game.instance.loginManager.login(username, password);
	}
}