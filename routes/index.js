const downloadSymbolsRoute = require('./download-symbols-route');
const submitRoute = require('./submit-route');

module.exports = (app) => {
  downloadSymbolsRoute(app);
  submitRoute(app);
};
