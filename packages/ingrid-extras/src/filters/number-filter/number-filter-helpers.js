const DEFAULT_STATE = { op1: 'GE', val1: '', op2: 'LE', val2: '' };

export function buildFilter(column, op1, val1, op2, val2) {

  const filter1 = {
      type: op1,
      colName: column.name,
      value: parseFloat(val1)
  };

  if (op1 === 'EQ' || op1 === 'NE' || val2 === '') {
      return filter1;
  }

  const filter2 = {
      type: op2,
      colName: column.name,
      value: parseFloat(val2)
  };

  return { type: 'AND', filters: [filter1, filter2], isNumeric: true };

}

export function extractStateFromFilter(filter) {
  if (!filter) {
      return DEFAULT_STATE;
  } else if (filter.type === 'AND') {
      const [f1, f2] = filter.filters;
      return {
          op1: f1.type,
          val1: f1.value,
          op2: f2.type,
          val2: f2.value
      };
  } else {
      return {
          op1: filter.type || 'GE',
          val1: filter.value || '',
          op2: '',
          val2: ''
      };
  }
}
