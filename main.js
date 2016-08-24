const bodyParser = require('body-parser');
const express = require('express');
const config = require('./config');
const routerize = require('./routes');

const app = express();
app.use(bodyParser.json());
routerize(app);

console.log(`Listening on ${config.port}`);
app.listen(config.port);
