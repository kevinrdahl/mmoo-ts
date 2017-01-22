import InterfaceElement from '../InterfaceElement';
import TextElement from '../TextElement';
import AttachInfo from '../AttachInfo';
import Panel from '../Panel';
import ElementList from '../ElementList';
import TextField from '../TextField';

export default class LoginMenu extends InterfaceElement {
	private _bg:Panel;
	private _list:ElementList;

	constructor() {
		super();
		this._className = "LoginMenu";

		this.resize(350, 500);

		this._bg = new Panel(350, 500, Panel.BASICBAR);
		this.addChild(this._bg);

		this._list = new ElementList(350, ElementList.VERTICAL, 5, ElementList.CENTRE);
		this.addChild(this._list);

		var strings:Array<string> = ['One way', 'or another', "I'm gonna find ya"];
		for (var i = 0; i < strings.length; i++) {
			var text:TextElement = new TextElement(strings[i], TextElement.bigText);
			this._list.addChild(text);
		}

		var field:TextField = new TextField(300, 30, TextElement.basicText);
		this._list.addChild(field);

		this._bg.attachToParent(AttachInfo.Center);
		this._list.attachToParent(AttachInfo.Center);
	}
}