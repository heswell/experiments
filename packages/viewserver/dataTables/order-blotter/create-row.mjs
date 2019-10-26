
function choose(choices) {
  return choices[Math.floor(Math.random() * choices.length)];
}

function random(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const STATUS = ['pending', 'in-progress', 'done', 'cancelled']
const DIRECTION = ['buy', 'sell'];
const CCY = ['GBP', 'USD', 'EUR']

export default function createRow(idx, columns) {
  
  
  return {
    "OrderId": `ORD1230${idx+1}`,
    "Status": choose(STATUS),
    "Direction": choose(DIRECTION) ,
    "ISIN": "GB00BH4HKS39",
    "Quantity": random(1000, 100000),
    "Price": random(150, 25000) / 100,
    "Currency": choose(CCY),
    "timestamp": +(new Date())
    }
}
