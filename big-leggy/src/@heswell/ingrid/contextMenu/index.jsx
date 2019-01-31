import React from 'react';
import { ContextMenu, MenuItem, Separator } from '../services/popups';

export const ContextMenuActions = {
    SortAscending : 'sort-asc',
    SortAddAscending : 'sort-add-asc',
    SortDescending : 'sort-dsc',
    SortAddDescending : 'sort-add-dsc',
    GroupBy : 'groupby',
    GroupByReplace : 'groupby-replace'
};

export default class GridContextMenu extends React.Component {

    render() {

        const {location, options} = this.props;

        return (
            <ContextMenu doAction={this.props.doAction}>
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

                if (sortCriteria !== null && sortCriteria.length){
                    menuItems.push(
                        <MenuItem key='sort-add-asc' action='sort-add-asc' data={options} label='Add to Sort' >
                            <MenuItem key='sort-add-asc' action='sort-add-asc' data={options} label='ASC' />
                            <MenuItem key='sort-add-dsc' action='sort-add-dsc' data={options} label='DESC' />
                        </MenuItem>
                    );
                }
                                
            } else {    

                if (sortCriteria !== null && sortCriteria.length > 1){
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
                if (isGroup){
                    menuItems.push(<MenuItem key='groupby-remove-all' action='groupby-remove-all' data={options} label={`Remove Grouping`} />);
                } else {
                    menuItems.push(<MenuItem key='groupby-replace' action='groupby-replace' data={options} label={`Group by ${colName}`} />);
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
            menuItems.push(<MenuItem key='hide-filters' action='hide-filters' label='Hide Filters' />);
        } else {
            menuItems.push(<MenuItem key='show-filters' action='show-filters' label='Column Filters' />);
        }
        menuItems.push(<MenuItem key='settings' action='settings' label='Settings' />);

        return menuItems;

    }

}

