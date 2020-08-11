const banner = `
export default function createWorker(tableUrl){
  const blobArray = [workerCode.toString().slice(22,-1)];
  const blob = new Blob(blobArray, { type: 'text/javascript' });
  const url = URL.createObjectURL(blob) + \`#?\${tableUrl}\`; 
  const worker = new Worker(url);
  URL.revokeObjectURL(url);
  return worker;
}
function workerCode(){`

const footer = `}`

export default function workerPlugin(){
  return {
    name: 'worker',
    banner,
    footer
  }
}

