import InterfaceElement from '../InterfaceElement';
import TextElement from '../TextElement';
import AttachInfo from '../AttachInfo';
import Panel from '../Panel';
import ElementList from '../ElementList';
import TextField from '../TextField';
import Game from '../../Game';
import InputManager from '../InputManager';

export default class LoginMenu extends InterfaceElement {
	private _bg:Panel;
	private _list:ElementList;

	constructor() {
		super();
		this._className = "LoginMenu";

		this.resize(320, 300);

		this._bg = new Panel(350, 300, Panel.BASIC);
		this.addChild(this._bg);

		this._list = new ElementList(320, ElementList.VERTICAL, 6, ElementList.CENTRE);
		this.addChild(this._list);

		//Add things to list...
		var text:TextElement;
		var field:TextField;

		//Title
		text = new TextElement("MMO Online", TextElement.bigText);
		this._list.addChild(text);

		//Username
		text = new TextElement("Username", TextElement.basicText);
		text.id = "usernameLabel";
		this._list.addChild(text);
		field = new TextField(250, 28, TextElement.basicText);
		field.id = "usernameField";
		this._list.addChild(field);
		field.onTab = (fromElement:InterfaceElement) => {
			InputManager.instance.focus(this.getElementById("passwordField"));
		}

		//Pass
		text = new TextElement("Password", TextElement.basicText);
		text.id = "passwordLabel";
		this._list.addChild(text);
		field = new TextField(250, 28, TextElement.basicText);
		field.id = "passwordField";
		field.hidden = true;
		this._list.addChild(field);
		field.onTab = (fromElement:InterfaceElement) => {
			InputManager.instance.focus(this.getElementById("usernameField"));
		}

		this._bg.attachToParent(AttachInfo.Center);
		this._list.attachToParent(AttachInfo.Center);
	}
}