import React from 'react';
import cx from 'classnames';
import { hilightSearchTermMatchesInText } from './suggestion-utils';
import './command-tooltip.css';

const DEFAULT_ICON = 'arrow_forward';

const styles = {
  suggestionsTooltip: 'suggestions-tooltip',
  suggestionsTooltipTitle: 'suggestions-tooltip-title',
  suggestionsTooltipShortcuts: 'suggestions-tooltip-shortcuts',
  suggestionsTooltipSuggestions: 'suggestions-tooltip-suggestions',
  suggestionsTooltipSuggestion: 'suggestions-tooltip-suggestion',
  suggestionsTooltipSelected: 'suggestions-tooltip-selected',
  suggestionsTooltipIcon: 'suggestions-tooltip-icon',
  suggestionsTooltipCommandName: 'suggestions-tooltip-command-name',
  suggestionsTooltipCommandDescription: 'suggestions-tooltip-command-description'
}

export const SuggestionsToolTip = ({
  suggestions,
  selectedSuggestionIdx,
  searchTerm,
  onSelect
}) => {
  return (
    <div className={styles.suggestionsTooltip}>
      <div className={styles.suggestionsTooltipHeader}>
        <span className={styles.suggestionsTooltipTitle}>Some things you can do...</span>
        <span className={styles.suggestionsTooltipShortcuts}>(CTRL + ALT + M)</span>
      </div>
      <div className={styles.suggestionsTooltipSuggestions}>
        {suggestions.map((suggestion, idx) => {
          const { value, suggestionText, icon = DEFAULT_ICON, className = '' } = suggestion;
          const isSelected = selectedSuggestionIdx === idx;
          return (
            <div
              key={idx}
              className={cx(styles.suggestionsTooltipSuggestion, className, {
                [styles.suggestionsTooltipSelected]: isSelected
              })}
              // tslintrdisable jsx-no-lambda
              onClick={() => onSelect(value)}
            // tslintrenable jsx-no-lambda
            >
              <i className={cx('material-icons',styles.suggestionsTooltipIcon)}>{icon}</i>
              <span className={styles.suggestionsTooltipCommandName}>
                {hilightSearchTermMatchesInText(value, searchTerm)}
              </span>
              <span className={styles.suggestionsTooltipCommandDescription}>{suggestionText}</span>
            </div>
          )
        })}
      </div>
    </div>
  );
};

