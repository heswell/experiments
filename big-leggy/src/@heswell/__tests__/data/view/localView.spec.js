import LocalView from '../../../data/view/localView';
import Table from '../../../data/store/table';
import {DataTypes} from '../../../data/store/types';
import data from '../../../viewserver/dataTables/instruments/dataset';

describe('LocalView', () => {
  const locked = true;
  const columns = [
    { name: 'Symbol', width: 120,locked} ,
    { name: 'Name', width: 200,locked} ,
    { name: 'MarketCap', type: 'number', aggregate: 'sum' },
    { name: 'Price', type: { name: 'number', formatting: { decimals:2, zeroPad: true }}},
    { name: 'IPO'},
    { name: 'Sector'},
    { name: 'Industry'}
  ];

  test('register for data changes', done => {
    const view = new LocalView({table: new Table({data, columns })});

    view.subscribe(columns, (msgType, rows, rowCount) => {
      expect(msgType).toBe(DataTypes.ROW_DATA);
      expect(rowCount).toBe(1247);
      expect(rows.length).toBe(15)
      done();
    })

    view.setRange(0,15)

  })


})