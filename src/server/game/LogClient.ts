import Message from '../../common/messages/Message';
import Player from './Player';

export default class LogClient {
    private name:String;

    public user:any;
    public player:Player;
    public connected:boolean = true;

    constructor(name:string) {
        this.name = name;
    }

    public send(str:string) {
        console.log("[LOG] " + this.name + ": " + str);
    }

    public sendMessage(msg:Message) {
        this.send(msg.serialize());
    }
}