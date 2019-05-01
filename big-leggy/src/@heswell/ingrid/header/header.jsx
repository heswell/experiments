
import React from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames';
import ColumnGroupHeader from './columnGroupHeader';
import * as Action from '../model/actions';

import css from '../style/grid';

const NULL_REF = () => {};

export default class Header extends React.Component {

    static defaultProps = {
        style: {height: 25}
    };

    scrollingHeader;

    constructor(props){
        super(props);
        this.state = { scrollLeft: 0 };
    }

    handleSort = (column, direction = null, preserveExistingSort = false) => {
        const {dispatch} = this.props;
        // this will transform the columns which will cause whole grid to re-render down to cell level. All
        // we really need if for headers to rerender. SHould we store sort criteria outside of columns ?
        dispatch({ type: Action.SORT, column, direction, preserveExistingSort });
    }

    handleColumnMove = (phase, column, distance) => {
        if (!column.isHeading){
            const {dispatch} = this.props;
            const {scrollLeft} = this.state;
    
            if (phase === 'move' && distance !== 0) {
                dispatch({ type: Action.MOVE, distance, scrollLeft });
            } else if (phase === 'begin') {
                dispatch({ type: Action.MOVE_BEGIN, column, scrollLeft });
            } else if (phase === 'end') {
                dispatch({ type: Action.MOVE_END, column });
            }    
        }
    }

    handleColumnResize = (phase, column, width) => {
        const {dispatch} = this.props;
    
        if (phase === 'resize') {
            if (column.isHeading) {
                dispatch({ type: Action.RESIZE_HEADING, column, width });
            } else {
                // TODO do we need to consider scrolling ?
                dispatch({ type: Action.COLUMN_RESIZE, column, width });
            }
        } else if (phase === 'begin') {
            dispatch({ type: Action.COLUMN_RESIZE_BEGIN, column });
        } else if (phase === 'end') {
            dispatch({ type: Action.COLUMN_RESIZE_END, column });
        }
    };

    handleRemoveGroupBy = column => {
        this.props.dispatch({ type: Action.groupExtend, column });
    }

    handleSortGroup = column => {
        this.props.dispatch({ type: Action.SORT_GROUP, column });
    };

    handleToggleGroupState = (column, expanded) => {
        const {dispatch} = this.props;
        console.log(`toggleGroupAll ${column.name}`)
        const groupState = expanded === 1
            ? { '*': true }
            : {};
        dispatch({ type: Action.TOGGLE, groupState })
    }

    render() {

        const className = cx('Header', this.props.className);
        const {height,
            gridModel: model,
            onContextMenu,
            onToggleCollapse,
            onHeaderClick} = this.props;
            
        const style = {...css.Header, ...this.props.style, height};
        const {sortBy, headerHeight, groupState} = model;
        const multiColumnSort = sortBy && sortBy.length > 1;

        return (
            <div className={className} style={style}>

                {
                    model._groups.map((group, idx) => {

                        const ref = group.locked ? NULL_REF : component => this.scrollingHeader = ReactDOM.findDOMNode(component);

                        return (
                        // note: filter is only included so that shouldComponentUpdate can take it into account  - this might be 
                        // rendering InlineFiters
                        // TODO we should pass the whole model    
                            <ColumnGroupHeader
                                key={idx}
                                ref={ref}
                                width={group.width}
                                headerHeight={headerHeight}
                                groupState={groupState}
                                columnGroup={group}
                                filter={model.filter}
                                multiColumnSort={multiColumnSort}
                                onColumnResize={this.handleColumnResize}
                                onColumnMove={this.handleColumnMove}
                                onToggleCollapse={onToggleCollapse}
                                onContextMenu={onContextMenu}

                                onSort={this.handleSort}
                                onSortGroup={this.handleSortGroup}
                                onRemoveGroupbyColumn={this.handleRemoveGroupBy}

                                onHeaderClick={onHeaderClick}
                                onToggleGroupState={this.handleToggleGroupState}
                                colHeaderRenderer={this.props.colHeaderRenderer}
                                colGroupHeaderRenderer={this.props.colGroupHeaderRenderer}
                            />

                        );

                    })}

            </div>
        );
    }

    componentDidUpdate(prevProps, prevState){
        if (prevState.scrollLeft !== this.state.scrollLeft && this.scrollingHeader){
            this.scrollingHeader.scrollLeft = this.state.scrollLeft;
        }
    }

    setScrollLeft(scrollLeft){
        if (scrollLeft !== this.state.scrollLeft){
            this.setState({scrollLeft});
        }
    }
}
