import React, { Component } from 'react';
import { Motion, spring } from 'react-motion';
import { springConfig, listStyle } from './listUtils';
import './columnList.css';

const NO_CLASS = () => '';
const NO_SELECTION = 'none';

class ListItem extends React.Component {

    render() {

        const { style, item, selectionModel, className, isSelected } = this.props;

        return (
            <div style={style} onMouseDown={this.handleMouseDown} className={`ListItem ${className}`}>
                {selectionModel !== NO_SELECTION
                    ? <label className="check-select">
                        <input className="check-select" type="checkbox" checked={isSelected} onChange={this.handleSelectionChange} />
                    </label>
                    : null}
                <span>{`${item.name}`}</span>
                <div className='list-button list-button-outer remove' onClick={this.handleActionClick}>
                    <div className='list-button list-button-inner' />
                </div>
            </div>
        );
    }

    handleSelectionChange = ({ currentTarget }) => {
        this.props.onSelectionChange(this.props.item, currentTarget.checked);
    }

    handleMouseDown = ({ target, currentTarget, pageX, pageY }) => {
        if (!target.classList.contains('list-button') && target.className !== 'check-select') {
            this.props.onMouseDown(this.props.item, currentTarget.getBoundingClientRect(), pageX, pageY);
        }
    }

    handleActionClick = () => {
        this.props.onActionClick(this.props.item);
    }

}

export default class ColumnList extends Component {

    render() {

        const className = 'List';
        const { style, dragged, items, itemClassName = NO_CLASS, selectedItem, selectionModel = NO_SELECTION } = this.props;
        const { width, height } = style;
        const contentHeight = items.length * 24;
        const verticalScrollbarVisible = contentHeight > height;
        const contentWidth = verticalScrollbarVisible ? width - 15 : width;

        const content = items.map((item, idx) => {
            return item === dragged.item ? null : (
                <Motion key={item.name} style={listStyle(1, 1, spring(0, springConfig), spring(idx * 24, springConfig))}>
                    {({ scale, shadow, x, y }) =>
                        <ListItem item={item} className={itemClassName(item)}
                            isSelected={selectedItem === item} selectionModel={selectionModel}
                            style={{
                                width: contentWidth,
                                boxShadow: `rgba(0, 0, 0, 0.2) 0px ${shadow}px ${2 * shadow}px 0px`,
                                transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`
                            }}
                            onMouseDown={this.handleMouseDown}
                            onSelectionChange={this.handleSelectionChange}
                            onActionClick={this.handleActionClick} />}
                </Motion>
            );
        });

        return (
            <div className={className} style={style}>
                <div className="ViewPort" style={{ position: 'absolute', top: 0, left: 0, width, height }}>
                    <div className="scrollable-content" style={{ position: 'absolute', top: 0, left: 0, width, height, overflow: 'auto' }}>
                        <div className="scrolling-canvas-container" style={{ width: contentWidth, height: contentHeight }}>
                            {content}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    handleSelectionChange = (column, checked) => {
        this.props.onSelectionChange(column, checked, this.props.name);
    };

    handleActionClick = item => {
        this.props.onItemAction(item, this.props.name);
    };

    handleMouseDown = (column, rect, pageX, pageY) => {
        this.props.onMouseDown(this.props.name, column, rect, pageX, pageY);
    };
}
