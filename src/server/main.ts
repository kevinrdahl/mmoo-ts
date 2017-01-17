/// <reference path='../../declarations/node.d.ts' />

import BaseServer from './BaseServer';
import LoginServer from './LoginServer';
import GameServer from './GameServer';

/*var server:LoginServer = new LoginServer('../../ServerSettings.yaml');
server.init();*/

//http://patorjk.com/software/taag/#p=display&f=Rectangles&t=MMO%20Online
var banner = "\n _____ _____ _____    _____     _ _\n|     |     |     |  |     |___| |_|___ ___\n| | | | | | |  |  |  |  |  |   | | |   | -_|\n|_|_|_|_|_|_|_____|  |_____|_|_|_|_|_|_|___|\n";
console.log(banner);

var gameServer:GameServer = new GameServer("../../ServerSettings.yaml");
gameServer.init();