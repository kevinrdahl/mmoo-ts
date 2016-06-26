import Util = require('../common/Util');
import Log = require('./util/Log');

export default class Connection {
    public onConnect: ()=> void;
    public onDisconnect: ()=> void;
    public onMessage: (msg:string)=>void;
    public onError: (e:Event)=>void;

    private connString:string = "";
    private socket:WebSocket = null;

    constructor (
        public hostName:string,
        public port:number
    ){
        Log.setLogType("conn", new Log.LogType("", "#fff", "#06c"));
        Log.setLogType("connSend", new Log.LogType("SEND: ", "#93f"));
        Log.setLogType("connRecv", new Log.LogType("RECV: ", "#06c"));

        this.connString = 'ws://' + hostName + ':' + port;
    }

    public connect() {
        if (this.socket != null) {this.disconnect("reconnecting");}

        this.socket = new WebSocket(this.connString);
        this.socket.addEventListener("open", this.onSocketConnect);
        this.socket.addEventListener("close", this.onSocketDisconnect);
        this.socket.addEventListener("message", this.onSocketMessage);
        this.socket.addEventListener("error", this.onSocketError);
    }

    public disconnect(reason:string="???") {
        this.socket.close(1000, reason);
        this.socket = null;
    }

    public send(msg:string) {
        try {
            this.socket.send(msg);
        } catch (err) {
            Log.log("error", err.toString());
        }
    }

    private onSocketConnect = (e:Event) => {
        Log.log("conn", "Connected to " + this.connString);
        this.onConnect();
    };

    private onSocketDisconnect = (e:Event) => {
        Log.log("conn", "Disconnected from " + this.connString);
    };

    private onSocketError = (e:Event) => {
        Log.log("error", "CONNECTION " + e.toString());
        this.onError(e);
    };

    private onSocketMessage = (message:MessageEvent) => {
        Log.log("connRecv", message.data);
        this.onMessage(message.data);
    };
}
