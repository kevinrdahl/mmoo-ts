import InterfaceElement from '../InterfaceElement';

export default class InterfaceRoot extends InterfaceElement {
    public static readonly LayerNames = {
        gameUI: "gameUI",   //action bars, minimap, etc
        dialogs: "dialogs", //inventory, character screen, windows
        alerts: "alerts",   //think raid warnings
        popups: "popups"    //warning boxes, error messages, confirmations
    }
    private static readonly LayerOrder = ["gameUI", "dialogs", "alerts", "popups"];

    private layers:Object = {};

    constructor(container:PIXI.Container) {
        super();

        container.addChild(this._displayObject);
        this.name = "root";
        this.id = "root";

        for (var layerName of InterfaceRoot.LayerOrder) {
            var layer:InterfaceElement = new InterfaceElement();
            this.addChild(layer);
            layer.resizeToParent();
        }
    }

    private getLayer(name:string):InterfaceElement {
        var layer:InterfaceElement = this.layers[name];
        if (!layer) return null;

        return layer;
    }

    public addUI(element:InterfaceElement) {
        this.getLayer(InterfaceRoot.LayerNames.gameUI).addChild(element);
    }

    public addDialog(element:InterfaceElement) {
        this.getLayer(InterfaceRoot.LayerNames.dialogs).addChild(element);
    }

    public addAlert(element:InterfaceElement) {
        this.getLayer(InterfaceRoot.LayerNames.alerts).addChild(element);
    }

    public addPopup(element:InterfaceElement) {
        this.getLayer(InterfaceRoot.LayerNames.popups).addChild(element);
    }
}