import React from 'react';
import cx from 'classnames';
import {createGraph} from './number-filter-chart';
import {extractStateFromFilter, buildFilter} from './number-filter-helpers.js';

import {FlexBox} from '@heswell/inlay';
import {BinnedDataView as BinView} from '@heswell/data';
import {filter as filterUtils} from '@heswell/data';

import './number-filter.css';

const NO_STYLE = {}

export class NumberFilter extends React.Component {

    constructor(props) {
        super(props);

        this.graph = null;
        this.chartEl = React.createRef();
        this.binnedValues = [];

        const { column, filter, dataView } = this.props;
        const columnFilter = filterUtils.extractFilterForColumn(filter, column.name);

        this.filterView = new BinView(dataView, column);
        
        this.state = {
            ...extractStateFromFilter(columnFilter)
        };

    }

    componentDidMount(){
        this.filterView.subscribe({range:{lo:-1,hi:-1}}, values => this.onFilterBins(values));
        const {val1, val2} = this.state;
        this.graph = createGraph(
            this.chartEl.current, 
            this.binnedValues, 
            val1, 
            val2,
            (min, max) => this.selectRange(min, max) 
        );
    }

    componentWillUnmount(){
        this.filterView.destroy();
        this.graph.destroy();
        this.props.onHide();
    }

    onFilterBins(values){
        console.log(`onFilterBins`, values, this.graph)
        if (this.graph){
            this.graph.destroy()
            if (values.length){
                this.binnedValues = values;
                const {val1, val2} = this.state;
                this.graph = createGraph(
                    this.chartEl.current, 
                    values, 
                    val1, 
                    val2,
                    (min, max) => this.selectRange(min, max) 
                );
                this.graph.updateOptions({
                    file: values.map(([x, y]) => [x, y]),
                })
            }
        } else {
            this.binnedValues = values;
        }
    }

    onChange(evt){
        const { name, value } = evt.target;
        this.setState({ [name]: value });
    }

    apply(){
        const { column, onApplyFilter } = this.props;
        const { op1, val1, op2, val2 } = this.state;
        const filter = buildFilter(column, op1, val1, op2, val2);
        onApplyFilter(column, filter);
        this.filterView.filter(filter);
    }

    selectRange(lo, hi) {

        console.log(`select Range ${lo} to ${hi}`);

        this.setState({
            op1: 'GE',
            val1: lo,
            op2: 'LE',
            val2: hi
        }, () => {
            this.apply();
        });

    }

    render() {
        const {
            column,
            className,
            width = column.width + 100,
            style=NO_STYLE
        } = this.props;

        const { op1, val1, op2, val2 } = this.state;

        return (
            <FlexBox className={cx('NumberFilter', className)} style={style}>
                <div className='filter-chart'
                    ref={this.chartEl}
                    style={{width, height: 60}} />
                
                <div className="filter-control-row" style={{height: 24}}>
                    <div className="input-wrapper">
                        <input name='val1' type='text' value={val1} onChange={e => this.onChange(e)} />
                    </div>
                    <div className="input-wrapper">
                        <input name='val2' type='text' value={val2} onChange={e => this.onChange(e)} />
                    </div>
                </div>    
                
                <div className='filter-control-row filter-select' style={{height: 20}}>
                    <div className="input-wrapper">
                        <select name='op1' value={op1} onChange={e => this.onChange(e)}>
                            <option value='GE'>GE</option>
                            <option value='GT'>GT</option>
                            <option value='LE'>LE</option>
                            <option value='LT'>LT</option>
                            <option value='EQ'>EQ</option>
                            <option value='NE'>NE</option>
                        </select>
                    </div>
                    <div className="input-wrapper">
                        <select name='op2' value={op2} onChange={e => this.onChange(e)}>
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

}
