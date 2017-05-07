/// <reference path="../declarations/pixi.js.d.ts"/>
/// <reference path="../declarations/createjs/soundjs.d.ts"/>

//import Log = require('./util/Log');
import * as Log from './util/Log';
import Connection from './Connection';
import LoginManager from './LoginManager';
import TextureLoader from './textures/TextureLoader';
import TextureWorker from './textures/TextureWorker';
import * as TextureGenerator from './textures/TextureGenerator';
import SoundManager from './sound/SoundManager';
//import SoundAssets = require('./sound/SoundAssets');
import * as SoundAssets from './sound/SoundAssets';

import InterfaceRoot from './interface/prefabs/InterfaceRoot';
import InterfaceElement from './interface/InterfaceElement';
import Panel from './interface/Panel';
import TextElement from './interface/TextElement';
import ElementList from './interface/ElementList';
import AttachInfo from './interface/AttachInfo';
import MainMenu from './interface/prefabs/MainMenu';
import InputManager from './interface/InputManager';
import GameEvent from './events/GameEvent';
import GameEventHandler from './events/GameEventHandler';
import Room from './room/Room';

import * as MessageTypes from '../common/messages/MessageTypes';
import Message from '../common/messages/Message';

export default class Game extends GameEventHandler {
	public static instance: Game = null;
	public static useDebugGraphics: boolean = false;

	/*=== PUBLIC ===*/
	public stage: PIXI.Container = null;
	public renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer = null;
	public viewDiv:HTMLElement = null;
	public viewWidth: number = 500;
	public viewHeight: number = 500;
	public interfaceRoot: InterfaceRoot;
	public textureLoader: TextureLoader;
	public debugGraphics: PIXI.Graphics;
	public connection: Connection;
	public textureWorker: TextureWorker;
	public loginManager:LoginManager = new LoginManager();

	get volatileGraphics(): PIXI.Graphics { this._volatileGraphics.clear(); return this._volatileGraphics }

	/*=== PRIVATE ===*/
	private _volatileGraphics = new PIXI.Graphics(); //to be used when drawing to a RenderTexture
	private _documentResized: boolean = true;
	private _gameId:number = -1;
	private _roomId:number = -1;

	private _lastDrawTime:number = 0;
	private _currentDrawTime:number = 0;

	private _room:Room = null;

	public get gameId():number { return this._gameId; }
	public get roomId():number { return this._roomId; }
	public get inGame():boolean { return this._gameId > -1; }
	public get inRoom():boolean { return this._roomId > -1; }

	constructor(viewDiv: HTMLElement) {
		super();
		this.viewDiv = viewDiv;
	}

	public init() {
		Log.setLogType("debug", new Log.LogType("", "#999"));
		Log.setLogType("error", new Log.LogType("ERROR: ", "#f00"));
		Log.log("debug", "Initializing game...");

		if (Game.instance === null) {
			Game.instance = this;
		} else {
			Log.log("error", "There's already a game! Aborting Init");
			return;
		}

		//Add the renderer to the DOM
		this.stage = new PIXI.Container();
		this.renderer = PIXI.autoDetectRenderer(500, 500, { backgroundColor: 0x0066ff });
		this.renderer.autoResize = true; //TS PIXI doesn't like this as an option
		this.viewDiv.appendChild(this.renderer.view);

		//Worker
		this.textureWorker = new TextureWorker('js/mmoo-worker.js');

		//Listen for resize
		window.addEventListener('resize', ()=>this._documentResized = true);

		//Add root UI element
		InterfaceElement.maskTexture = TextureGenerator.simpleRectangle(null, 8, 8, 0xffffff, 0,);
		this.interfaceRoot = new InterfaceRoot(this.stage);

		//Set up InputManager
		InputManager.instance.init("#viewDiv");

		//Debug graphics
		this.debugGraphics = new PIXI.Graphics();
		this.stage.addChild(this.debugGraphics);

		this.connect();
		this.render();
	}

	private render() {
		this._currentDrawTime = Date.now() / 1000;
		if (this._lastDrawTime <= 0) this._lastDrawTime = this._currentDrawTime;
		var timeDelta:number = this._currentDrawTime - this._lastDrawTime;


		if (this._documentResized) {
			this._documentResized = false;
			this.resize();
		}

		if (Game.useDebugGraphics) this.debugGraphics.clear();

		this.interfaceRoot.draw();

		if (this._room) {
			this._room.update(timeDelta);
		}

		var renderer = this.renderer as PIXI.SystemRenderer;
		renderer.render(this.stage);

		this._lastDrawTime = this._currentDrawTime;
		requestAnimationFrame(()=>this.render());
	}

