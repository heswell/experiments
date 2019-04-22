import React from 'react';
import { buildRegexFromSearchTerm } from '../../../token-search/token-search';
import SearchSuggestion from './search-suggestion';

import './search-suggestions.css';

const styles = {
  searchSuggestions: 'search-suggestions'
}
export default class SearchSuggestions extends React.Component {
  constructor(props) {
    super(props);

    this.table = React.createRef();
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    const suggestionld = e.currentTarget.dataset.id;
    if (suggestionld) {
      this.props.onSelect(suggestionld);
    }
  };

  componentDidMount(){
     this.measureCells(); 
  }
  componentDidUpdate(){
    this.measureCells(); 
  }

  measureCells(){
    if (this.table.current){
      const table = this.table.current;
      // todo once only
      const {width} = table.parentElement.getBoundingClientRect();
      //TODO measure this
      const scrollbarWidth = 15;
      const row = table.querySelector('tr');
      if (row){
        const cells = Array.from(row.childNodes);
        const widths = cells.map(cell => cell.clientWidth);
        const contentWidth = widths.reduce((a,b) => a+b)
        const widthOfLastCell = widths.slice(-1);

        const adjustment = (contentWidth + scrollbarWidth) - width;
        if (adjustment > 0){
          const widthPx = (widthOfLastCell - adjustment) + 'px'
          const cellContainers = table.querySelectorAll('td:last-child .cell-container');
          cellContainers.forEach(div => div.style.width = widthPx)
        }
      }
      if (this.props.selectedIdx !== -1){
        const selectedItem = table.querySelector('.search-suggestion-selected');
        if (selectedItem){
          console.log(`got a selected item`)
          selectedItem.scrollIntoViewIfNeeded(false);
        }
      }
    }
  }

  render() {
    const { selectedIdx, searchTerm } = this.props;
    const pattern = buildRegexFromSearchTerm(searchTerm);
    return (
      <table className={styles.searchSuggestions} ref={this.table}>
        <tbody>
        {this.props.suggestions.map((suggestion, idx) => {
          return (
            <SearchSuggestion
              key={idx}
              isSelected={selectedIdx === idx}
              suggestion={suggestion}
              searchTermPattern={pattern}
              onClick={this.handleClick} />
          )
        })}
        </tbody>
      </table>
    );
  }
}