/// <reference path="../../declarations/pixi.js.d.ts"/>
/// <reference path="../../declarations/createjs/soundjs.d.ts"/>

//import Log = require('./util/Log');
import * as Log from './util/Log';
import Connection from './Connection';
import TextureLoader from './textures/TextureLoader';
import TextureWorker from './textures/TextureWorker';
import SoundManager from './sound/SoundManager';
//import SoundAssets = require('./sound/SoundAssets');
import * as SoundAssets from './sound/SoundAssets';

import InterfaceElement from './interface/InterfaceElement';
import Panel from './interface/Panel';
import TextElement from './interface/TextElement';
import ElementList from './interface/ElementList';
import AttachInfo from './interface/AttachInfo';

export default class Game {
	public static instance: Game = null;
	public static useDebugGraphics: boolean = true;

	/*=== PUBLIC ===*/
	public stage: PIXI.Container = null;
	public renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer = null;
	public viewWidth: number = 500;
	public viewHeight: number = 500;
	public interfaceRoot: InterfaceElement;
	public textureLoader: TextureLoader;
	public debugGraphics: PIXI.Graphics;
	public connection: Connection;
	public textureWorker: TextureWorker;

	get volatileGraphics(): PIXI.Graphics { this._volatileGraphics.clear(); return this._volatileGraphics }

	/*=== PRIVATE ===*/
	private _volatileGraphics = new PIXI.Graphics();
	private _documentResized: boolean = true;

	constructor(
		public viewDiv: HTMLElement
	) { } //funky!

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
		this.renderer = PIXI.autoDetectRenderer(500, 500, { backgroundColor: 0xaaaaff });
		this.renderer.autoResize = true; //TS PIXI doesn't like this as an option
		this.viewDiv.appendChild(this.renderer.view);

		//Worker
		this.textureWorker = new TextureWorker('js/mmoo-worker.js');

		//Listen for resize
		window.addEventListener('resize', ()=>this._documentResized = true);

		//Add root UI element
		this.interfaceRoot = new InterfaceElement();
		this.interfaceRoot.id = "root";
		this.interfaceRoot.name = "root";
		this.interfaceRoot.addToContainer(this.stage);

		//Debug graphics
		this.debugGraphics = new PIXI.Graphics();
		this.stage.addChild(this.debugGraphics);

		this.connect();

		this.render();
	}

	private render() {
		if (this._documentResized) {
			this._documentResized = false;
			this.resize();
		}

		if (Game.useDebugGraphics) this.debugGraphics.clear();

		this.interfaceRoot.draw();

		var renderer = this.renderer as PIXI.SystemRenderer;
		renderer.render(this.stage);

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

		this.connection = new Connection("localhost", 9002);
		this.connection.onConnect = ()=>this.onConnect();
		this.connection.onMessage = (msg:string)=>this.onConnectionMessage(msg);
		this.connection.onError = (e:Event)=>this.onConnectionError(e);
		this.connection.onDisconnect = ()=>this.onDisconnect();

		this.connection.connect();
	}

	private onConnect() {
		this.loadTextures();
		this.connection.send("Hello!");
	}

	private onConnectionMessage(msg:string) {

	}

	private onConnectionError(e:Event) {

	}

	private onDisconnect() {

	}

	private onTextureWorkerGetTexture = (requestKey:string, texture:PIXI.Texture) => {
		var sprite:PIXI.Sprite = new PIXI.Sprite(texture);
		sprite.scale.x = 5;
		sprite.scale.y = 5;
		sprite.position.x = 100;
		sprite.position.y = 100;
		this.stage.addChild(sprite);
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

		this.textureWorker.getTexture('parts/helmet', {from:[0x555555], to:[0xff0000]}, this.onTextureWorkerGetTexture);
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
			SoundManager.instance.playMusic("music/fortress");
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
	}
}
