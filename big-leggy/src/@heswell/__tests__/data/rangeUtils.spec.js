/*global describe test expect */
import { compareRanges, RangeFlags } from '../../data/store/rangeUtils.js'

describe('compareRanges', () => {

    test('fwd contiguous',() => {
        const flags = compareRanges({lo: 0,hi: 10},{lo: 10,hi: 20})
        expect(flags).toBe(RangeFlags.FWD + RangeFlags.CONTIGUOUS);
    });

    test('fwd  overlap (partial)',() => {
        const flags = compareRanges({lo: 0,hi: 10},{lo: 5,hi: 15})
        expect(flags).toBe(RangeFlags.FWD + RangeFlags.OVERLAP);
    });

    test('fwd overlap (complete))',() => {
        const flags = compareRanges({lo: 0,hi: 10},{lo: 0,hi: 12})
        expect(flags).toBe(RangeFlags.FWD+RangeFlags.OVERLAP);
    });

    test('bwd overlap (complete)',() => {
        const flags = compareRanges({lo: 10,hi: 20},{lo: 5, hi: 20})
        expect(flags).toBe(RangeFlags.BWD + RangeFlags.OVERLAP);
    });

    test('reduce 1)',() => {
        const flags = compareRanges({lo: 10,hi: 20},{lo: 10, hi: 19})
        expect(flags).toBe(RangeFlags.REDUCE + RangeFlags.BWD);
    });

    test('reduce 2)',() => {
        const flags = compareRanges({lo: 10,hi: 20},{lo: 11, hi: 20})
        expect(flags).toBe(RangeFlags.REDUCE + RangeFlags.FWD);
    });

    test('reduce 3)',() => {
        const flags = compareRanges({lo: 10,hi: 20},{lo: 11, hi: 15})
        expect(flags).toBe(RangeFlags.REDUCE + RangeFlags.FWD);
    });

    test('expand)',() => {
        const flags = compareRanges({lo: 10,hi: 20},{lo: 9, hi: 25})
        expect(flags).toBe(RangeFlags.EXPAND);
    });

});
