
import React from 'react';
import cx from 'classnames';
import {filter as filterUtils, DataTypes} from '../../data';
import {FilterView} from '../../data/view';
import FlexBox from '../../inlay/flexBox';
import CheckList from './checkList';
import SearchBar from './filter-toolbar'
import './setFilter.css';
import { NOT_IN } from '../../data/store/filter';

const {IN} = filterUtils;
const NO_STYLE = {}
const NO_COUNT = {}

export const INCLUDE = 'include';
export const EXCLUDE = 'exclude';

const SELECT_ALL = 'select-all';
const SELECT_NONE = 'select-none';

const ZeroRowFilter = {
    colName: 'count',
    type: NOT_IN,
    values: [0]
}

const FilterCounts = ({column, dataCounts=NO_COUNT, searchText}) => {
    const {dataRowTotal, dataRowAllFilters, filterRowTotal, filterRowSelected} = dataCounts;
    console.log(`FilterCount ${JSON.stringify(dataCounts,null,2)}`)
    return (
        <div className="filter-count-section">
            <div className="filter-row-counts">
                <div>{`Distinct values for ${column.name}`}</div>
                <div className="filter-row-table">
                    <div>
                        <span>Selected</span>
                        <span>{filterRowSelected}</span>
                    </div>
                    <div>
                        <span>Total</span>
                        <span>{filterRowTotal}</span>
                    </div>
                </div>
            </div>
            <div className="data-row-counts">
            <div>{`Data records`}</div>
                <div className="filter-row-table">
                    {dataRowAllFilters < dataRowTotal ? (
                    <div>
                        <span>Filtered</span>
                        <span>{dataRowAllFilters}</span>
                    </div>

                    )  : (
                    <div>
                        <span>&nbsp;</span>
                        <span>&nbsp;</span>
                    </div>
                    )}
                    <div>
                        <span>Total</span>
                        <span>{dataRowTotal}</span>
                    </div>
                </div>

            </div>
        </div>
    )
} 

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
        const {column, filter, dataView} = props;
        const columnFilter = filterUtils.extractFilterForColumn(filter, column.name);
        const otherFilters = filterUtils.includesColumn(filter, column)
            ? filterUtils.removeFilterForColumn(filter, column)
            : filter;

        const selectionDefault = columnFilter && columnFilter.type === IN ? SELECT_NONE : SELECT_ALL;
        const filterView = new FilterView(dataView, column);

        this.state = {
            showZeroRows: true,
            filterView,
            selectionDefault,
            otherFilters,
            dataCounts: undefined
        };

        this.searchText = ''

        this.handleFilterViewUpdate = this.handleFilterViewUpdate.bind(this);
        this.toggleZeroRows = this.toggleZeroRows.bind(this);

        filterView.addListener(DataTypes.ROW_DATA, this.handleFilterViewUpdate)

    }

    handleFilterViewUpdate(_, rows, rowCount=null, dataCounts){
        this.setState({dataCounts})
    }

    toggleZeroRows(){
        const {showZeroRows: currentlyShowing, filterView} = this.state;
        const showZeroRows = !currentlyShowing;
        this.setState({
            showZeroRows
        });

        if (showZeroRows){
            filterView.removeFilter(ZeroRowFilter);
        } else {
            filterView.addFilter(ZeroRowFilter);
        }
    }

    render(){
        const {
            column,
            className, 
            height, 
            style=NO_STYLE,
            suppressHeader=false,
            suppressSearch=false,
            suppressFooter=false
        } = this.props;

        const {filterView, selectionDefault, otherFilters, dataCounts, showZeroRows} = this.state;
        const allSelected = selectionDefault === SELECT_ALL;
        const clickHandler = allSelected ? this.handleDeselectAll : this.handleSelectAll;
        const selectionText = allSelected ? 'DESELECT ALL' : 'SELECT ALL';
        const columns = otherFilters
            ? filterView.columns
            : filterView.columns.filter(column => column.name !== 'count')

            return (
            <FlexBox className={cx('SetFilter','ColumnFilter', className)} style={{width: 300,height,visibility: style.visibility}}>
                {suppressHeader !== true &&
                <div className='col-header HeaderCell' style={{height: 25}}>
                    <div className='col-header-inner' style={{width: column.width-1}}>{column.name}</div>
                </div>}
                <FlexBox className='filter-inner' style={{flex: 1}}>
                    {suppressSearch !== true &&
                    <SearchBar style={{height: 25}}
                        inputWidth={column.width-16}
                        searchText={this.searchText}
                        onSearchText={this.handleSearchText}
                        selectionText={selectionText}
                        onClickSelectionText={clickHandler}
                        onHide={this.props.onClose}/>}
                    <CheckList style={{flex: 1, margin: '3px 3px 0 3px', border: '1px solid lightgray'}}
                        selectionDefault={true}
                        columns={columns}
                        dataView={filterView}
                        onSelectionChange={this.handleSelectionChange}/>
                    <FilterCounts style={{height: 50}} column={column} dataCounts={dataCounts} searchText={this.searchText}/>  
                    {suppressFooter !== true &&
                    <div key='footer' className='footer' style={{height: 26}}>
                        <button
                            className="toggle-zero-rows"
                            onClick={this.toggleZeroRows}>{showZeroRows ? 'Hide zero rows' : 'Show zero rows'}</button>
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
        const {filterView} = this.state;
        filterView.removeListener(DataTypes.ROW_DATA, this.handleFilterViewUpdate);
        filterView.destroy();
    }

    handleSearchText = searchText => {
        this.searchText = searchText;
        this.props.onSearchText(this.props.column, searchText);
        // if we're removing searchtext to widen the search, we need to reevaluate the selectionDefault

    }

    handleDeselectAll= () => {
        if (this.searchText){
            this.props.onSelectionChange(null, EXCLUDE, this.searchText);
        } else {
            this.setState({
                selectionDefault: SELECT_NONE
            }, () => {
                this.props.onSelectionChange(null, EXCLUDE);
            });

        }
    }

    handleSelectAll= () => {
        if (this.searchText){
            this.props.onSelectionChange(null, INCLUDE, this.searchText);
        } else {
            this.setState({
                selectionDefault: SELECT_ALL
            }, () => {
                this.props.onSelectionChange(null, INCLUDE);
            });
        }
    }

    handleSelectionChange = (selectedIndices, idx) => {
        // what about range selections ?
        const {filterView} = this.state;
        const {KEY} = filterView.meta;

        const selectionIncluded = selectedIndices.includes(idx);
        const filterMode = selectionIncluded ? INCLUDE : EXCLUDE;
        const value =  filterView.itemAtIdx(idx)[KEY];       

        this.props.onSelectionChange(value, filterMode);
    }
}
