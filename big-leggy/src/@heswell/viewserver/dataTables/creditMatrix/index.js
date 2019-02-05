// import path from 'path';
// import url from 'url';
import fs from 'fs';
//const __dirname = path.dirname(new url.URL(import.meta.url).pathname);
const path = fs.realpathSync(process.cwd());

const config = {
    'name': 'CreditMatrix',
    'dataPath': `${path}/data-generator`,
    'type': 'vs',
    'primaryKey': 'id',
    'columns': [
        { 'name': 'id' },
        { 'name': 'organisation' },
        { 'name': 'accountId' },
        { 'name': 'accountName' },
        { 'name': 'cptyOrganisation' },
        { 'name': 'cptyAccountId' },
        { 'name': 'cptyAccountName' },
        { 'name': 'ccy' },
        { 'name': 'maxQuantity' },
        { 'name': 'maxTenor' },
        { 'name': 'usedQuantity' },
        { 'name': 'availableQuantity' },
        { 'name': 'cptyMaxQuantity' },
        { 'name': 'cptyMaxTenor' },
        { 'name': 'cptyUsedQuantity' },
        { 'name': 'cptyAvailableQuantity' },
        { 'name': 'status' }
    ],
    'updates': false
}

export default config;
