import { createRow } from '@heswell/viewserver/dist/dataTables/testTable/create-row';

export const data = [];
const rowCount = 10;

for (let i = 0; i < rowCount; i++) {
  data.push(createRow(i));
}
