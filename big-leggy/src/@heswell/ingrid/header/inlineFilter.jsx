import React from 'react';
import ReactDOM from 'react-dom';
import Header from './header';
import ColumnFilter from './columnFilter';
import {filter} from '../../data'

const {STARTS_WITH} = filter;

export default class InlineFilter extends React.Component {

    header;

    state = { scrollLeft: 0 }

    render(){
        const {filter} = this.props.gridModel;
        const {showFilter, onFilter, onSelect, onFilterOpen, onFilterClose, onClearFilter, onSearchText, dataView, ...rest} = this.props;
        const colHeaderRenderer = ({key,column}) =>
            <ColumnFilter key={key}
                column={column}
                dataView={dataView}
                filter={filter}
                onKeyDown={this.handleKeyDown}
                onClearFilter={onClearFilter}
                onFilterOpen={onFilterOpen}
                onFilterClose={onFilterClose}
                onSearchText={onSearchText}
                showFilter={showFilter === column.name}
                onFilter={onFilter}
                onSelect={onSelect}/>;
        
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