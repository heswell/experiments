import React from 'react';
import cx from 'classnames';
import { SuggestionsToolTip } from './tooltip/command-tooltip';
import SearchSuggestions from './search/search-suggestions';
import CommandCue from './cue/command-cue';

import './command-suggestions.css';

const styles = {
  speedbarSuggestions: 'command-suggestions',
  speedbarSuggestionsMessage: 'command-suggestions-message',
  speedbarSuggestionsErrorMessage: 'command-suggestions-error-message',
  speedbarSuggestionsErrorIcon: 'command-suggestions-error-icon'
}

export default class CommandSuggestions extends React.Component {
  render() {
    const { errorMessage, commandState: { message } } = this.props;
    return (
      <div className={styles.speedbarSuggestions}>
        {errorMessage || message ? (
          <div
            className={cx(styles.speedbarSuggestionsMessage, {
              [styles.speedbarSuggestionsErrorMessage]: !!errorMessage
            })}
          >
            {errorMessage && (
              <i className={cx(styles.speedbarSuggestionsErrorIcon, 'material-icons')}>error</i>
            )}
            <span>{errorMessage || message}</span>
          </div>
        ) : (
            this.getContent()
          )}
      </div>
    );
  }

  getContent() {
    const {
      tokenDescriptors,
      searchTerm,
      suggestions,
      defaultSuggestions,
      selectedSuggestionIdx,
      onSelectSuggestion,
      commandState
    } = this.props;

    if (suggestions.length > 0) {
      return (
        <SearchSuggestions
          searchTerm={searchTerm}
          suggestions={suggestions}
          selectedIdx={selectedSuggestionIdx}
          onSelect={onSelectSuggestion}
        />
      );
    } else if (tokenDescriptors.length > 0) {
      return (
        <CommandCue
          commandState={commandState}
          tokenDescriptors={tokenDescriptors}
        />
      );
    } else {
      return (
        <SuggestionsToolTip
          searchTerm={searchTerm}
          suggestions={defaultSuggestions}
          selectedSuggestionIdx={selectedSuggestionIdx}
          onSelect={onSelectSuggestion}
        />
      );
    }
  }
}

