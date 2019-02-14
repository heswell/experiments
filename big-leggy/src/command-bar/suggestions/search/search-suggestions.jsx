import React from 'react';
import cx from 'classnames';
import { buildRegexFromSearchTerm } from	'../../../token-search/token-search';

import './search-suggestions.css';

const styles = {
  selected: 'search-suggestion-selected',
  searchMatch: 'search-suggestion-search-match',
  suggestedItem: 'search-suggestion-suggested-item'
}
export default class SearchSuggestions extends React.Component {
  constructor(props){
    super(props);
    
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e){
    const suggestionld = e.currentTarget.dataset.id;
    if (suggestionld) {
      this.props.onSelect(suggestionld);
    }
  };

  render() {
    const pattern = buildRegexFromSearchTerm(this.props.searchTerm);
    return (
      <div className={styles.speedbarSearchSuggestions}>
        {this.props.suggestions.map((suggestion, idx) => {
          const isSelected = this.props.selectedIdx === idx;
          const textChunks = suggestion.suggestionText.split(pattern);
          return (
            <div
              key={`${idx}-${suggestion.value}`}
              data-id={suggestion.value}
              tablndex={-1}
              className={cx(styles.suggestedItem, { [styles.selected]: isSelected })}
              onClick={this.handleClick}
            >
              {textChunks.map((textChunk, chunkIdx) => {
                if (pattern.test(textChunk)) {
                  return (
                    <span key={chunkIdx} className={styles.searchMatch}>
                      {textChunk}
                    </span>
                  );
                } else {
                  return textChunk;
                }
              })}
            </div>
          )
        })}
      </div>
    );
  }
}