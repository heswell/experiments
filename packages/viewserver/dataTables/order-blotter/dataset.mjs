import createRow from './create-row.mjs';

const count = 100;

const data = [];


for (let i=0; i<count; i++){
  data.push(createRow(i));
}


export default data;