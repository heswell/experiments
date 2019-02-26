import React from 'react';
import cx from 'classnames';
import HeaderCell from './headerCell';
import GroupbyHeaderCell from './groupbyHeaderCell';
import '../style/grid';

function shallowEqual(a, b) {
    if (a === b) {
        return true;
    }
    let k;
    for (k in a) {
        if (a.hasOwnProperty(k) &&
            (!b.hasOwnProperty(k) || a[k] !== b[k])) {
            return false;
        }
    }

    for (k in b) {
        if (b.hasOwnProperty(k) && !a.hasOwnProperty(k)) {
            return false;
        }
    }

    return true;
}

export default class GroupHeader extends React.Component {

    render() {

        const {renderWidth, renderLeft, headings=[]} = this.props.columnGroup;
        const {width} = this.props;

        return (
            <div className='GroupHeader' style={{height: '100%', width: renderWidth, left: renderLeft}}>

                {headings.map((heading,idx) =>
                    <div className='group-heading' key={idx} style={{width,height: '100%'}}>
                        {this.renderColHeadings(heading)}
                    </div>
                ).reverse()}

                <div style={{whiteSpace: 'nowrap', height: '100%', width, position: 'relative'}}>
                    {this.renderHeaderCells()}
                </div>
            </div>
        );
    }

    renderColHeadings = heading =>
        heading.map((item,idx) =>
            <HeaderCell
                key={idx} className={cx('colgroup-header',{bottomless: item.label === ''})}
                column={item}
                onResize={this.props.onColumnResize}
                onMove={this.props.onColumnMove}
                onToggleCollapse={this.props.onToggleCollapse}
            />
        )

    renderHeaderCells() {

        const {multiColumnSort, groupState} = this.props;

        return this.props.columnGroup.columns.filter(column => !column.hidden).map(column => {

            const props = {
                key: column.key,
                column,
                onResize: this.props.onColumnResize,
                onMove: this.props.onColumnMove,
                onContextMenu: this.props.onContextMenu
            };

            if (column.isGroup){

                return this.renderGroupHeader({
                    ...props,
                    groupState,
                    onClick: this.handleGroupHeaderCellClick,
                    onToggleGroupState: this.props.onToggleGroupState,
                    onRemoveColumn: this.props.onRemoveGroupbyColumn
                });

            } else {

                return this.renderCell({
                    ...props,
                    value: column.name,
                    multiColumnSort,
                    onClick: this.handleHeaderCellClick
                });
            }
        });

    }

    renderGroupHeader(props){

        const renderer = this.props.colGroupHeaderRenderer;

        return React.isValidElement(renderer)
            ? React.cloneElement(renderer, props)
            : ((renderer && renderer(props)) || <GroupbyHeaderCell {...props}/>);

    }

    // TODO separate this pattern into reusable code
    renderCell(props){

        const renderer = this.props.colHeaderRenderer;

        return React.isValidElement(renderer)
            ? React.cloneElement(renderer, props)
            : ((renderer && renderer(props)) || <HeaderCell {...props} />);

    }

    shouldComponentUpdate(nextProps) {
        return (
            nextProps.width !== this.props.width ||
            nextProps.columnGroup !== this.props.columnGroup ||
            nextProps.groupState !== this.props.groupState ||
            nextProps.colHeaderRenderer !== this.props.colHeaderRenderer ||
            nextProps.filter !== this.props.filter || // required when rendeirng an InlineFilter, awkward though
        // also, we only care about the filter if it filters column(s) inn this colGroup
            !shallowEqual(nextProps.style, this.props.style) // don't like this
        );
    }

    handleHeaderCellClick = column => {
        let result = true;
        if (this.props.onHeaderClick){
            result = this.props.onHeaderClick(column);
        }
        if (result !== false && this.props.onSort && column.sortable !== false){
            this.props.onSort(column);
        }
    }

    handleGroupHeaderCellClick = column => {
        if (this.props.onSortGroup && column.sortable !== false){
            this.props.onSortGroup(column);
        }
    }

}
