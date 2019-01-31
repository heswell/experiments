import React from 'react';
import {roundDecimal} from '../utils/number';
import {DECIMALS_AUTO} from '../utils/number';

const Right = 'right';
const defaultFormatting = {align:Right, decimals: DECIMALS_AUTO};
const numberOr = (value, fallback) => typeof value === 'number' ? value : fallback;

export default class NumberFormatter {
    
    static cellCSS = ({formatting=defaultFormatting}) => {
        const {align=Right} = formatting;
        if (align === Right){
            return Right;
        } else {
            return '';
        }
    }

    static formatter = (value, {formatting=defaultFormatting}) => {
        const {align, decimals, zeroPad, alignOnDecimals=false} = formatting;
        const numberOfDecimals = numberOr(decimals,4);
        const number = typeof value === 'number' ? value :
                       typeof value === 'string' ? parseFloat(value) :
                       null;
        return <div className='num'>{roundDecimal(number, align, numberOfDecimals, zeroPad, alignOnDecimals)}</div>;
    }

} 