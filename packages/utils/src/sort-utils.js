const EMPTY_MAP = {};

export function sortByToMap(sortCriteria=null){
  return sortCriteria === null
      ? EMPTY_MAP
      : sortCriteria.reduce((map, col, i) => {
          if (typeof col === 'string') {
              map[col] = i + 1;
          } else {
              const [colName, sortDir] = col;
              map[colName] = sortDir === 'asc' ? (i + 1) : -1 * (i + 1);
          }
          return map;
      }, {});

}
