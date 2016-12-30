import * as Crypto from '../util/Crypto';

console.log('=== CRYPTO ===');

var pass = 'abc123';
var hash = Crypto.hashPassword(pass);
console.log('password "' + pass + '" => "' + hash + '"\n');

var equal = Crypto.checkPassword(pass, hash);
console.log('compare using correct password: ' + equal);

equal = Crypto.checkPassword('aaaa', hash);
console.log('compare using incorrect password: ' + equal);