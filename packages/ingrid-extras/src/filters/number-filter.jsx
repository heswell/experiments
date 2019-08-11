import React from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames';
import Dygraph from 'dygraphs';

import {FlexBox} from '@heswell/inlay';
import {BinnedDataView as BinView} from '@heswell/data';
import {filter as filterUtils} from '@heswell/data';

import SearchBar from './filter-toolbar.jsx'

import barChartPlotter from '../dygraphs/barchartPlotter';

import './number-filter.css';

const DEFAULT_STATE = { op1: 'GE', val1: '', op2: 'LE', val2: '' };
const NO_STYLE = {}

export class NumberFilter extends React.Component {

    constructor(props) {
        super(props);

        this.graph = null;
        this._filterChart = null;
        this.binnedValues = [];

        const { column, filter, dataView } = this.props;
        const columnFilter = filterUtils.extractFilterForColumn(filter, column.name);

        this.filterView = new BinView(dataView);
        
        this.state = {
            ...this.extractStateFromFilter(columnFilter)
        };

    }

    componentDidMount(){
        this.filterView.subscribe({range:{lo:-1,hi:-1}}, values => this.onFilterBins(values));
        this.createGraph();
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
                this.createGraph();
                this.graph.updateOptions({
                    file: values.map(([x, y]) => [x, y]),
                })
            }
        } else {
            this.binnedValues = values;
        }
    }

    extractStateFromFilter(filter) {
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
                op1: filter.type,
                val1: filter.value,
                op2: null,
                val2: ''
            };
        }
    }

    onChange(evt){
        const { name, value } = evt.target;
        this.setState({ [name]: value });
    }

    apply(){
        const { column, onApplyFilter } = this.props;
        const { op1, val1, op2, val2 } = this.state;
        onApplyFilter(column, this.buildFilter(column, op1, val1, op2, val2));
    }

    buildFilter(column, op1, val1, op2, val2) {

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

    componentWillReceiveProps(nextProps){
        if (nextProps.filter !== this.props.filter){
            console.log(`[NumberFilter] got new filter ${JSON.stringify(nextProps.filter)}`)
        }
    }

    selectRange(min, max) {

        console.log(`select range ${min} - ${max}`);
        const values = this.binnedValues;
        const loIdx = Math.ceil(min);
        const hiIdx = Math.floor(max);
        const lo = values[loIdx - 1][2];
        const hi = values[Math.min(hiIdx,values.length)-1][3];

        console.log(`select Range ${loIdx} -  ${hiIdx} === ${lo} to ${hi}`);

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
            height,
            width = column.width + 100,
            style=NO_STYLE,
            suppressHeader=false,
            suppressSearch=false,
            suppressFooter=false
        } = this.props;
        const { op1, val1, op2, val2 } = this.state;
        // const width = column.width + 100;

        return (
            <FlexBox className={cx('NumberFilter','ColumnFilter', className)} style={{width,height,visibility: style.visibility}}>
                {suppressHeader !== true &&
                <div className='col-header HeaderCell' style={{height: 25}}>
                    <div className='col-header-inner' style={{width: column.width-1}}>{column.name}</div>
                </div>}
                <FlexBox className='filter-inner' style={{flex: 1}}>
                {suppressSearch !== true &&
                    <SearchBar style={{height: 25}}
                        inputWidth={column.width-16}
                        searchText={''}
                        onSearchText={this.handleSearchText}
                    />}
                    <div className='filter-chart'
                        ref={c => this._filterChart = ReactDOM.findDOMNode(c)}
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

                    <div className='filter-row' style={{flex: 1}}>
                        <span>Save filter ...</span>
                    </div>
                    {suppressFooter !== true &&
                    <div key='footer' className='footer' style={{height: 26}}>
                        <button className='filter-done-button' onClick={this.props.onClose}>Done</button>
                    </div>}
                </FlexBox>
            </FlexBox>        

        );
    }

    // note this range, if not [0,0] will cause selection to be highlighted in graph
    getRangeFromState(){
        const {val1, val2} = this.state;
        const values = this.binnedValues
        console.log(`getRange from state ${val1} ${val2}`,values)        

        if (val1 && val2){
            const idx1 = indexOf(val1,values);
            const idx2 = indexOf(val2,values); 
            if (idx1 === -1 || idx2 === -1){
                return [0,0]
            } else {
                return [idx1, idx2]
            }
        } else {
            return [0,0];
        }
    }

    createGraph(){
        const values = this.binnedValues;
        if (!values || values.length === 0){
            return;
        }
        console.log(values)
        let [_minX = 0, _maxX = 0] = this.getRangeFromState();
        console.log(`cdm (${_minX}) (${_maxX})`);
        const _maxRange = values.length + 1;
        const _values = values.map(([x, y]) => [x, y]);

        const graph = window.graph = this.graph = new Dygraph(
            this._filterChart,
            _values,
            {
                width: 240,
                height: 60,
                axes: {
                    x: { drawAxis: false, drawGrid: false },
                    y: { drawAxis: false, drawGrid: false }
                },
                xRangePad: 3,
                animatedZooms: false,
                zoomCallback: (minDate, maxDate/*, yRanges*/) => {
                    console.log(`zoomCallback (${minDate}) (${maxDate})`);
                    _minX = minDate;
                    _maxX = maxDate;
                    graph.updateOptions({
                        dateWindow: [0, _maxRange],
                        valueRange: null
                    });

                    this.selectRange(minDate, maxDate);
                },
                underlayCallback: function (canvas, area, g) {
                    console.log(`underlayCallback (${_minX}) (${_maxX})`);
                    const bottom_left = g.toDomCoords(_minX, -20);
                    const top_right = g.toDomCoords(_maxX, +20);
                    const left = bottom_left[0];
                    const right = top_right[0];

                    canvas.fillStyle = 'rgba(255, 255, 102, 1.0)';
                    canvas.fillRect(left, area.y, right - left, area.h);
                },

                dateWindow: [0, _maxRange],
                includeZero: true,
                showLabelsOnHighlight: false,
                plotter: barChartPlotter
            }
        );

    }
}

function indexOf(val, values){
    for (let i=0;i<values.length;i++){
        if (val >= values[i][2] && val <= values[i][3]){
            return i+1;
        }
    }
    return -1;
}
