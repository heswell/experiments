import React from 'react';
import ReactDOM from 'react-dom';
import './numberFilter.css';
import { BinView } from '../../data';
import Dygraph from 'dygraphs';
import barChartPlotter from '../dygraphs/barchartPlotter';

const DEFAULT_STATE = { op1: 'GE', val1: '', op2: 'LE', val2: '' };

export class NumberFilter extends React.Component {

    _filterChart;

    constructor(props) {
        super(props);

        const { filter } = this.props;
        const filterView = new BinView(props.dataView);
        
        this.state = {
            ...this.extractStateFromFilter(filter),
            filterView,
            values: filterView.getBins()
        };

        filterView.on('filterBins', this.onFilterBins);
    }

    onFilterBins = (bins) => {
        console.log(`numberFilter onFilterBins`,bins);
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

    onChange = evt => {
        const { name, value } = evt.target;
        this.setState({ [name]: value });
    }

    apply = () => {
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

        return { type: 'AND', filters: [filter1, filter2] };

    }

    selectRange(min, max) {

        console.log(`select range ${min} - ${max}`,this.state.values);
        const { values } = this.state;
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
        const { height, column } = this.props;
        const { op1, val1, op2, val2 } = this.state;
        const width = column.width + 100;

        return (
            <div className='FilterPanel NumberFilter' style={{ width: width+2, height: height + 35 }}>
                <div className='filter-chart' ref={c => this._filterChart = ReactDOM.findDOMNode(c)}
                    style={{width}}>

                </div>
                <div className='filter-row'>
                    <select name='op1' value={op1} onChange={this.onChange}>
                        <option value='GE'>GE</option>
                        <option value='GT'>GT</option>
                        <option value='LE'>LE</option>
                        <option value='LT'>LT</option>
                        <option value='EQ'>EQ</option>
                        <option value='NE'>NE</option>
                    </select>
                    <input name='val1' type='text' value={val1} onChange={this.onChange} />
                </div>
                <div className='filter-row'>
                    <select name='op2' value={op2} onChange={this.onChange}>
                        <option value='LE'>LE</option>
                        <option value='LT'>LT</option>
                        <option value='GE'>GE</option>
                        <option value='GT'>GT</option>
                    </select>
                    <input name='val2' type='text' value={val2} onChange={this.onChange} />
                </div>
                <div className='filter-row'>
                    <span>Save filter ...</span>
                </div>
                <div className='buttons'>
                    <button className='button-apply' onClick={this.props.onClose}>Done</button>
                </div>
            </div>
        );
    }

    getRangeFromState(){
        const {val1, val2, filterView} = this.state;
        const values = filterView.getBins();

        if (val1 && val2){
            return [indexOf(val1,values) - 0.5, indexOf(val2,values) + 0.5];
        } else {
            return [];
        }
    }

    componentDidMount() {
        this.createGraph();
    }

    componentWillUnmount() {
        this.props.onHide();
    }

    createGraph(){
        const values = this.state.filterView.getBins();
        let [_minX = 0, _maxX = 0] = this.getRangeFromState();
        console.log(`cdm (${_minX}) (${_maxX})`);
        const _maxRange = values.length + 1;
        const _values = values.map(([x, y]) => [x, y]);

        const graph = new Dygraph(
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
                    _minX = minDate;
                    _maxX = maxDate;
                    graph.updateOptions({
                        dateWindow: [0, _maxRange],
                        valueRange: null
                    });

                    this.selectRange(minDate, maxDate);
                },
                underlayCallback: function (canvas, area, g) {
                    //onsole.log(`underlayCallback (${_minX}) (${_maxX})`);
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
}
