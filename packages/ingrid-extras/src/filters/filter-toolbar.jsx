import React from 'react';
import './filter-toolbar.css';

export default class SearchBar extends React.Component {

    constructor(props){
        super(props)
        this.state = {
            searchText: ''
        }
    }
    
    render() {
        const {style: {height}, inputWidth, onHide} = this.props
        return (
            <div className='filter-toolbar' style={{height}}>
                <div className='filter-button' onClick={onHide}>
                    <i className="material-icons">filter_list</i>
                </div>
                <input className='search-text' style={{width: inputWidth}} type='text' value={this.state.searchText} onChange={e => this.handleSearchTextChange(e)} />
            </div>
        )
    }
    handleSearchTextChange(evt){
        const { value } = evt.target;
        let {searchText} = this.state;

        if (searchText && !value){

        } else if (value && !searchText){

        }
        this.setState({ searchText: value });
        this.props.onSearchText(value);
    }
    
}
