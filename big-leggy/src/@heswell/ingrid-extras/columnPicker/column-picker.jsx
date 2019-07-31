import React, {Component} from 'react';
import cx from 'classnames';
import AvailableList from './availableList'; 
import List from './list/list'; 

// don't like this ...
import FlexBox from '../../inlay/flexBox';

const uuid = require('uuid');

export class ColumnPicker extends Component {

    static defaultProps = {
        style: {},
        selectedColumns: [],
        onChange: config => {
            console.log(`[ColumnPicker] onChange ${JSON.stringify(config,null,2)}`)
        },
        onCommit: config => console.log(`[ColumnPicker] onCommit ${JSON.stringify(config,null,2)}`),
        onCancel: () => console.log(`[ColumnPicker] onCancel`)
    };

    constructor(props){
        super(props);
        this.state = {
            layoutModel: this.getLayoutModel(),
            selectedColumns: this.props.columns
        };
    }

    render(){

        const {availableColumns} = this.props;
        const {selectedColumns, dragged, dragging, mouseMoveX, mouseMoveY, pageX, pageY, onTarget} = this.state;

        const availableItems = availableColumns.map(column => ({
            column,
            inUse: selectedColumns.findIndex(({name}) => name === column.name) !== -1
        }));

        var className = cx(
            this.props.className,
            'ColumnPicker'
        );

        return (
            <FlexBox className={className} style={this.props.style}>
                <FlexBox style={{flex: 1, flexDirection: 'row', paddingLeft: 12,paddingRight: 12, paddingTop: 15, paddingBottom: 9}}>
                    <AvailableList style={{flex: 1}} items={availableItems} 
                        onItemAdded={this.handleItemAdded}
                        onMouseDown={this.handleDragStartAvailableItem}/>
                    <List style={{flex: 1, backgroundColor: 'white'}} 
                        items={selectedColumns}
                        dragged={dragged}
                        dragging={dragging}
                        pageX={pageX}
                        pageY={pageY}
                        onTarget={onTarget}
                        mouseMoveX={mouseMoveX}
                        mouseMoveY={mouseMoveY}
                        onItemRemoved={this.handleItemRemoved}
                        onMeasure={this.handleMeasure}
                        onReorder={this.handleReorder} />
                </FlexBox>
            </FlexBox>
        );
    }

    getLayoutModel(){
        
        if (this.state){
            return this.state.layoutModel;
        }
        else {
            var {top=0,left=0, width, height} = this.props.style;
            return {
                type: 'FlexBox',
                $id: this.props.id || uuid.v1(),
                $path: '0',
                $version: 1,
                style: {position: 'absolute', width, height, flexDirection:'column'},
                $position: {top,left,width,height},
                children: []
            };
        }
    }

    submit = () => {
        this.props.onCommit(this.state.selectedColumns);
    };

    cancel = () => {
        this.props.onCancel();
    };

    handleMeasure = rect => {
        console.log(`targetListRect`,rect);
        this.setState({
            targetListRect: rect
        });
    };

    handleReorder = order => {

        var {selectedColumns} = this.state;
        var columns = [];

        order.forEach((idx,i) => {
            columns[i] = selectedColumns[idx];
        });

        this.props.onChange({columns});
    };

    handleItemAdded = item => {
        var selectedColumns = this.state.selectedColumns.concat(item.column);
        this.setState({selectedColumns});	

        this.props.onChange({columns:selectedColumns});
    };

    handleItemRemoved = item => {
        var selectedColumns = this.state.selectedColumns.filter(col => col !== item);
        this.setState({selectedColumns})
        this.props.onChange({columns:selectedColumns});
    };

	// layout BpxModel contains an identical function
    containsPoint(rect, x,y){
        var {top, left, right, bottom} = rect;
        return  x >= left && x < right && y >= top && y < bottom;
    }

    handleDragStartAvailableItem = (item, rect, x, y) => {

        this.setState({
            dragged : {
                item,
                rect,
                // offset of exact mouse position from item left,top
                offetX: x - rect.left, 
                offsetY: y - rect.top,
                startX: x,
                startY:y
            },
            mouseMoveX:0,
            mouseMoveY:0,
            onTarget:false,
            dragging: true
        });

        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mouseup', this.handleMouseUp);

    };


    handleMouseMove = ({pageX, pageY}) => {
        const {
            onTarget:wasOnTarget, 
            targetListRect, 
            dragged:{startX, startY, item},
            selectedColumns} = this.state;

        var onTarget = this.containsPoint(this.state.targetListRect, pageX, pageY);
        
        if (onTarget && !wasOnTarget){
            let pos = Math.floor((pageY - targetListRect.top) / 24); 

            let columns = selectedColumns.slice();
            columns.splice(pos,0,item);
            this.setState({onTarget, selectedColumns:columns});

        }
        else if (wasOnTarget && !onTarget){
            let idx = selectedColumns.indexOf(item);
            if (idx !== -1){
                let columns = selectedColumns.slice();
                columns.splice(idx,1);
                this.setState({onTarget, selectedColumns:columns});
            }
        }
        else if (onTarget && wasOnTarget){

            //onsole.log(`insert pos ${pos}`);
            let pos = Math.floor((pageY - targetListRect.top) / 24); 
            let idx = selectedColumns.indexOf(item);
            if (idx !== -1 && idx !== pos){
                let columns = selectedColumns.slice();
                columns.splice(idx,1);
                columns.splice(pos,0,item);
                this.setState({onTarget, selectedColumns:columns});
            }

        }

        this.setState({mouseMoveX: pageX - startX, mouseMoveY: pageY - startY, pageX, pageY });
    }

    handleMouseUp = () => {

        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mouseup', this.handleMouseUp);

        this.setState({dragging: false});

        this.props.onChange({columns: this.state.selectedColumns});
    }

}