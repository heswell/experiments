import { build } from 'esbuild';
import fs from 'fs';
import { formatBytes, readPackageJson } from './utils.mjs';
const NO_DEPENDENCIES = {};

async function main() {
  const args = process.argv.slice(2);

  const {
    name: packageName,
    peerDependencies = NO_DEPENDENCIES,
    scripts,
    version
  } = readPackageJson();
  const external = Object.keys(peerDependencies);

  const indexTS = 'src/index.ts';
  const indexJS = 'src/index.js';

  const outfile = 'index.js';
  const watch = args.includes('--watch');
  const skipTypedefs = args.includes('--skip-typedefs');
  const development = watch || args.includes('--dev');

  const isTypeScript = fs.existsSync(indexTS);

  async function esbuild() {
    const start = process.hrtime();
    return build({
      entryPoints: [isTypeScript ? indexTS : indexJS],
      bundle: true,
      define: {
        'process.env.NODE_ENV': development ? `"development"` : `"production"`,
        'process.env.NODE_DEBUG': `false`
      },
      external,
      format: 'esm',
      loader: {
        '.woff2': 'dataurl'
      },
      metafile: true,
      minify: development !== true,
      platform: 'node',
      outdir: 'dist',
      // outfile,
      target: 'esnext',
      sourcemap: true,
      watch
    }).then((result) => {
      const [seconds, nanoSeconds] = process.hrtime(start);
      console.log(
        `[${packageName}] esbuild took ${seconds}s ${Math.round(nanoSeconds / 1_000_000)}ms`
      );
      return result;
    });
  }

  const [{ metafile }] = await Promise.all([esbuild()]).catch((e) => {
    console.error(e);
    process.exit(1);
  });

  const mainFilePattern = /(index.js|index.css)$/;
  const mainFiles = Object.keys(metafile.outputs).filter((fileName) =>
    fileName.match(mainFilePattern)
  );

  mainFiles.forEach((fileName) => {
    const { bytes } = metafile.outputs[fileName];
    console.log(`\n[${packageName}@${version}] \t${outfile}:  ${formatBytes(bytes)}`);
  });
}

main();
