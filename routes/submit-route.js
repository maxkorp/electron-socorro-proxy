const fs = require('fs');
const moment = require('moment');
const multer = require('multer');
const request = require('request');
const url = require('url');
const uuid = require('uuid-v4');

const config = require('../config');
const upload = multer({ dest: 'uploads/' })

const sumbit = (reqIn, resIn) => {
  const guid = uuid();
  const logBase = (logger, args) => {
    const message = args.join('\n');
    const now = ${moment().format(YY.MM.DD);
    logger(`${now} - ${guid}: ${message}`);
  };

  const log = () => {
    const args = Array.prototype.slice(arguments, 0);
    const logger = console.log.bind(console);
    logBase(logger, args);
  };

  const logError = () => {
    const args = Array.prototype.slice(arguments, 0);
    const logger = console.error.bind(console);
    logBase(logger, args);
  };

  log('got a request');

  const formData = {};
  Object.keys(reqIn.body).forEach((key) => {
    formData[key] = reqIn.body[key];
  });
  formData.Version = formData._version;
  formData.ProductName = formData._productName;
  formData.upload_file_minidump = fs.createReadStream(reqIn.file.path);

  const headers = {};
  Object.keys(reqIn.headers).forEach((key) => {
    if (key.indexOf('content-') == -1) {
      headers[key] = reqIn.headers[key];
    }
  });
  headers.Host = config.hostHeader;
  headers.host = config.hostHeader;

  var postData = {
    url: config.url,
    formData: formData,
    headers: headers
  };

  log('posting now');
  request.post(postData)
    .on('error', (err) => {
      logError(err);
      resIn.status(500).send(err);
    })
    .on('response', (resUpstream) => {
      var body = '';
      resUpstream.on('data', function(data) {
        body += data;
      });
      resUpstream.on('end', () => {
        body = body.replace('CrashID=', '');
        resIn.status(resUpstream.statusCode).send(body);
        log('Upload successful!', resUpstream.statusCode, body);
      });
    });
};

module.exports =
  (app) => app.post('/submit', upload.single('upload_file_minidump'), submit);
