import shell from 'shelljs';

const args = process.argv.slice(2);
const dev = args.includes('--dev') ? ' --dev' : '';

function buildPackage(packageName) {
  shell.cd(`vuu/vuu-ui/packages/${packageName}`);
  shell.exec(`node ../../../../scripts/run-build-vuu.mjs${dev}`);
  shell.cd('../../../..');
}

const packages = ['utils', 'datagrid-parsers'];

packages.forEach((packageName) => buildPackage(packageName));
