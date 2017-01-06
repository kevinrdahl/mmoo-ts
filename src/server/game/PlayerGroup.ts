import Player from './Player';

/**
 * Keeps track of a group of players, and provides convenient, efficient means of managing them.
 */
export default class PlayerGroup {
    //this breaks encapsulation, but hell if I'm making a getter that copies them
    //just be good and don't modify
    public players:Array<Player> = [];
    public playersById:Object = {};

    public get length():number {
        return this.players.length;
    }

    constructor() {

    }

    public addPlayer(player:Player) {
        if (this.playersById.hasOwnProperty(player.id.toString())) return;

        this.players.push(player);
        this.playersById[player.id.toString()] = player;
    }

    public removePlayer(player:Player) {
        if (!this.playersById.hasOwnProperty(player.id.toString())) return;

        var index:number = this.players.indexOf(player);
        this.players.splice(index, 1);
        delete this.playersById[player.id.toString()];
    }

    public containsPlayer(player:Player):boolean {
        return this.containsPlayerByID(player.id)
    }

    public containsPlayerByID(id:number):boolean {
        return this.playersById.hasOwnProperty(id.toString());
    }

    public getPlayerById(id:number):Player {
        var player:Player = this.playersById[id.toString()];
        if (player) return player;
        return null;
    }
}