
import React from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames';
import Draggable from '../draggable/draggable';

import './header-cell.css';

const NOOP = () => { };

const defaultRenderer = ({ column }) =>
    column.collapsed || column.hidden
        ? ''
        : column.label;

const Direction = {
    ASC: 'asc',
    DSC: 'desc'
}

export default class HeaderCell extends React.Component {

    static defaultProps = {
        renderer: defaultRenderer,
        onSort: NOOP,
        onToggleCollapse: NOOP
    };

    wasDragging;
    x;
    y;

    constructor(props) {
        super(props);
        this.state = {
            dragging: null
        };
    }

    render() {

        const { column } = this.props;

        const className = cx(
            'HeaderCell',
            column.className,
            column.cellCSS,
            this.props.className, {
                'HeaderCell--resizing': column.resizing,
                'hidden': column.hidden,
                'collapsed': column.collapsed
            });

        const isResizeable = column.resizeable !== false;
        const isCollapsible = column.collapsible === true;
        const isHidden = column.hidden === true;
        const style = { width: column.width };

        if (isHidden && column.width === 0) {
            style.display = 'none';
        }

        return (
            <div className={className} style={style}
                onClick={this.handleClick} onMouseDown={this.handleMouseDown} onContextMenu={this.handleContextMenu}>
                {this.getSortIndicator(column, this.props.multiColumnSort)}
                <div className='InnerHeaderCell'>
                    <div className='cell-wrapper'>
                        {isCollapsible && !isHidden
                            ? <i className='fa fa-caret' onClick={this.handleToggleCollapse}></i>
                            : null}
                        {this.props.renderer({ column })}
                    </div>
                </div>
                {isResizeable
                    ? <Draggable className='resizeHandle'
                        onDrag={this.handleResize}
                        onDragStart={this.handleResizeStart}
                        onDragEnd={this.handleResizeEnd} />
                    : null}
            </div>
        );

    }

    setScrollLeft(scrollLeft) {
        const node = ReactDOM.findDOMNode(this);
        node.style.webkitTransform = `translate3d(${scrollLeft}px, 0px, 0px)`;
    }

    getSortIndicator = (column, multiColumnSort) => {
        if (column.sortable === false || column.isPlaceHolder) {
            return null;
        } else if (column.sorted) {
            const direction = column.sorted < 0 ? 'desc' : 'asc';
            if (multiColumnSort) {
                return <div className={`sort-col multi-col ${direction}`}>
                    {this.sortIcon(direction)}
                    <span className='sort-col-num'>{Math.abs(column.sorted)}</span>
                </div>;
            } else {
                return <div className="sort-col single-col">
                    {this.sortIcon(direction)}
                </div>;
            }
        } else {
            return null;
        }
    }

    sortIcon(direction){
        return direction === Direction.ASC
            ? <i className="material-icons">arrow_drop_up</i>
            : <i className="material-icons">arrow_drop_down</i>
    }

    handleResizeStart = () => {
        this.props.onResize('begin', this.props.column);
    }

    handleResize = (e) => {
        const width = this.getWidthFromMouseEvent(e);
        if (width > 0 && this.props.onResize) {
            this.props.onResize('resize', this.props.column, width);
        }
    }

    handleResizeEnd = (e) => {
        this.wasDragging = true;
        const width = this.getWidthFromMouseEvent(e);
        this.props.onResize('end', this.props.column, width);
    }

    handleContextMenu = e => {
        this.props.onContextMenu(e, 'header', { column: this.props.column });
    }

    handleToggleCollapse = () => {
        this.props.onToggleCollapse(this.props.column);
    }

    handleClick = () => {

        if (this.wasDragging) {
            this.wasDragging = false;
        } else {
            this.clickColumn(this.props.column);
        }
    }

    clickColumn = column => {
        if (this.props.onClick) {
            this.props.onClick(column);
        }
    }

    getWidthFromMouseEvent(e) {
        const right = e.pageX;
        const left = ReactDOM.findDOMNode(this).getBoundingClientRect().left;
        return right - left;
    }

    // ------ Draggable
    handleMouseDown = e => {

        this.x = e.clientX;
        this.y = e.clientY;

        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('mousemove', this.onMouseMove);
    }

    // wasDragging

    onMouseMove = e => {
        const dragging = this.state.dragging;

        if (e.stopPropagation) {
            e.stopPropagation();
        }

        if (e.preventDefault) {
            e.preventDefault();
        }

        const x = e.clientX;
        const y = e.clientY;
        const deltaX = x - this.x;
        // const deltaY = y - this.y;

        if (dragging) {
            this.x = x;
            this.y = y;
            this.props.onMove('move', this.props.column, deltaX);
        } else {
            if (Math.abs(deltaX) > 3) {
                this.setState({ dragging: true });
                this.x = x;
                this.y = y;
                this.props.onMove('begin', this.props.column, deltaX);
            }
        }
    }

    onMouseUp = () => {
        this.cleanUp();
        if (this.state.dragging) {
            this.wasDragging = true;
            this.props.onMove('end', this.props.column);
        } else {
            // drag aborted
        }
    }

    cleanUp() {
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('mousemove', this.onMouseMove);
    }


}

