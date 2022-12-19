import fs from 'fs';

const rewriteDependencyVersions = (dependencies, version) => {
  let deps = Object.keys(dependencies).slice();
  deps.forEach((pckName) => {
    if (pckName.startsWith('@vuu-ui')) {
      dependencies[pckName] = version;
    }
  });
};

export const bumpDependencies = (pathToPackage) => {
  let rawdata = fs.readFileSync(pathToPackage);
  let json = JSON.parse(rawdata);
  let { version, dependencies, peerDependencies } = json;
  if (dependencies || peerDependencies) {
    dependencies && rewriteDependencyVersions(dependencies, version);
    peerDependencies && rewriteDependencyVersions(peerDependencies, version);
    fs.writeFileSync(pathToPackage, JSON.stringify(json, null, 2));
  }
};

export const readPackageJson = (path = 'package.json') => {
  let rawdata = fs.readFileSync(path);
  let json = JSON.parse(rawdata);
  return json;
};

function frontPad(text, length) {
  const spaces = Array(length).fill(' ').join('');
  return (spaces + text).slice(-length);
}

export const formatBytes = (bytes, decimals = 2, displayLength = 10) => {
  if (bytes === 0) return '0 Bytes';
  const { log, floor, pow } = Math;

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = floor(log(bytes) / log(k));
  return frontPad(parseFloat((bytes / pow(k, i)).toFixed(dm)) + ' ' + sizes[i], displayLength);
};
