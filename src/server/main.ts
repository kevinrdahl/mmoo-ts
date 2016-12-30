/// <reference path='../../declarations/node.d.ts' />

import BaseServer from './BaseServer';
import LoginServer from './LoginServer';
import GameServer from './GameServer';

/*var server:LoginServer = new LoginServer('../../ServerSettings.yaml');
server.init();*/

var gameServer:GameServer = new GameServer("../../ServerSettings.yaml");
gameServer.init();