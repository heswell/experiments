import React from 'react';
import cx from 'classnames';
import { CommandStatus } from '../utils/command-utils';
import { SuggestionsToolTip } from './tooltip/command-tooltip';
import SearchSuggestions from './search/search-suggestions';
import CommandCue from './cue/command-cue';

import './command-suggestions.css';

const styles = {
  speedbarSuggestions: 'command-suggestions',
  speedbarSuggestionsMessage: 'command-suggestions-message',
  speedbarSuggestionsErrorMessage: 'command-suggestions-error-message',
  speedbarSuggestionsErrorIcon: 'command-suggestions-error-icon',
  speedbarSuggestionsUnresolvedSearch: 'command-suggestions-unresolved-search',

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
      commandState,
      unresolvedSearchResults=[]
    } = this.props;

    const searchIsUnresolved = unresolvedSearchResults.length > 0;
    const isComplete = commandState.commandStatus === CommandStatus.CommandComplete;
    const showSuggestions = suggestions.length > 0;
    const showCommandCue = isComplete || (!showSuggestions && tokenDescriptors.length > 0);
    const showTooltip = !searchIsUnresolved && !showCommandCue && !showSuggestions;

    const [unmatched] = unresolvedSearchResults;
    
    return <>
      {showCommandCue && (
        <CommandCue
          searchIsUnresolved={searchIsUnresolved}
          commandState={commandState}
          tokenDescriptors={tokenDescriptors}
        />)}
      {showSuggestions && (
        <SearchSuggestions
          searchTerm={searchTerm}
          suggestions={suggestions}
          selectedIdx={selectedSuggestionIdx}
          onSelect={onSelectSuggestion}
        />
      )}
      {showTooltip && (
        <SuggestionsToolTip
          searchTerm={searchTerm}
          suggestions={defaultSuggestions}
          selectedSuggestionIdx={selectedSuggestionIdx}
          onSelect={onSelectSuggestion}
        />
      )}
    </>
  }
}

