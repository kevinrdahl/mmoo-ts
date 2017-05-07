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

/**
 * Defines a TextButton to be added
 * If colorScheme is falsey, the button will be blue
 */
export interface ButtonInfo {
	text: string,
	colorScheme: any,
	onClick: (e:GameEvent) => void
}

export default class GenericListDialog extends InterfaceElement {
	private bg: Panel = null;
	private list: ElementList = null;
	private dialogWidth:number;
	private borderPadding:number;
	private textFields:Array<TextField> = [];
	private textFieldManager:TextFieldListManager = null;
	private finalized:boolean = false;

	public onSubmit:(data:Object) => void = null;
	public validator:(data:Object) => boolean = null;

	constructor(width:number = 300, borderPadding:number = 20) {
		super();
		this._className = "GenericListDialog";
		this.dialogWidth = width;
		this.borderPadding = borderPadding;

		this.list = new ElementList(this.dialogWidth, ElementList.VERTICAL, 6, ElementList.CENTRE);

		this.addChild(this.list);
	}

	public draw() {
		if (!this.finalized) {
			console.log(this.fullName + ": auto-finalize (parent size might be wrong!)");
			this.finalize();
		}

		super.draw();
	}

	/**
	 * Set up text fields, resize self, make background. Call it last.
	 */
	public finalize() {
		if (this.finalized) {
			console.warn(this.fullName + ": already finalized!");
			return;
		}

		this.bg = new Panel(this.list.width + this.borderPadding * 2, this.list.height + this.borderPadding * 2, Panel.BASIC);
		this.resize(this.bg.width, this.bg.height);

		console.log(this.fullName + ": finalize " + this.width + ", " + this.height);

		this.addChild(this.bg);
		this.addChild(this.list);

		this.bg.attachToParent(AttachInfo.Center);
		this.list.attachToParent(AttachInfo.Center);

		if (this.textFields.length > 0) {
			this.textFieldManager = new TextFieldListManager(this.textFields);
			this.textFieldManager.addEventListener(GameEvent.types.ui.SUBMIT, (e: GameEvent) => { this.submit(); });
		}

		this.finalized = true;
	}

	public submit(additionalData:Object = null) {
		if (this.onSubmit) {
			var data: Object = this.getSubmitData(additionalData);
			var ok: boolean = true;
			if (this.validator) ok = this.validator(data);

			if (ok) {
				this.onSubmit(data);
			}
		}
		else {
			console.warn(this.fullName + ": no onSubmit function!");
		}
	}

	public getSubmitData(additionalData: Object):Object {
		var data:Object = {};

		for (var textField of this.textFields) {
			data[textField.name] = textField.text;
		}

		if (additionalData) {
			for (var prop in additionalData) {
				data[prop] = additionalData[prop];
			}
		}

		return data;
	}

	public setFields(data:Object) {
		for (var textField of this.textFields) {
			if (data.hasOwnProperty(textField.name)) {
				textField.text = data[textField.name];
			}
		}
	}

	public addBigTitle(text:string, padding:number = 10) {
		var title: TextElement = new TextElement(text, TextElement.bigText);
		title.name = "title";
		this.list.addChild(title, padding); //add extra padding between form and title
	}

	public addMediumTitle(text: string, padding: number = 5) {
		var title: TextElement = new TextElement(text, TextElement.mediumText);
		title.name = "title";
		this.list.addChild(title, padding); //add extra padding between form and title
	}

	public addMessage(text:string, padding:number = 0) {
		var message: TextElement = new TextElement(text, TextElement.basicText);
		this.list.addChild(message, padding); //add extra padding between form and title
	}

	public addTextField(name: string, alphabet: RegExp, hidden: boolean = false, defaultStr: string = "", validator: RegExp = null, padding: number = 0) {
		var field: TextField = new TextField(250, 28, TextElement.basicText, alphabet, validator);
		if (defaultStr) field.text = defaultStr;
		field.hidden = hidden;
		field.name = name;
		this.list.addChild(field, padding);
		this.textFields.push(field);
	}

	public addLabeledTextField(label: string, name: string, alphabet: RegExp, hidden: boolean = false, defaultStr: string = "", validator: RegExp = null, padding: number = 0) {
		this.addMessage(label);
		this.addTextField(name, alphabet, hidden, defaultStr, validator, padding);
	}

	public addButtons(infos: Array<ButtonInfo>, padding: number = 0) {
		var buttonContainer: ElementList = new ElementList(30, ElementList.HORIZONTAL, 10, ElementList.CENTRE);

		for (var info of infos) {
			var colorScheme = info.colorScheme;
			if (!colorScheme) colorScheme = TextButton.colorSchemes.blue;
			var button:TextButton = new TextButton(info.text, colorScheme);
			button.onClick = info.onClick;
			buttonContainer.addChild(button);
		}

		this.list.addChild(buttonContainer, padding);
	}

	public addSubmitAndCloseButtons(submitText: string = "Submit", closeText: string = "Close", padding: number = 0) {
		this.addButtons([
			{ text: submitText, colorScheme: TextButton.colorSchemes.green, onClick: (e: GameEvent) => { this.submit(); } },
			{ text: closeText, colorScheme: TextButton.colorSchemes.red, onClick: (e: GameEvent) => { this.removeSelf(); } }
		], padding);
	}

	public addSpacer(height:number) {
		var spacer:InterfaceElement = new InterfaceElement();
		spacer.resize(10, height);
		this.list.addChild(spacer);
	}
}