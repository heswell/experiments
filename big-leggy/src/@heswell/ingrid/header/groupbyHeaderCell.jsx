import React from 'react';
import cx from 'classnames';
import HeaderCell from './headerCell';
import Draggable from '../draggable/draggable';
import {expandStatesfromGroupState} from '../model/utils';
import css from '../style/grid';
import './header.css';

const styles = {
    groupByHeaderCell: 'GroupbyHeaderCell'
}

const ColHeader = (props) => {
    const {column, className, onClick, onRemoveColumn, expandState, onToggle} = props
    const expanded = expandState === 1;
    return (
        <div className={cx('ColHeader', className,{expanded, collapsed: !expanded})}>
            <i className='material-icons toggle-icon' onClick={() => onToggle(column, -expandState)}>{expanded ? 'arrow_drop_down' : 'arrow_right'}</i>
            <span className='ColHeaderLabel' onClick={() => onClick(column)}>{column.name}</span>
            <i className='material-icons remove-icon' onClick={() => onRemoveColumn(column)}>cancel</i>
        </div>
    );
};

export default class GroupbyHeaderCell extends HeaderCell {

    render() {
        const {column: groupCol, groupState, onRemoveColumn} = this.props;
        const {columns, resizing, width} = groupCol;
        const className = cx(
            styles.groupByHeaderCell,
            'HeaderCell group',
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
