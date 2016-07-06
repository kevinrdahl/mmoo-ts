/// <reference path='../../declarations/node.d.ts' />

import BaseServer from './BaseServer';
import LoginServer from './LoginServer';

var server:LoginServer = new LoginServer('../../ServerSettings.yaml');
server.init();