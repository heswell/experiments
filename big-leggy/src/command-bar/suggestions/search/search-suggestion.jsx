import React from 'react';
import cn from 'classnames';

import './search-suggestion.css'

const styles = {
  speedbarSearchItem: 'search-suggestion-suggested-item',
  speedbarSearchCol: 'search-suggestion-search-col',
  speedbarSearchMatch: 'search-suggestion-search-match',
  speedbarSearchItemSelected: 'search-suggestion-selected'
}

export default class SearchSuggestion extends React.Component {

  renderCol(displayText, idx) {
    const { searchTermPattern } = this.props;
    const textChunks = displayText.split(searchTermPattern);

    return (
      <td key={idx} className={styles.speedbarSearchCol}>
        <div className="cell-container">
        {textChunks.map((textChunk, chunkIdx) => {
          if (searchTermPattern.test(textChunk)) {
            return (
              <span key={chunkIdx} className={styles.speedbarSearchMatch}>
                {textChunk}
              </span>
            );
          } else {
            return textChunk;
          }
        })}
        </div>
      </td>
    )
  }

  render() {
    const { suggestion: { value, suggestionText }, isSelected, onClick, style } = this.props;
    const displayText = Array.isArray(suggestionText)
      ? suggestionText
      : [suggestionText];

    return (
      <tr
        data-id={value}
        tablndex={-1}
        className={cn(styles.speedbarSearchItem, {
          [styles.speedbarSearchItemSelected]: isSelected
        })}
        onClick={onClick}
      >
        {displayText.map((text, idx) => this.renderCol(text, idx, styles))}
      </tr>
    );
  }
}