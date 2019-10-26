var SECURITIES = ["AAPL.N", "AMZN.N", "QQQ.N", "NVDA.N", "TSLA.N", "FB.N", "MSFT.N", "TLT.N", "XIV.N", "YY.N", "CSCO.N", "GOOGL.N", "PCLN.N"];
var CLIENTS = ["Homer", "Marge", "Bart", "Lisa", "Maggie", "Moe", "Lenny", "Carl", "Krusty"];

// Size limit of the server-side table
var TABLE_SIZE = 10000;

function choose(choices) {
    return choices[Math.floor(Math.random() * choices.length)];
}

const data = (function newRows(total_rows){
    const results = [];
    for (var x = 0; x < total_rows; x++) {
        results.push([
            /* seq: */ x,
            /* name: */ choose(SECURITIES),
            /* client: */ choose(CLIENTS),
            /* lastUpdate: */ new Date(),
            /* chg: */ Math.random() * 20 - 10,
            /* bid: */ Math.random() * 10 + 90,
            /* ask: */ Math.random() * 10 + 100,
            /* vol: */ Math.random() * 10 + 100
        ]);
    }
    return results;
})(TABLE_SIZE)


console.log(`created ${data.length} rows of Simpsons`);

export default data;