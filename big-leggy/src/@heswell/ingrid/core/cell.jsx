import React from 'react';
import cx from 'classnames';
import {renderCellContent} from '../cells/formatting/cellValueFormatter';


export default class Cell extends React.Component {

    render() {

        const props = this.props;
        const {column} = props;

        const style = {width: column.width};

        return (

            <div className={this.getClassName(props)} 
                style={style} tabIndex={0}
                onKeyDown={props.onKeyDown}
                onClick={this.handleClick}
                onDoubleClick={props.onDoubleClick}>

                {renderCellContent(props)}
            
            </div>

        );
    }

    getClassName({column, value, cellClass=null}){

        const type = (column.type && column.type.name) || null;

        return cx(
            'GridCell',
            column.className,
            column.cellCSS,
            type,
            cellClass ? cellClass(value, column) : null,
            column.resizing ? 'resizing' : null,
            column.moving ? 'moving' : null
        );
    }

    shouldComponentUpdate(nextProps){
        return nextProps.value !== this.props.value || 
                nextProps.column !== this.props.column || 
                nextProps.rowSelected !== this.props.rowSelected || 
                nextProps.className !== this.props.className;
    }

    handleClick = e => {

        const {rowIdx, idx} = this.props;

        if (this.props.onCaptureClick){
            e.preventDefault();
            e.stopPropagation();
            this.props.onCaptureClick({rowIdx, idx});
        }

        if (this.props.onClick){
            this.props.onClick({rowIdx, idx});
        }

    }

}

