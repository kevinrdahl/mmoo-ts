import * as Util from '../common/Util'; //import Util = require('../common/Util');
import * as Log from './util/Log'; //import Log = require('./util/Log');
import Message from '../common/messages/Message';
import * as MessageTypes from '../common/messages/MessageTypes';

export default class Connection {
    public onConnect: ()=> void;
    public onDisconnect: ()=> void;
    public onMessage: (msg:Message)=>void;
    public onError: (e:Event)=>void;

    private connString:string = "";
    private socket:WebSocket = null;
    private pendingGetCallbacks:Object = {};

    private static getRequestId:number = 0;

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

    public sendMessage(msg:Message) {
        this.send(msg.serialize());
    }

    public getRequest(subject:string, params:Object, callback:(response:any)=>void) {
        var request:MessageTypes.GetRequest = new MessageTypes.GetRequest(subject, Connection.getRequestId, params);
        Connection.getRequestId += 1;

        this.pendingGetCallbacks[request.requestKey] = callback;

        this.sendMessage(request);
    }

    private onGetResponse(response:MessageTypes.GetResponse) {
        var callback = this.pendingGetCallbacks[response.requestKey];
        if (callback) {
            delete this.pendingGetCallbacks[response.requestKey];
            callback(response.response);
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
        //Log.log("connRecv", message.data);
        var parsedMessage:Message = Message.parse(message.data);

        if (parsedMessage) {
            if (parsedMessage.type == MessageTypes.GET_RESPONSE) {
                this.onGetResponse(parsedMessage as MessageTypes.GetResponse);
            } else {
                this.onMessage(parsedMessage);
            }
        } else {
            Log.log("conn", "Unable to parse message: " + message.data);
        }
    };
}
