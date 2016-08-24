const express = require('express');
const config = require('./config');
const routerize = require('./routes');

const app = express();
routerize(app);

console.log('Listening on ' + config.port);
const server = app.listen(config.port);
