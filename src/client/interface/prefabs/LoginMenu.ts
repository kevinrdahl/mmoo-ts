import InterfaceElement from '../InterfaceElement';
import TextElement from '../TextElement';
import AttachInfo from '../AttachInfo';
import Panel from '../Panel';
import ElementList from '../ElementList';
import TextField from '../TextField';
import Game from '../../Game';
import InputManager from '../InputManager';
import GameEvent from '../../events/GameEvent';
import TextFieldListManager from './TextFieldListManager';
import TextButton from '../TextButton';

export default class LoginMenu extends InterfaceElement {
	private _bg:Panel;
	private _list:ElementList;
	private _textFieldManager:TextFieldListManager;

	constructor() {
		super();
		this._className = "LoginMenu";

		this._list = new ElementList(300, ElementList.VERTICAL, 6, ElementList.CENTRE);

		//Add things to list...
		var text:TextElement;
		var userNameField:TextField;
		var passwordField:TextField;
		var button:TextButton

		//Title
		text = new TextElement("MMO Online", TextElement.bigText);
		this._list.addChild(text, 10); //add extra padding between form and title

		//Username
		text = new TextElement("Username", TextElement.basicText);
		text.id = "usernameLabel";
		this._list.addChild(text);
		userNameField = new TextField(250, 28, TextElement.basicText, TextField.alphabets.abc123);
		userNameField.id = "usernameField";
		this._list.addChild(userNameField);

		//Pass
		text = new TextElement("Password", TextElement.basicText);
		text.id = "passwordLabel";
		this._list.addChild(text);
		passwordField = new TextField(250, 28, TextElement.basicText);
		passwordField.id = "passwordField";
		passwordField.hidden = true;
		this._list.addChild(passwordField, 10);

		//Buttons (Log In and Register)
		var buttonContainer:ElementList = new ElementList(30, ElementList.HORIZONTAL, 10, ElementList.CENTRE);

		button = new TextButton("Log In", TextButton.colorSchemes.green);
		buttonContainer.addChild(button);
		button.addEventListener(GameEvent.types.ui.LEFTMOUSECLICK, this.onSubmit);

		button = new TextButton("Register");
		buttonContainer.addChild(button);
		button.addEventListener(GameEvent.types.ui.LEFTMOUSECLICK, this.onClickRegister);

		this._list.addChild(buttonContainer);

		//Resize to fit, and attach bg an list
		this._bg = new Panel(this._list.width + 40, this._list.height + 40, Panel.BASIC);
		this.resize(this._bg.width, this._bg.height);
		this.addChild(this._bg);
		this.addChild(this._list);
		this._bg.attachToParent(AttachInfo.Center);
		this._list.attachToParent(AttachInfo.Center);

		//Focus first field
		InputManager.instance.focus(this.getElementById("usernameField"));

		//Set up field manager
		this._textFieldManager = new TextFieldListManager([
			userNameField,
			passwordField
		]);
		this._textFieldManager.addEventListener(GameEvent.types.ui.SUBMIT, this.onSubmit);
	}

	public onSubmit = (e:GameEvent) => {
		var userNameField:TextField = this.getElementById("usernameField") as TextField;
		var passwordField:TextField = this.getElementById("passwordField") as TextField;

		console.log("LOGIN as " + userNameField.text + "#" + passwordField.text);
	}

	public onClickRegister = (e:GameEvent) => {
		console.log("I wanna make an account");
	}
}