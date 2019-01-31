import React from 'react';
import Cell from '../../../core/cell';
import {rowUtils} from '../../../../data';

export default class CheckboxCell extends Cell {

    render() {

        const {column, row, rowSelected} = this.props;
        const className = this.getClassName(this.props);

        return (
            <div className={className} style={{ width: column.width }} tabIndex={0} >
                {!rowUtils.isEmptyRow(row) && <input type='checkbox' readOnly checked={rowSelected}/>}
            </div>
        );
    }

    shouldComponentUpdate(nextProps){
        return super.shouldComponentUpdate(nextProps) ||
            nextProps.row.length !== this.props.row.length;
    }

}
