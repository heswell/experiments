
import React from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames';
import ColumnGroupHeader from './columnGroupHeader';
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

    render() {

        const className = cx('Header', this.props.className);
        const {height,
            gridModel: model,
            onContextMenu,
            onColumnResize,onColumnMove,onToggleCollapse,onToggleGroupState,
            onSort,onSortGroup,onHeaderClick, onRemoveGroupbyColumn} = this.props;
        const style = {...css.Header, ...this.props.style, height};
        const {sortBy, headerHeight, groupState} = model;
        const multiColumnSort = sortBy !== null && sortBy.length > 1;

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
                                onColumnResize={onColumnResize}
                                onColumnMove={onColumnMove}
                                onToggleCollapse={onToggleCollapse}
                                onContextMenu={onContextMenu}
                                onRemoveGroupbyColumn={onRemoveGroupbyColumn}
                                onSort={onSort}
                                onSortGroup={onSortGroup}
                                onHeaderClick={onHeaderClick}
                                onToggleGroupState={onToggleGroupState}
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
