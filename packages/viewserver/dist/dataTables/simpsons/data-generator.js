var SECURITIES = ["AAPL.N", "AMZN.N", "QQQ.N", "NVDA.N", "TSLA.N", "FB.N", "MSFT.N", "TLT.N", "XIV.N", "YY.N", "CSCO.N", "GOOGL.N", "PCLN.N"];
var CLIENTS = ["Homer", "Marge", "Bart", "Lisa", "Maggie", "Moe", "Lenny", "Carl", "Krusty"];
var TABLE_SIZE = 1e4;
function choose(choices) {
  return choices[Math.floor(Math.random() * choices.length)];
}
const data = function newRows(total_rows) {
  const results = [];
  for (var x = 0; x < total_rows; x++) {
    results.push([
      x,
      choose(SECURITIES),
      choose(CLIENTS),
      new Date(),
      Math.random() * 20 - 10,
      Math.random() * 10 + 90,
      Math.random() * 10 + 100,
      Math.random() * 10 + 100
    ]);
  }
  return results;
}(TABLE_SIZE);
console.log(`created ${data.length} rows of Simpsons`);
var data_generator_default = data;
export {
  data_generator_default as default
};
//# sourceMappingURL=data-generator.js.map
