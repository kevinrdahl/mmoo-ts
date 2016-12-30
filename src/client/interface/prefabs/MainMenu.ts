import InterfaceElement from '../InterfaceElement';
import TextElement from '../TextElement';
import AttachInfo from '../AttachInfo';
import * as Log from '../../util/Log';

export default class MainMenu extends InterfaceElement {
	private _currentMenuName:string = "";
	private _currentMenu:InterfaceElement = null;

	private _loginMenu:InterfaceElement;
	private _registerMenu:InterfaceElement;

	constructor() {
		super();

		this._className = "MainMenu";
		this._loginMenu = new TextElement("Login!", TextElement.veryBigText);
	}

	public showMenu(name:string) {
		if (name == this._currentMenuName) {
			Log.log('debug', 'MainMenu already on "' + name + '"');
			return;
		}

		if (this._currentMenu) this.removeChild(this._currentMenu);

		switch(name) {
			case "login": this.showLogin(); break;
		}
	}

	private showLogin() {
		Log.log('debug', 'MainMenu: login');
		this._currentMenuName = "login";
		this._currentMenu = this._loginMenu;

		this.addChild(this._loginMenu);
		this._loginMenu.attachToParent(AttachInfo.Center);

		console.log(this);
	}
}