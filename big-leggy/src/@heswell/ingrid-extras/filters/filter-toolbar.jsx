import React from 'react';
import './filter-toolbar.css';

export default class SearchBar extends React.Component {

    state = {
        searchText: ''
    }
    render() {
        const {style: {height}, inputWidth, selectionText, onClickSelectionText, onHide} = this.props
        return (
            <div className='filter-toolbar' style={{height}}>
                <div className='filter-button' onClick={onHide}>
                    <i className="material-icons">filter_list</i>
                </div>
                <input className='search-text' style={{width: inputWidth}} type='text' value={this.state.searchText} onChange={this.handleSearchTextChange} />
                <div className='mass-select' onClick={onClickSelectionText}>{selectionText}</div>
            </div>
        )
    }
    handleSearchTextChange = evt => {
        const { value } = evt.target;
        let {searchText} = this.state;

        if (searchText && !value){

        } else if (value && !searchText){

        }
        this.setState({ searchText: value });
        this.props.onSearchText(value);
    }
    
}
