const fse = require('fs-extra-promise');
const path = require('path');
const request = require('request');
const unzip = require('unzip');

const downloadedPath = path.join(__dirname, '..', 'downloaded');
const statusFile = path.join(downloadedPath, 'status');

fse.ensureDirSync(downloadedPath);
fse.ensureFileSync(statusFile);

const status = fse.readJsonSync(statusFile, { throws: false }) || {};

const getFileName = (arch, platform, version) => {
  return `electron-v${version}-${platform}-${arch}-symbols`;
};

const getUrl = (arch, platform, version) => {
  const fileName = getFileName(arch, platform, version);
  const baseUrl = 'https://github.com/electron/electron/releases/download';
  return `${baseUrl}/v${version}/${fileName}.zip`;
};

const addStatus = (fileName) => {
  console.log(`Done downloading symbols for ${fileName}`);
  status[fileName] = true;
  fse.writeJsonSync(statusFile, status);
};

const downloadFile = (arch, platform, version) => {
  const fileName = getFileName(arch, platform, version);
  const filePath = path.join(downloadedPath, fileName);
  const zipPath = `${filePath}.zip`;
  const uri = getUrl(arch, platform, version);

  console.log(filePath);
  console.log(uri);
  return new Promise((resolve, reject) => {
    request({ uri })
      .pipe(fse.createWriteStream(zipPath))
      .on('close', resolve)
      .on('error', reject);
  }).then(() => {
    return new Promise((resolve, reject) => {
      fse.createReadStream(zipPath)
        .pipe(unzip.Extract({ path: filePath })) // eslint-disable-line new-cap
        .on('close', resolve)
        .on('error', reject);
    });
  }).then(() => {
    fse.removeSync(zipPath);
  });
};

const copySymbols = (arch, platform, version) => {
  const fileName = getFileName(arch, platform, version);
  const folderPath = path.join(downloadedPath, fileName, 'electron.breakpad.syms');
  console.log(`Copying symbols for ${fileName}`);
  return fse.readdirAsync(folderPath)
    .then((folders) => {
      return folders.reduce((promise, folderName) => {
        return promise.then(() => {
          const folderToMove = path.join(folderPath, folderName);
          const destination = path.join('/home/socorro/symbols', folderName);
          return fse.moveAsync(folderToMove, destination);
        });
      }, Promise.resolve());
    })
    .then(() => {
      console.log(`Done copying symbols for ${fileName}`);
    });
};

const downloadIfNeeded = (arch, platform, version) => {
  const fileName = getFileName(arch, platform, version);
  if (status[fileName]) {
    console.log(`Already have symbols for ${fileName}`);
    return Promise.resolve();
  }

  console.log(`Downloading symbols for ${fileName}`);
  return downloadFile(arch, platform, version)
    .then(() => copySymbols(arch, platform, version))
    .then(() => addStatus(fileName));
};

const getMatrix = (versions = []) => {
  const arches = {
    darwin: ['x64'],
    linux: ['arm', 'ia32', 'x64'],
    win32: ['ia32', 'x64']
  };

  const output = [];
  versions.forEach((version) => {
    Object.keys(arches).forEach((platform) => {
      arches[platform].forEach((arch) => {
        output.push({ arch, platform, version });
      });
    });
  });
  return output;
};

const routeFn = (req, res) => {
  const versions = req.body.versions || [req.body.version];

  console.log(`Potentially downloading symbols for ${versions.join(', ')}`);
  const matrix = getMatrix(versions);
  res.status(200).send(`Potentially downloading symbols for ${versions.join(', ')}`);

  matrix
    .reduce((promise, { arch, platform, version }) => {
      return promise.then(() => downloadIfNeeded(arch, platform, version));
    }, Promise.resolve())
    .then(() => {
      console.log(`Finished potentially downloading symbols for ${versions.join(', ')}`);
    })
    .catch((e) => {
      console.error(`Error while potentially downloading symbols for ${versions.join(', ')}`);
      console.error(e);
    });
};

module.exports = (app) => app.post('/download-electron-symbols', routeFn);
