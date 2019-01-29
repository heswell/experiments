import {createRow} from './create-row';

export const data = [];
const rowCount = 10;

for (let i = 0; i < rowCount; i++) {
    data.push(createRow(i));
}
