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

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    const suggestionld = e.currentTarget.dataset.id;
    if (suggestionld) {
      this.props.onSelect(suggestionld);
    }
  };

  render() {
    const { selectedIdx, searchTerm } = this.props;
    const pattern = buildRegexFromSearchTerm(searchTerm);
    return (
      <div className={styles.searchSuggestions}>
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
      </div>
    );
  }
}