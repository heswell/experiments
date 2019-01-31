import React from 'react';
import Cell from '../core/cell';

const DEPTH = 1;
const CHILD_COUNT = 2;

export default class GroupCell extends Cell {

    render() {

        const props = this.props;
        const className = this.getClassName(props);

        return (
            <div className={className} style={{ width: props.column.width }} tabIndex={0} >{this.getContent(props)}</div>
        );
    }

    getContent({row, column: {columns}}) {

        const count = row[CHILD_COUNT];

        for (let i = 0; i < columns.length; i++) {
            const column = columns[i];

            if (Math.abs(row[DEPTH]) === column.groupLevel) {

                const value = row[column.key];

                return (

                    <div className='group' style={{ paddingLeft: i * 20 }} tabIndex={0}
                        onClick={this.handleClick}>
                        <i className='fa fa-caret'></i>
                        <span className='group-value'>{value}</span>
                        <span> ({count})</span>
                    </div>

                );
            }

        }

        return null;

    }

    shouldComponentUpdate(nextProps) {

        return nextProps.row !== this.props.row ||
            nextProps.column !== this.props.column ||
            nextProps.className !== this.props.className;
    }

}
