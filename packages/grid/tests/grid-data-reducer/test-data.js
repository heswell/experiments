module.exports = {
  rows: [
  [100, 0, 0, 0, 0, 'key-00'],
  [101, 0, 0, 0, 0, 'key-01'],
  [102, 0, 0, 0, 0, 'key-02'],
  [103, 0, 0, 0, 0, 'key-03'],
  [104, 0, 0, 0, 0, 'key-04'],
  [105, 0, 0, 0, 0, 'key-05'],
  [106, 0, 0, 0, 0, 'key-06'],
  [107, 0, 0, 0, 0, 'key-07'],
  [108, 0, 0, 0, 0, 'key-08'],
  [109, 0, 0, 0, 0, 'key-09'],
  [110, 0, 0, 0, 0, 'key-10'],
  [111, 0, 0, 0, 0, 'key-11'],
  [112, 0, 0, 0, 0, 'key-12'],
  [113, 0, 0, 0, 0, 'key-13'],
  [114, 0, 0, 0, 0, 'key-14'],
  [115, 0, 0, 0, 0, 'key-15'],
  [116, 0, 0, 0, 0, 'key-16'],
  [117, 0, 0, 0, 0, 'key-17'],
  [118, 0, 0, 0, 0, 'key-18'],
  [119, 0, 0, 0, 0, 'key-19'],
  [120, 0, 0, 0, 0, 'key-20'],
  [121, 0, 0, 0, 0, 'key-21'],
  [122, 0, 0, 0, 0, 'key-22'],
  [123, 0, 0, 0, 0, 'key-23'],
  [124, 0, 0, 0, 0, 'key-24'],
  [125, 0, 0, 0, 0, 'key-25'],
  [126, 0, 0, 0, 0, 'key-26'],
  [127, 0, 0, 0, 0, 'key-27'],
  [128, 0, 0, 0, 0, 'key-28'],
  [129, 0, 0, 0, 0, 'key-29'],
],
getRows: (from, to, offset=100) => {
  const results = [];
  for (let i=from; i<to; i++){
    results.push([i+offset, 0,0,0, `key-${format(i)}`])
  }
  return results;
}
}

const format = n => `000${n}`.slice(-3);