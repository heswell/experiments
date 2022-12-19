import shell from 'shelljs';
import { build } from './esbuild.mjs';

import fs from 'fs';
import { formatBytes, readPackageJson } from './utils.mjs';
const NO_DEPENDENCIES = {};

const defaultConfig = {
  distPath: `dist`,
  jsx: 'transform'
};

export default async function main(customConfig) {
  const args = process.argv.slice(2);

  const config = {
    ...defaultConfig,
    ...customConfig
  };

  const packageJson = readPackageJson();
  const { distPath: DIST_PATH } = config;

  const { name: scopedPackageName, peerDependencies = NO_DEPENDENCIES } = packageJson;

  const [, packageName] = scopedPackageName.split('/');

  const external = Object.keys(peerDependencies);

  const workerTS = 'src/worker.ts';
  const indexTS = 'src/index.ts';
  const indexJS = 'src/index.js';
  const indexCSS = 'index.css';

  const outdir = `${DIST_PATH}`;
  // const outdir = `${DIST_PATH}/${packageName}`;
  const watch = args.includes('--watch');
  const development = watch || args.includes('--dev');

  const hasWorker = fs.existsSync(workerTS);
  const isTypeScript = fs.existsSync(indexTS);
  const isJavaScript = fs.existsSync(indexJS);

  const buildConfig = {
    entryPoints: [isTypeScript ? indexTS : isJavaScript ? indexJS : indexCSS],
    env: development ? 'development' : 'production',
    external,
    format: config.format,
    // outdir: `${DIST_PATH}/${packageName}`,
    outdir,
    name: scopedPackageName
  };

  function createDistFolder() {
    const path = `${DIST_PATH}`;
    // const path = `${DIST_PATH}/${packageName}`;
    shell.rm('-rf', path);
    shell.mkdir('-p', path);
  }

  const GeneratedFiles = /^(worker|index)\.(js|css)(\.map)?$/;

  async function writePackageJSON() {
    return new Promise((resolve, reject) => {
      const { files } = packageJson;
      if (files) {
        const filesToPublish = files.filter((fileName) => !GeneratedFiles.test(fileName));
        if (filesToPublish.length) {
          filesToPublish.forEach((fileName) => {
            const filePath = fileName.replace(/^\//, './');
            shell.cp('-r', filePath, `${outdir}`);
          });
        }
      }
      const newPackage = {
        ...packageJson,
        main: 'index.js',
        module: 'index.js',
        types: 'types/index.d.ts'
      };
      fs.writeFile(`${outdir}/package.json`, JSON.stringify(newPackage, null, 2), (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  createDistFolder();

  if (hasWorker) {
    // this has to complete first, the inline worker will be consumed ny subsequent build
    await build(inlineWorkerConfig);
  }

  const [, { metafile }] = await Promise.all([writePackageJSON(), build(buildConfig)]).catch(
    (e) => {
      console.error(e);
      process.exit(1);
    }
  );

  const {
    outputs: { [`${outdir}/index.js`]: jsOut, [`${outdir}/index.css`]: cssOut }
  } = metafile;

  if (jsOut) {
    console.log(`\tindex.js:  ${formatBytes(jsOut.bytes)}`);
  }
  if (cssOut) {
    console.log(`\tindex.css: ${formatBytes(cssOut.bytes)}`);
  }
}
