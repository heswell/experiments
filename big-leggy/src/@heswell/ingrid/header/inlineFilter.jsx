import React from 'react';
import ReactDOM from 'react-dom';
import Header from './header';
import ColumnFilter from './columnFilter';
import {filter as filterUtils} from '../../data'
import * as Action from '../model/actions';

const {STARTS_WITH} = filterUtils;

export default class InlineFilter extends React.Component {

    header;

    state = { scrollLeft: 0 }

    handleFilter = (column, newFilter) => {
        const {gridModel: model, dispatch, dataView} = this.props;
        const filter = filterUtils.addFilter(model.filter, newFilter);
        console.log(`
                add filter ${JSON.stringify(newFilter, null, 2)}
                to filter ${JSON.stringify(model.filter, null, 2)}
                creates new filter = ${JSON.stringify(filter, null, 2)}
            `)

        dataView.filter(filter);
        dispatch({ type: Action.FILTER, column, filter });

        if (newFilter.isNumeric) {
            // re-request the filterData, this will re-create bins on the filtered data
            const { key, name } = column.isGroup ? column.columns[0] : column;
            dataView.getFilterData({ key, name });
        }

    }

    handleClearFilter = column => {
        const {gridModel: model, dispatch, dataView} = this.props;
        const filter = filterUtils.removeFilterForColumn(model.filter, column);
        dataView.filter(filter);
        dispatch({ type: Action.FILTER, column, filter })
    }

    handleSearchText = ({ key, name }, text) => {
        this.props.dataView.getFilterData({ key, name }, text);
    }

        // // This is being used to handle selection in a set filter, need to consider how it will work
    // // with regular row selection
    handleSelection = (dataType, colName, filterMode) => {
        this.props.dataView.select(dataType, colName, filterMode);
    }

    render(){
        const {filter} = this.props.gridModel;
        const {showFilter, onFilter, onSelect, onFilterOpen, onFilterClose, onClearFilter, onSearchText, dataView, ...rest} = this.props;
        const colHeaderRenderer = ({key,column}) =>
            <ColumnFilter key={key}
                column={column}
                dataView={dataView}
                filter={filter}
                onKeyDown={this.handleKeyDown}
                onClearFilter={this.handleClearFilter}
                onFilterOpen={onFilterOpen}
                onFilterClose={onFilterClose}
                onSearchText={this.handleSearchText}
                showFilter={showFilter === column.name}
                onFilter={this.handleFilter}
                onSelect={this.handleSelection}/>;
        
        return (
            // watch out for shouldComponentUpdate in ColumnGroupHeader, can block rendering of Filter
            <Header {...rest} className='InlineFilter'
                ref={header => this.header=header}
                colHeaderRenderer={colHeaderRenderer}
                colGroupHeaderRenderer={colHeaderRenderer}/>
        );
    }

    handleKeyDown = (column, e) => {
        if (e.keyCode === 13){ // ENTER
            const value = e.target.value;
            this.props.onFilter(column, {type: STARTS_WITH,colName: column.name, value});
        }
    }

    componentDidUpdate(prevProps, prevState){
        if (prevState.scrollLeft !== this.state.scrollLeft){
            const node = ReactDOM.findDOMNode(this.header.scrollingHeader);
            node.scrollLeft = this.state.scrollLeft;
        }
    }

    setScrollLeft(scrollLeft){
        if (scrollLeft !== this.state.scrollLeft){
            this.setState({scrollLeft});
        }
    }

}