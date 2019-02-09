import LocalView from '../../../data/view/localView';
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

  test('create empty localView', () => {
    const localView = new LocalView();
    expect(localView.size).toBe(0)
  });

  test('create localView with data, check size is correct', () => {
    const view = LocalView.from(data, { columns });
    expect(view.size).toBe(1247)
  });

  test('register for data changes', done => {
    const view = LocalView.from(data, { columns });
    view.on(DataTypes.ROW_DATA, (msgType, rows, rowCount/*, selected*/) => {
      expect(msgType).toBe(DataTypes.ROW_DATA);
      expect(rowCount).toBe(1247);
      expect(rows.length).toBe(15)
      done();
    })

    view.setRange(0,15)

  })


})