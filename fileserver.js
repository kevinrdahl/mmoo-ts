var express = require('express');
var app = express();

var where = '/public';
var port = 9090;

app.use(express.static(__dirname + where));

app.listen(port);
console.log('HTTP server running on port ' + port);
console.log('Serving ' + __dirname + where);
