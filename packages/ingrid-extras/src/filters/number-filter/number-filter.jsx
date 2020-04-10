import React, {useEffect, useRef, useState} from 'react';
import cx from 'classnames';
import {createGraph} from './number-filter-chart';
import {extractStateFromFilter, buildFilter} from './number-filter-helpers.js';

import {FlexBox} from '@heswell/inlay';
import { extractFilterForColumn} from '@heswell/utils';

import './number-filter.css';

const NO_STYLE = {}

export const NumberFilter = ({
    className,
    column,
    dataView,
    filter,
    onHide,
    style=NO_STYLE
}) => {

    const graph = useRef(null);
    const chartEl = useRef(null);
    const columnFilter = useRef(extractFilterForColumn(filter, column.name));
    const [binnedValues, setBinnedValues] = useState([]);
    const [state, setState] = useState(extractStateFromFilter(columnFilter))

    useEffect(() => {
        dataView.subscribe({range:{lo:-1,hi:-1}}, values => filterBins(values));
        const {val1, val2} = state;
        setGraph(binnedValues, val1, val2)
        // TODO unsubscribe ?
    }, [dataView]);

    // Note: returns a function, on unmount only ...
    useEffect(() => () => {
        //graph.current.destroy(); // runtime exception
        onHide();
    }, []);

    const filterBins = (values) => {
        if (graph.current){
            graph.current.destroy();
        }
        if (chartEl.current){ 
            if (values.length){
                setBinnedValues(values);
                const {val1, val2} = state;
                setGraph(values, val1, val2)
                graph.current.updateOptions({
                    file: values.map(([x, y]) => [x, y]),
                })
            }
        } else {
            setBinnedValues(values);
        }
    }

    const setGraph = (values, val1, val2) => {
        graph.current = createGraph(
            chartEl.current, 
            values, 
            val1, 
            val2,
            (min, max) => applyChanges(min, max) 
        );
    }

    const onChange = evt => {
        const { name, value } = evt.target;
        const {val1, val2, op1, op2} = {
            ...state,
            [name]: value 
        };
        applyChanges(val1, val2, op1, op2);
    }

    const applyChanges = (val1, val2, op1='GE', op2='LE') => {
        const filter = buildFilter(column, op1, val1, op2, val2);
        dataView.filter(filter);
        setState({ ...state, op1, val1, op2, val2 });
    }

    const { op1, val1, op2, val2 } = state;

    return (
        <FlexBox className={cx('NumberFilter', className)} style={style}>
            <div className='filter-chart'
                ref={chartEl}
                style={{width: style.width, height: 60}} />
            
            <div className="filter-control-row" style={{height: 24}}>
                <div className="input-wrapper">
                    <input name='val1' type='text' value={val1} onChange={onChange} />
                </div>
                <div className="input-wrapper">
                    <input name='val2' type='text' value={val2} onChange={onChange} />
                </div>
            </div>    
            
            <div className='filter-control-row filter-select' style={{height: 20}}>
                <div className="input-wrapper">
                    <select name='op1' value={op1} onChange={onChange}>
                        <option value='GE'>GE</option>
                        <option value='GT'>GT</option>
                        <option value='LE'>LE</option>
                        <option value='LT'>LT</option>
                        <option value='EQ'>EQ</option>
                        <option value='NE'>NE</option>
                    </select>
                </div>
                <div className="input-wrapper">
                    <select name='op2' value={op2} onChange={onChange}>
                        <option value='LE'>LE</option>
                        <option value='LT'>LT</option>
                        <option value='GE'>GE</option>
                        <option value='GT'>GT</option>
                    </select>
                </div>
            </div>
        </FlexBox>        
    );
}
