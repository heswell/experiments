import React from 'react';
import cn from 'classnames';

import './search-suggestion.css'

const styles = {
  newSpeedbarSearchItem: 'search-suggestion-suggested-item',
  newSpeedbarSearchCol: 'search-suggestion-search-col',
  newSpeedbarSearchMatch: 'search-suggestion-search-match',
  newSpeedbarSearchItemSelected: 'search-suggestion-selected'
}

export default class SearchSuggestion extends React.Component {

  renderCol(displayText, idx, themedStyles) {
    const { searchTermPattern } = this.props;
    const textChunks = displayText.split(searchTermPattern);

    return (
      <span key={idx} className={themedStyles.newSpeedbarSearchCol}>
        {textChunks.map((textChunk, chunkIdx) => {
          if (searchTermPattern.test(textChunk)) {
            return (
              <span key={chunkIdx} className={themedStyles.newSpeedbarSearchMatch}>
                {textChunk}
              </span>
            );
          } else {
            return textChunk;
          }
        })}
      </span>
    )
  }

  render() {
    const { suggestion: { value, suggestionText }, isSelected, onClick } = this.props;
    const displayText = Array.isArray(suggestionText)
      ? suggestionText
      : [suggestionText];

    return (
      <div
        data-id={value}
        tablndex={-1}
        className={cn(styles.newSpeedbarSearchItem, {
          [styles.newSpeedbarSearchItemSelected]: isSelected
        })}
        onClick={onClick}
      >
        {displayText.map((text, idx) => this.renderCol(text, idx, styles))}
      </div>
    );
  }
}