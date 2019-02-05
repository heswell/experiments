
import React from 'react';
import cx from 'classnames';
import {FilterView} from '../../data/view';
import FlexBox from '../../inlay/flexBox';
import {filter as filterConstants} from '../../data';
import CheckList from './checkList';
import SearchBar from './searchBar'
import './setFilter.css';

const NO_STYLE = {}

const {INCLUDE, EXCLUDE_SEARCH, INCLUDE_SEARCH} = filterConstants
export class SetFilter extends React.Component {
    static defaultProps = {
        onSelectionChange: (selected, filterMode) => {
            console.log(`SetFilter: no handler provided for onSelectionChange ${selected} ${filterMode}`)
        },
        onSearchText: (column, value) => {
            console.log(`SetFilter: no handler provided for onSearchText ${column} ${value}`)
        }
    }
    
    constructor(props){
        super(props);
        const {filter} = props;
        const selectionDefault = filter && filter.type === 'include' ? false : true;
        console.log(`SetFilter.constructor create a new filterView`)
        const filterView = new FilterView(props.dataView, props.column);
        this.state = {
            filterView,
            selectionDefault,
            selected: filterView.getSelectedIndices(),
            selectedValues: filter ? filter.values : []
        };
        this.searchText = ''
    }

    render(){
        const {
            column,
            className, 
            height, 
            width,
            style=NO_STYLE,
            suppressHeader=false,
            suppressSearch=false,
            suppressFooter=false
        } = this.props;

        const {filterView, searchText=''} = this.state;
        const clickHandler = this.state.selectionDefault ? this.handleDeselectAll : this.handleSelectAll;
        const selectionText = this.state.selectionDefault ? 'DESELECT ALL' : 'SELECT ALL';
        const borderStyle = {borderWidth: 1, borderStyle: 'solid', borderColor: '#d4d4d4'};

        return (
            <FlexBox className={cx('SetFilter','ColumnFilter', className)} style={{width,height,visibility: style.visibility}}>
                {suppressHeader !== true &&
                <div className='col-header HeaderCell' style={{height: 25}}>
                    <div className='col-header-inner' style={{width: column.width-1}}>{column.name}</div>
                </div>}
                <FlexBox className='set-filter-inner' style={{flex: 1, ...borderStyle}}>
                    {suppressSearch !== true &&
                    <SearchBar style={{height: 25}}
                        inputWidth={column.width-25}
                        searchText={searchText}
                        onSearchText={this.handleSearchText}
                        selectionText={selectionText}
                        onClickSelectionText={clickHandler}/>}
                    <CheckList style={{flex: 1, margin: 3, border: '1px solid red'}} debug_title={this.props.title}
                        column={column}
                        selectionDefault={this.state.selectionDefault}
                        defaultSelected={this.state.selected}
                        dataView={filterView}
                        onSelectionChange={this.handleSelectionChange}/>
                    {suppressFooter !== true &&
                    <div key='footer' className='footer' style={{height: 24}}>
                        <button className='filter-done-button' onClick={this.props.onClose}>Done</button>
                    </div>}
                </FlexBox>
            </FlexBox>
        );
    }

    componentWillMount(){
        console.log(`SetFilterWillMount`)
    }

    componentWillUnmount(){
        if (this.props.onHide){
            this.props.onHide();
        }
        this.state.filterView.destroy();
    }

    handleSearchText = searchText => {
        this.searchText = searchText;
        this.props.onSearchText(this.props.column, searchText);
    }

    handleDeselectAll= () => {
        if (this.searchText){
            const selectedValues = this.props.dataView.filterRows.map(row => row[4]);
            this.setState({
                selected: this.state.filterView.selectAll(),
                selectedValues: Array.from(new Set(this.state.selectedValues.concat(selectedValues)))
            }, () => {
                this.props.onSelectionChange(null, EXCLUDE_SEARCH);
            });

        } else {
            this.setState({
                selected: [],
                selectedValues: [],
                selectionDefault: false
            }, () => {
                this.props.onSelectionChange([], INCLUDE);
            });

        }
    }

    handleSelectAll= () => {
        // we don't want to list individually the selected items, we need to use a starts with filter
        if (this.searchText){
            // we do want to select all the items currently in the grid
            // add everything in the current viewport to selected, emit an event which will create a
            // new filter which included all values matching starts with filter
            const selectedValues = this.props.dataView.filterRows.map(row => row[4]);
            this.setState({
                selected: this.state.filterView.selectAll(),
                selectedValues: Array.from(new Set(this.state.selectedValues.concat(selectedValues)))
            }, () => {
                this.props.onSelectionChange(null, INCLUDE_SEARCH);
            });
        } else {
            this.setState({
                selected: [],
                selectedValues: [],
                selectionDefault: true
            }, () => {
                this.props.onSelectionChange([], 'exclude');
            });

        }
    }

    handleSelectionChange = (selectedIndices, idx) => {
        const {selectionDefault, selectedValues: previousSelection} = this.state;
        const deselected = selectedIndices.indexOf(idx) === -1;
        const filterMode = selectionDefault === true
            ? 'exclude'
            : 'include';

        const value = this.state.filterView.itemAtIdx(idx)[4];
        // can't keep this hardcoded 4 - where does it belong
        const selectedValues = deselected
            ? previousSelection.filter(v => v !== value)
            : previousSelection.concat(value);
        this.setState({selectedValues}, () => {
            this.props.onSelectionChange(selectedValues, filterMode);
        });
    }
}
