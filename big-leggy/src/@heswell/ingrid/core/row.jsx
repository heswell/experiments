import React from 'react';
import cx from 'classnames';
import {getCellRenderer} from '../registry/dataTypeRegistry';

const GROUP_LEVEL = 1;
const NULL_FORMATTER = () => {};

export default class Row extends React.Component {

    static defaultProps = {
        onContextMenu: () => {},
        onDoubleClick: () => {}
    };

    render() {

        const { row, isFocused, isSelected, isLastSelected, rowClass,
            cellClass: rowCellClass, idx: rowIdx, columns, style, onCellClick } = this.props;

        const groupLevel = row[GROUP_LEVEL];
        const isGroup = groupLevel !== 0;

        const className = cx(
            'GridRow',
            isFocused ? 'focused' : null,
            isSelected ? 'selected' : null,
            isLastSelected ? 'last-selected' : null,
            rowClass ? rowClass(row) : null,
            isGroup ? `group ${groupLevel < 0 ? 'collapsed' :'expanded'}` : (rowIdx % 2 === 0 ? 'even' : 'odd') 
        );

        //TODO load default formatters here and pass formatter/cellClass down to cell 
        const cells = columns.filter(column => !column.hidden).map((column,idx) => {

            const cellClass = rowCellClass;

            return this.renderCell({
                key: idx,
                idx,
                rowIdx,
                rowSelected: isSelected,
                row,
                value: row[column.key || idx], // always use key - it can be numeric for array access
                column,
                formatter: column.formatter || NULL_FORMATTER,
                cellClass,
                onCaptureClick: isGroup ? this.handleToggleGroup : undefined,
                onClick: onCellClick
            });
        });

        return (
            <div className={className} style={style} tabIndex={0}
                onClick={this.handleClick} 
                onDoubleClick={this.handleDoubleClick} 
                onContextMenu={this.handleContextMenu}>
                {cells}
            </div>
        );
    }

    renderCell(props){

        const renderer = props.column.renderer || this.props.cellRenderer;

        // We should always clone, even if returned from renderer - otherwise
        // we are dependent on renderer correctly applying width and key
        return React.isValidElement(renderer) 
            ? React.cloneElement(renderer,props)
            : (renderer && renderer(props)) || getCellRenderer(props); 

    }
 
    shouldComponentUpdate(nextProps) {
        // many of these checks could be eliminated if we store all the status 
        // fields (or a single field) on row itself and create new row on change
        return nextProps.row !== this.props.row || 
                nextProps.columns !== this.props.columns ||
                nextProps.isSelected !== this.props.isSelected ||
                nextProps.isLastSelected !== this.props.isLastSelected ||
                nextProps.isFocused !== this.props.isFocused ||
                nextProps.isCellFocused !== this.props.isCellFocused ||
                nextProps.isCellEdited !== this.props.isCellEdited ||
                nextProps.focusCellIdx !== this.props.focusCellIdx;
    }

    handleToggleGroup = () => {
        this.props.onToggle(this.props.row);
    }

    handleContextMenu = e => {
        this.props.onContextMenu(e, {idx:this.props.idx, row:this.props.row});
    }

    handleClick = e => {
        const rangeSelect = e.shiftKey;
        const keepExistingSelection = e.ctrlKey || e.metaKey /* mac only */;
        this.props.onSelect(this.props.idx, this.props.row, rangeSelect, keepExistingSelection);
    }

    handleDoubleClick = () => {
        this.props.onDoubleClick(this.props.idx, this.props.row);
    }
}