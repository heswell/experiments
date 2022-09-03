function dataCollector(value) {
  switch (typeof value) {
    case "number":
      return numberCollector();
    case "string":
      return stringCollector();
    default:
      return stringCollector();
  }
}
function stringCollector(adjustCase = true) {
  const _keys = {};
  let _count = 0;
  let _total = 0;
  return {
    add: (value) => {
      const v = adjustCase ? value.toLowerCase() : value;
      if (typeof _keys[v] === "number") {
        _keys[v] += 1;
      } else {
        _keys[v] = 1;
        _count += 1;
      }
      _total += 1;
    },
    values: () => Object.getOwnPropertyNames(_keys).sort().map((key) => ({ name: key, count: _keys[key] })),
    cardinality: () => _count
  };
}
function numberCollector() {
  return {
    add: () => {
    },
    values: () => [],
    counts: () => 0,
    cardinality: () => 0
  };
}
export {
  dataCollector as default,
  stringCollector
};
//# sourceMappingURL=dataCollector.js.map
