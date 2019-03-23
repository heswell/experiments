
import React from 'react';
import cx from 'classnames';
import {FilterView} from '../../data/view';
import FlexBox from '../../inlay/flexBox';
import {filter as filterConstants} from '../../data';
import CheckList from './checkList';
import SearchBar from './filter-toolbar'
import './setFilter.css';

const NO_STYLE = {}

const {INCLUDE, EXCLUDE} = filterConstants
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
        const selectionDefault = filter && filter.mode !== EXCLUDE ? false : true;
        console.log(`SetFilter.constructor create a new filterView`)
        const filterView = new FilterView(props.dataView, props.column);
        this.state = {
            filterView,
            selectionDefault
        };
        this.searchText = ''
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

        const {filterView, searchText=''} = this.state;
        const clickHandler = this.state.selectionDefault ? this.handleDeselectAll : this.handleSelectAll;
        const selectionText = this.state.selectionDefault ? 'DESELECT ALL' : 'SELECT ALL';

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
                        searchText={searchText}
                        onSearchText={this.handleSearchText}
                        selectionText={selectionText}
                        onClickSelectionText={clickHandler}
                        onHide={this.props.onClose}/>}
                    <CheckList style={{flex: 1, margin: '3px 3px 0 3px', border: '1px solid lightgray'}} debug_title={this.props.title}
                        column={column}
                        selectionDefault={true}
                        columns={filterView.columns}
                        dataView={filterView}
                        onSelectionChange={this.handleSelectionChange}/>
                    {suppressFooter !== true &&
                    <div key='footer' className='footer' style={{height: 26}}>
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
        // if we're removing searchtext to widen the search, we need to reevaluate the selectionDefault

    }

    handleDeselectAll= () => {
        if (this.searchText){
            this.setState({
                selected: [],
            }, () => {
                this.props.onSelectionChange(null, EXCLUDE, this.searchText);
            });

        } else {
            this.setState({
                selected: [],
                selectionDefault: false
            }, () => {
                this.props.onSelectionChange([], INCLUDE);
            });

        }
    }

    handleSelectAll= () => {
        if (this.searchText){
            const {filterView} = this.state;
            // we do want to select all the items currently in the grid
            // add everything in the current viewport to selected, emit an event which will create a
            // new filter which included all values matching starts with filter
            this.setState({
                selected: filterView.selectAll()
            }, () => {
                this.props.onSelectionChange(null, INCLUDE, this.searchText);
            });
        } else {
            this.setState({
                selectionDefault: true
            }, () => {
                this.props.onSelectionChange([], EXCLUDE);
            });
        }
    }

    handleSelectionChange = (selectedIndices, idx) => {
        // what about range selections ?
        const selectionExtended = selectedIndices.includes(idx);

        const {selectionDefault, filterView} = this.state;
        const filterMode = selectionDefault === true
            ? (selectionExtended ? INCLUDE : EXCLUDE)
            : (selectionExtended ? EXCLUDE : INCLUDE);

        const {KEY} = filterView.meta;
        const value =  filterView.itemAtIdx(idx)[KEY];       
        this.props.onSelectionChange(value, filterMode);
    }
}
