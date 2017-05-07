import InterfaceElement from '../InterfaceElement';
import GenericListDialog from './GenericListDialog';
import TextButton from '../TextButton';
import GameEvent from '../../events/GameEvent';
import InputManager from '../InputManager';
import AttachInfo from '../AttachInfo';
import Vector2D from '../../../common/Vector2D';

export default class InterfaceRoot extends InterfaceElement {
    public static readonly LayerNames = {
        gameUI: "gameUI",   //action bars, minimap, etc
        dialogs: "dialogs", //inventory, character screen, windows
        alerts: "alerts",   //think raid warnings
        popups: "popups"    //warning boxes, error messages, confirmations
    }
    private static readonly LayerOrder = ["gameUI", "dialogs", "alerts", "popups"];

    private static _instance:InterfaceRoot = null;
    public static get instance():InterfaceRoot {
        return InterfaceRoot._instance;
    }

    private layers:Object = {};

    constructor(container:PIXI.Container) {
        super();
        InterfaceRoot._instance = this;

        container.addChild(this._displayObject);
        this.name = "root";
        this.id = "root";

        this.useDebugRect = false;

        for (var layerName of InterfaceRoot.LayerOrder) {
            var layer:InterfaceElement = new InterfaceElement();
            this.addChild(layer);
            layer.resizeToParent();
            layer.name = layerName;
            layer.useDebugRect = false;
            this.layers[layerName] = layer;
        }
    }

    public getElementAtPoint(point: Vector2D): InterfaceElement {
         var popups: InterfaceElement = this.getLayer(InterfaceRoot.LayerNames.popups);
         if (popups.numChildren > 0) {
             //if there are popups, only they can be clicked
             return popups.getElementAtPoint(point);
         }

         return super.getElementAtPoint(point);
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

    public showWarningPopup(message: string, title: string = null, onClose:()=>void = null) {
        var dialog:GenericListDialog = new GenericListDialog(200, 10);
        if (title) dialog.addMediumTitle(title, 0);
        dialog.addMessage(message, 5);
        dialog.addButtons([
            {text: "Close", colorScheme: TextButton.colorSchemes.red, onClick:(e:GameEvent) => {
                dialog.removeSelf();
                if (onClose) {
                    onClose();
                }
            }}
        ]);
        dialog.finalize();

        this.addPopup(dialog);
        dialog.attachToParent(AttachInfo.Center);
        InputManager.instance.focus(null);
    }
}