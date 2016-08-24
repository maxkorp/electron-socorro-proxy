var upload = require('multer')({ dest: 'uploads/' })
var uuid = require('uuid-v4');
var fs = require('fs');
var config = require('./config');

module.exports = (app) => {
  app.post(
    '/submit',
    upload.single('upload_file_minidump'),
    (reqIn, resIn) => {
      var guid = uuid();
      console.log(guid, 'got a request');
      var formData = {};
      Object.keys(reqIn.body).forEach((key) => {
        formData[key] = reqIn.body[key];
      });
      formData.Version = formData._version;
      formData.ProductName = formData._productName;
      formData.upload_file_minidump = fs.createReadStream(reqIn.file.path);

      var headers = {};
      Object.keys(reqIn.headers).forEach((key) => {
        if (key.indexOf('content-') == -1) {
          headers[key] = reqIn.headers[key];
        }
      });
      headers.Host = headers.host = config.hostHeader;

      var postData = {
        url: config.url,
        formData: formData,
        headers: headers
      };
      console.log(guid, 'posting now');
      request.post(postData)
        .on('error', function(err) {
          console.error(guid, err);
          resIn.status(500).send(err);
        })
        .on('response', function(resUpstream) {
          var body = '';
          resUpstream.on('data', function(data) {
            body += data;
          });
          resUpstream.on('end', function() {
            body = body.replace('CrashID=', '');
            resIn.status(resUpstream.statusCode).send(body);
            console.log(guid, 'Upload successful!', resUpstream.statusCode, body);
          });
        });
    }
  );
};
