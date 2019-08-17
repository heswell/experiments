import React from 'react';
// import { ContextMenu, MenuItem, Separator } from '../services/popups/index';
import { ContextMenu, MenuItem, Separator } from '@heswell/ui-controls';

import * as Action from '../model/actions';

export const ContextMenuActions = {
    SortAscending : 'sort-asc',
    SortAddAscending : 'sort-add-asc',
    SortDescending : 'sort-dsc',
    SortAddDescending : 'sort-add-dsc',
    GroupBy : 'groupby',
    GroupByReplace : 'groupby-replace'
};

export default class GridContextMenu extends React.Component {

    handleMenuAction(action, data){
        const {dispatch, doAction} = this.props;
        switch(action){
            case ContextMenuActions.GroupBy:
                dispatch({ type: Action.groupExtend, column: data.column });
                break;
            case ContextMenuActions.GroupByReplace:
                dispatch({ type: Action.GROUP, column: data.column });
                break;
            case ContextMenuActions.SortAscending: 
                return this.sort(data.column, 'asc');
            case ContextMenuActions.SortDescending: 
                return this.sort(data.column, 'dsc');
            case ContextMenuActions.SortAddAscending:
                return this.sort(data.column, 'asc', true);
            case ContextMenuActions.SortAddDescending:
                return this.sort(data.column, 'dsc', true);
    
            default:
                doAction(action, data)
        }
    }

    sort(column, direction = null, preserveExistingSort = false){
        const {dispatch} = this.props;
        // this will transform the columns which will cause whole grid to re-render down to cell level. All
        // we really need if for headers to rerender. SHould we store sort criteria outside of columns ?
        dispatch({ type: Action.SORT, column, direction, preserveExistingSort });
    }

    render() {

        const {location, options} = this.props;

        return (
            // TODO replace the inline function when we move to SFC
            <ContextMenu doAction={(action, data) => this.handleMenuAction(action, data)}>
                {this.menuItems(location, options)}
            </ContextMenu>
        );

    }

    menuItems(location, options) {

        const menuItems = [];

        if (location === 'header') {

            const {model, column: {name: colName, sorted, isGroup}} = options;
            const {groupBy, sortBy:sortCriteria} = model;

            if (!sorted) {
                menuItems.push(
                    <MenuItem key='sort-asc' action='sort-asc' data={options} label='Sort' >
                        <MenuItem key='sort-asc' action='sort-asc' data={options} label='ASC' />
                        <MenuItem key='sort-dsc' action='sort-dsc' data={options} label='DESC' />
                    </MenuItem>
                );

                if (sortCriteria && sortCriteria.length){
                    menuItems.push(
                        <MenuItem key='sort-add-asc' action='sort-add-asc' data={options} label='Add to Sort' >
                            <MenuItem key='sort-add-asc' action='sort-add-asc' data={options} label='ASC' />
                            <MenuItem key='sort-add-dsc' action='sort-add-dsc' data={options} label='DESC' />
                        </MenuItem>
                    );
                }
                                
            } else {    

                if (sortCriteria && sortCriteria.length > 1){
                    menuItems.push(
                       <MenuItem key='sort-remove' action='sort-remove' data={options} label='Remove from Sort' />
                    );
                }
        
                if (sorted === 1) {
                    menuItems.push(<MenuItem key='sort-asc' action='sort-dsc' data={options} label='Sort (DESC)' />);
                } else {
                    menuItems.push(<MenuItem key='sort-dsc' action='sort-asc' data={options} label='Sort (ASC)' />);
                }
            }

            if (groupBy && groupBy.length) {
                if (!isGroup){
                    menuItems.push(<MenuItem key='groupby-add' action='groupby' data={options} label={`Add ${colName} to Group`} />);
                }
            } else {
                menuItems.push(<MenuItem key='groupby-add' action='groupby' data={options} label={`Group by ${colName}`} />);
            }

        } else if (location === 'row') {
            menuItems.push(<MenuItem key='delete-row' action='delete-row' label='Delete Row' />);
        }

        menuItems.push(<Separator key='1' />);

        if (options.showFilters) {
            menuItems.push(<MenuItem key='hide-filters' action={Action.TOGGLE_FILTERS} label='Hide Filters' />);
        } else {
            menuItems.push(<MenuItem key='show-filters' action={Action.TOGGLE_FILTERS} label='Column Filters' />);
        }
        menuItems.push(<MenuItem key='settings' action='settings' label='Settings' />);

        return menuItems;

    }

}

