const routeFn = (req, res) => {
  res.status(200).send('OK');
}

function getFileName(platform, version) {
  return `electron-v${version}-${platform}-x64-symbols.zip`;
}

module.exports = (app) => app.get('/download-electron-symbols', routeFn);