	private resize() {
		this.viewWidth = this.viewDiv.clientWidth;
		this.viewHeight = this.viewDiv.clientHeight;

		this.renderer.resize(this.viewWidth, this.viewHeight);

		this.interfaceRoot.resize(this.viewWidth, this.viewHeight);
	}

	private connect() {
		var loadingText = new TextElement("Connecting...", TextElement.veryBigText);
		loadingText.id = "loadingText";
		this.interfaceRoot.addChild(loadingText);
		loadingText.attachToParent(AttachInfo.Center);

		this.connection = new Connection("localhost", 9191);
		this.connection.onConnect = ()=>this.onConnect();
		this.connection.onMessage = (msg:Message)=>this.onConnectionMessage(msg);
		this.connection.onError = (e:Event)=>this.onConnectionError(e);
		this.connection.onDisconnect = ()=>this.onDisconnect();

		this.connection.connect();
	}

	private onConnect() {
		this.loadTextures();
	}

	private onConnectionMessage(message:Message) {
		switch (message.type) {
			case MessageTypes.USER:
				this.loginManager.onUserMessage(message as MessageTypes.UserMessage);
				break;

			case MessageTypes.GAME_JOINED:
				this.onJoinGame(message as MessageTypes.GameJoined);
				break;

			case MessageTypes.ROOM_JOINED:
				this.onJoinRoom(message as MessageTypes.RoomJoined);
				break;

			default:
				if (this._room) {
					this._room.onMessage(message);
				} else {
					console.log("Received unhandled message from server:" + message.serialize());
					console.log(message);
				}
		}
	}

	private onJoinGame(message:MessageTypes.GameJoined) {
		this._gameId = message.gameId;
	}

	private onJoinRoom(message:MessageTypes.RoomJoined) {
		this._roomId = message.roomId;
		this.removeMainMenu();

		if (this._room) {
			this._room.cleanup();
			this.stage.removeChild(this._room.container);
		}

		this._room = new Room();
		this._room.init(message.roomId);
		this.stage.addChildAt(this._room.container, 0);
	}

	private onConnectionError(e:Event) {
		alert("Connection error! Is the server down?");
	}

	private onDisconnect() {
		alert("Disconnected from server!");
	}

	private onTextureWorkerGetTexture = (requestKey:string, texture:PIXI.Texture) => {
		/*var sprite:PIXI.Sprite = new PIXI.Sprite(texture);
		sprite.scale.x = 5;
		sprite.scale.y = 5;
		sprite.position.x = 100;
		sprite.position.y = 100;
		this.stage.addChild(sprite);*/
	};

	private loadTextures() {
		Log.log("debug", "=== LOAD TEXTURES ===");

		var loadingText: TextElement = this.interfaceRoot.getElementById("loadingText") as TextElement;
		loadingText.text = "Loading textures...";

		this.textureLoader = new TextureLoader("textures.png", "textureMap.json", ()=>this.onTexturesLoaded());
	}

	private onTexturesLoaded() {
		this.sendGraphicsToWorker();
		this.loadSounds();

		//this.textureWorker.getTexture('parts/helmet', {from:[0x555555], to:[0xff0000]}, this.onTextureWorkerGetTexture);
	}

	private sendGraphicsToWorker() {
		var data = this.textureLoader.getData();
		this.textureWorker.putTextures(data);
	}

	private loadSounds() {
		var list = SoundAssets.interfaceSounds.concat(SoundAssets.mainMenuMusic);
		SoundManager.instance.load("initial", list, (which:string)=>this.onSoundsLoaded(which), (which:string, progress:number)=>this.onSoundsLoadedProgress(which, progress));

		var loadingText: TextElement = this.interfaceRoot.getElementById("loadingText") as TextElement;
		loadingText.text = "Loading sounds... (0%)";
	}

	private onSoundsLoaded(which: string) {
		if (which == "initial") {
			//SoundManager.instance.playMusic("music/fortress");
			this.initMainMenu();
		}
	}

	private onSoundsLoadedProgress(which: string, progress: number) {
		if (which == "initial") {
			var loadingText: TextElement = this.interfaceRoot.getElementById("loadingText") as TextElement;
			loadingText.text = "Loading sounds... (" + Math.round(progress*100) + "%)";
		}
	}

	private initMainMenu() {
		var loadingText: TextElement = this.interfaceRoot.getElementById("loadingText") as TextElement;
		this.interfaceRoot.removeChild(loadingText);

		var mainMenu:MainMenu = new MainMenu();
		this.interfaceRoot.addDialog(mainMenu);
		mainMenu.attachToParent(AttachInfo.Center);
		mainMenu.showLogin();
	}

	private removeMainMenu() {
		var mainMenu:InterfaceElement = this.interfaceRoot.getElementByFunction(function(element:InterfaceElement) {
			return element instanceof MainMenu;
		});

		if (mainMenu) mainMenu.removeSelf();
	}
}
