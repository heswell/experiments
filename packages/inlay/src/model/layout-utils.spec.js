import { computeLayout as computeLayoutYoga } from './layoutUtils';

describe('layout-utils', () => {
  test('simple box', () => {

    const model = {};
    const width = 100;
    const height = 100;
    const top = 0;
    const left = 0;

    const result = computeLayoutYoga(model, width, height, top, left);
    console.log(JSON.stringify(result,null,2));

    expect(1).toEqual(1);

  })
})