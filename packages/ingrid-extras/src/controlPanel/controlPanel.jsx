import React from 'react';
import {FlexBox, Component} from '@heswell/finlay';
import ColumnPicker from './columnPicker';
import ColumnEditor from './columnEditor';
import SimpleList from '../list/simpleList';

import './controlPanel.css';

function logMissingCallbackProps(...propNames){
    const missing = prop => () => console.log(`ControlPanel: ${prop} callback prop missing`)
    return propNames.reduce((map,prop) => (map[prop]=missing(prop), map),{})
}

export default class ControlPanel extends React.Component {

    static defaultProps = {
        ...logMissingCallbackProps(`onChange`,'onColumnTypeChange','onSubscribe')
    }

    constructor(props){
        super(props);

        this.state = {
            selectedColumn: null,
            columnTypes: {}
        };
    }

    render(){

        //TODO use a single flag for dragging/zeroDrag/droppedOnTarget
        const {formatters, availableColumns} = this.props;
        const {selectedColumn, columnTypes} = this.state;

        return (
            <FlexBox className="ControlPanel" style={{...this.props.style,flexDirection: 'row'}}>

                <Component style={{width: 200, borderWidth: 1}} flexible={true}
                    title='Tables' header={{height: 24, menu: false}}>
                    <SimpleList data={this.props.availableTables} onSelectionChange={this.props.onSelectTable}/>
                </Component>

                <ColumnPicker style={{width: 250}} availableColumns={availableColumns} onChange={this.props.onChange}
                    title='Available Columns' header={{height: 24, menu: false}}/>

                {selectedColumn === null
                    ? <div style={{width: 250,borderWidth: 1}}></div>
                    : <ColumnEditor style={{flex: 1, backgroundColor: 'brown'}} onChange={this.changeColumnType}
                        column={selectedColumn} columnType={columnTypes[selectedColumn.name]} formatters={formatters}/> }

                <Component style={{flex: 1,borderWidth: 1}} flexible={true}>
                    <button onClick={this.subscribe}>Subscribe</button>
                </Component>

            </FlexBox>
        );
    }

    removeDraggedItemFromAvailableList = () => {
        const {list0, dragged} = this.state;
        this.setState({
            dragged: {item: null},
            list0: {...list0, items: list0.items.filter(item => item !== dragged.item)}
        });
    }

    handleMeasure = (rect, componentName) => {
        const state = this.state[componentName];
        this.setState({
            [componentName]: {...state, rect}
        });
    };

    subscribe = () => {
        const {list1, list2} = this.state;
        this.props.onSubscribe(list1.items.concat(list2.items), list1.items);
    }

    handleSelectionChange = (column, isSelected/*, componentName*/) => {
        this.setState({selectedColumn: isSelected ? column : null});
    }

    changeColumnType = (column, columnType) => {
        console.log(`change Column type ${column.name} ${JSON.stringify(columnType)}`);

        const columnTypes = {
            ...this.state.columnTypes,
            [column.name]: columnType
        };
        // why set state, allow the props to re-enter
        this.setState({ columnTypes });
        this.props.onColumnTypeChange(column, columnType);
    }

    // layout BoxModel contains an identical function
    containsPoint(rect, x,y){
        var {top, left, right, bottom} = rect;
        return x >= left && x < right && y >= top && y < bottom;
    }
}
