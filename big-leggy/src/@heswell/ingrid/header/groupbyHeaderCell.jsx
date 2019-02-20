import React from 'react';
import cx from 'classnames';
import HeaderCell from './headerCell';
import Draggable from '../draggable/draggable';
import {expandStatesfromGroupState} from '../model/utils';
import css from '../style/grid';
import './header.css';

const ColHeader = (props) => {
    const {column, className, onClick, onRemoveColumn, expandState, onToggle} = props
    return (
        <div className={cx('ColHeader', className,{expanded: expandState === 1, collapsed: expandState === -1})}>
            <i className='fa fa-caret' onClick={() => onToggle(column, -expandState)}></i>
            <span className='ColHeaderLabel' onClick={() => onClick(column)}>{column.name}</span>
            <div className='groupby-remove' onClick={() => onRemoveColumn(column)} >
                <i className='material-icons icon'>cancel</i>
            </div>
        </div>
    );
};

export default class GroupbyHeaderCell extends HeaderCell {

    render() {
        const {column: groupCol, groupState, onRemoveColumn} = this.props;
        const {columns, resizing, width} = groupCol;
        const className = cx(
            'GroupbyHeaderCell HeaderCell group',
            this.props.className,
            resizing ? 'HeaderCell--resizing': ''
        );
        const expandStates = expandStatesfromGroupState(groupCol, groupState);
        return (
            <div className={className} style={{...css.HeaderCell, paddingLeft: 0,width: width}}
                onContextMenu={this.handleContextMenu}>
                <div className='inner-container'>
                    {columns.map(
                        (column,idx) => <ColHeader
                            key={column.key}
                            column={column}
                            expandState={expandStates[idx]}
                            onClick={this.clickColumn}
                            onRemoveColumn={onRemoveColumn}
                            onToggle={this.props.onToggleGroupState}
                            className={columnClassName(columns, idx, column)}
                        />)}
                </div>
                <Draggable className='resizeHandle' onDrag={this.handleResize} onDragStart={this.handleResizeStart} onDragEnd={this.handleResizeEnd} />
            </div>
        );
    }
}

function columnClassName(columns, idx/*, column*/){

    const classes = [];

    if (idx === 0){
        classes.push('first');
    }

    if (idx === columns.length-1){
        classes.push('last');
    }

    return classes.join(' ');

}
