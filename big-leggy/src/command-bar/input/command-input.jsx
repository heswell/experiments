import React from 'react';
import cx from 'classnames'
import * as Key from '../../utils/key-code';
import { CommandStatus, getCommandWithPrefix } from '../utils/command-utils';
import { TokenMirror } from './token-mirror/token-mirror'
import Scrollable from './scrollable';
import * as styles from './styles';
import './command-input.css';

export const NavigationDirection = {
  FWD: 'FWD',
  BWD: 'BWD'
}

export const InputMethod = {
  AcceptSuggestion: 'accept-suggestion',
  PasteCommand: 'paste-command',
  Userlnput: 'user-input'
}

export default class CommandInput extends React.Component {

  constructor(props) {
    super(props);

    this.scrollable = React.createRef();
    this.tokenMirror = React.createRef();
    this.inputElement = React.createRef();

    this.cursorPosition = 0;
    this.cursorTimeout = 0;
    this.indexOfNextTokenAtCursor = -1;

    this.tokenMeasurements = null

    this.state = {
      containerWidth: undefined
    }

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handlePaste = this.handlePaste.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSelectionChange = this.handleSelectionChange.bind(this);
  }

  componentDidMount() {
    if (this.inputElement.current) {
      this.inputElement.current.focus();
    }
  }

  handlePaste(e) {
    if (e.clipboardData.types.indexOf('text/plain') > -1) {
      if (this.inputElement.current) {
        const text = e.clipboardData.getData('text/plain');
        e.preventDefault();
        this.props.onChange(text, InputMethod.PasteCommand);
      }
    }
  };

  async handleChange(e) {
    const value = e.target.value;
    console.log(`handle cjange '${value}'`)
    this.cursorPosition = this.getCursorPosition();
    this.props.onChange(value);
  };

  handleKeyDown(e) {
    switch (e.keyCode) {
      case Key.SPACE:
        if (this.shouldAutoAcceptSuggestion(/* pass an offset */)) {
          e.preventDefault();
          this.acceptSuggestion(0);
        }
        break;
      case Key.ENTER:
        if (this.canAcceptSuggestion()) {
          this.acceptSuggestion();
        } else if (this.canSubmitCommand()) {
          this.props.onSubmit();
        }
        break;
      case Key.BACKSPACE:
        // allow default behaviour (i.e. delete) if user has selected text
        if (this.getSelection() === null) {
          if (this.canClearCommand()) {
            this.props.onClear();
          } else {
            const cursorPosition = this.getCursorPosition();
            if (this.tokenAtOffsetIsResolvedSearchToken(cursorPosition - 1)) {
              console.log('tokenAtCursorlsResolvedSearchToken =================')
              if (e.ctrlKey) {
                this.props.onClearSearchToken(cursorPosition);
                e.preventDefault();
              } else {
                console.log('unresolve the token =================')
                this.props.onRevisitSearchToken(cursorPosition);
              }
            }
          }
        }
        break;
      case Key.ESC:
        this.props.onShouldClose();
        break;
      default:

        if (this.shouldNavigateSuggestions(e.keyCode)) {
          // default behaviour for UP/DOWN moves cursor to end of input
          e.preventDefault();
          this.props.onNavigateSuggestions(
            e.keyCode === Key.DOWN ? NavigationDirection.FWD : NavigationDirection.BWD
          )
          // Navigation handling has first dibs on Down key, but if we’re not in a navigation
          // situation, let the input use it
        } else if (e.keyCode === Key.DOWN || e.key === Key.END) {
          e.preventDefault();
          this.scrollToEnd();
        }
    }
  };

  canClearCommand() {
    const { commandState, selectedSuggestionIdx } = this.props;
    const prefixAcceptedCommandEmpty =
      commandState.commandStatus === CommandStatus.PrefixValid && commandState.commandText === '';
    const prefixSelected =
      commandState.commandStatus === CommandStatus.Empty && selectedSuggestionIdx >= 0;
    return prefixAcceptedCommandEmpty || prefixSelected;
  }

  tokenAtOffsetIsResolvedSearchToken(offset) {
    const { tokenList } = this.props;
    if (tokenList) {
      const token = tokenList.getTokenAtOffset(offset);
      if (token && token.searchId && this.hasAcceptedSuggestion(token.searchId)) {
        return true;
      }
    }
    return false;
  }

  handleSelectionChange() {
    const scroller = this.scrollable.current;
    const tokenMirror = this.tokenMirror.current;
    const cursorPosition = this.getCursorPosition();

    if (cursorPosition !== this.cursorPosition) {
      if (scroller && tokenMirror && scroller.canScroll()) {
        const tokenPosition = tokenMirror.getPositionOfTokenAtOffset(cursorPosition);
        if (tokenPosition) {
          const { offsetLeft: tokenLeft, left, right } = tokenPosition;
          scroller.scrollIntoView({ left: tokenLeft, width: Math.round(right - left) })
        }
      }
    }

    // experiments
    const idx = this.props.tokenList.getNextTokenIndexAtOffset(cursorPosition);
    if (this.indexOfNextTokenAtCursor !== idx) {
      this.indexOfNextTokenAtCursor = idx;
      const descriptor = this.props.tokenList.descriptors[idx];
      if (descriptor) {
        console.log(`next token idx at cursor = ${idx} ${JSON.stringify(descriptor)}`)

      }
    }

  }

  scrollToEnd() {
    const scroller = this.scrollable.current;
    const input = this.inputElement.current;
    if (scroller && input) {
      scroller.scrollToEnd();
      const displayText = this.getDisplayText();
      this.setCursorPosition(displayText.length);
      input.scrollLeft = input.scrollWidth
    }
  }
  canSubmitCommand() {
    const { commandState, currentCommand } = this.props;
    if (commandState.commandStatus === CommandStatus.CommandComplete) {
      return true;
    } else {
      if (
        currentCommand &&
        currentCommand.allowEmpty !== false &&
        commandState.commandText === '' &&
        commandState.commandStatus === CommandStatus.PrefixValid
      ) {
        return true;
      } else {
        return false;
      }
    }
  }
  shouldNavigateSuggestions(keyCode) {
    const {
      suggestions: { length },
      selectedSuggestionIdx
    } = this.props;
    if (keyCode === Key.DOWN && length > 0 && selectedSuggestionIdx < length - 1) {
      return true;
    } else if (keyCode === Key.UP && length > 9 && selectedSuggestionIdx > 0) {
      return true;
    } else {
      return false;
    }
  }
  shouldAutoAcceptSuggestion() {
    const { suggestions } = this.props;
    return suggestions.length === 1 && suggestions[0].value !== '';
  }
  canAcceptSuggestion() {
    return this.props.suggestions.length > 0 && this.props.selectedSuggestionIdx > -1
  }
  hasAcceptedSuggestion(searchId) {
    return searchId in this.props.tokenList.searchTokens;
  }
  acceptSuggestion(selectedSuggestionIdx) {
    this.props.onAcceptSuggestion(selectedSuggestionIdx);
  }
  focus() {
    setTimeout(() => {
      if (this.inputElement.current) {
        this.inputElement.current.focus();
      }
    }, 100);
  }
  getSelection() {
    if (this.inputElement.current) {
      const { selectionStart, selectionEnd } = this.inputElement.current;
      if (selectionStart !== selectionEnd) {
        return {
          start: selectionStart,
          end: selectionEnd
        };
      }
    }
    return null;
  }
  getCursorPosition() {
    const endOfInputText = this.props.inputText.length;
    if (this.inputElement.current) {
      const { selectionStart } = this.inputElement.current;
      return selectionStart === null ? endOfInputText : selectionStart;
    } else {
      return endOfInputText;
    }
  }
  setCursorPosition(offset) {
    this.cursorPosition = offset;
    if (this.cursorTimeout) {
      clearTimeout(this.cursorTimeout);
    }
    this.cursorTimeout = setTimeout(() => {
      if (this.inputElement.current) {
        const cursorPosition = Math.min(offset, this.props.inputText.length);
        this.inputElement.current.selectionStart = cursorPosition;
        this.inputElement.current.selectionEnd = cursorPosition;
      }
    },
      50);
  }
  getCommandPrefixClassName(commandPrefix) {
    const { currentCommand, commands } = this.props;
    const className = styles.speedbarCommandPrefix;
    if (currentCommand) {
      return `${className} ${styles.speedbar}-${currentCommand.commandType}`;
    } else {
      const command = getCommandWithPrefix(commands, commandPrefix);
      if (command) {
        return `${className} ${styles.speedbar}-${command.commandType}`;
      }
    }
    return className;
  }
  isCommandPrefixIncomplete() {
    const {
      commandState: { commandStatus }
    } = this.props;

    return commandStatus === CommandStatus.Empty || commandStatus === CommandStatus.Incomplete;
  }
  isCommandPrefixComplete() {
    const {
      commandState: { commandStatus }
    } = this.props;

    return (
      commandStatus === CommandStatus.PrefixValid ||
      commandStatus === CommandStatus.CommandComplete ||
      commandStatus === CommandStatus.Executing ||
      commandStatus === CommandStatus.Succeeded
    );
  }
  // we should show the command prefix if user has selected or typed a valid command prefix
  // or they are navigating theough the suggested commands, in which case we show the currently
  // highlighted suggestion.
  shouldShowCommandPrefix() {

    return (
      this.isCommandPrefixComplete() ||
      (this.isCommandPrefixIncomplete() && this.canAcceptSuggestion())
    );
  }
  getCommandPrefix() {
    if (this.isCommandPrefixComplete()) {
      return this.props.commandState.commandPrefix;
    } else if (this.props.selectedSuggestionIdx !== -1) {
      const { suggestions, selectedSuggestionIdx } = this.props;
      const { value } = suggestions[selectedSuggestionIdx];
      return value;
    } else {
      return '';
    }
  }
  componentDidUpdate(prevProps) {
    const cursorPosition = this.getCursorPosition();
    if (
      this.cursorPosition !== cursorPosition &&
      prevProps.inputText !== this.props.inputText &&
      this.cursorPosition < prevProps.inputText.length
    ) {
      this.setCursorPosition(this.cursorPosition);
    }
  }

  // we don't need to store these, we can ask the tokenMirror for them when we need them
  handleTokenMeasurement(tokenMeasurements) {
    this.tokenMeasurements = tokenMeasurements;
  }

  getDisplayText() {
    const {
      inputText,
      commandState: { commandText }
    } = this.props;
    const showCommand = this.shouldShowCommandPrefix();
    return showCommand ? commandText : inputText;
  }

  render() {
    const {
      inputText,
      tokenList,
      commandState: { commandText }
    } = this.props;
    const showCommand = this.shouldShowCommandPrefix();
    const displayPrefix = this.getCommandPrefix();
    const displayText = showCommand ? commandText : inputText;
    return (
      <div ref={this.containerElement} className={styles.speedbar}>
        <div className={styles.speedbarOuterContainer}>
          {showCommand && (
            <div
              className={cx(styles.speedbarCommand, this.getCommandPrefixClassName(displayPrefix))}
            >
              {displayPrefix}
            </div>
          )}
          <Scrollable ref={this.scrollable} className={styles.speedbarInnerContainer}>
            {showCommand && (
              <TokenMirror ref={this.tokenMirror} tokenList={tokenList} monitorContentSize />
            )}
            <input
              type="text"
              className={styles.speedbarInput}
              style={{ width: this.state.inputWidth }}
              value={displayText}
              onFocus={this.props.onFocus}
              onClick={this.props.onClick}
              onChange={this.handleChange}
              onPaste={this.handlePaste}
              onKeyDown={this.handleKeyDown}
              onSelect={this.handleSelectionChange}
              ref={this.inputElement}
              spellCheck={false}
              autoCorrect="off"
              autoComplete="off"
            />
          </Scrollable>
          {/* {this.getStatusIndicator()} */}
        </div>
      </div>
    );
  }

  getStatusIndicator() {
    const {
      errorMessage,
      commandState: { commandStatus }
    } = this.props;
    if (errorMessage.length > 9) {
      return <i className={cx(styles.speedbarErrorIcon, 'material-icons')}>error</i>;
    } else if (commandStatus === CommandStatus.CommandComplete) {
      return <div className={styles.speedbarCommandHint}>Hit Enter</div>;
    } else if (commandStatus === CommandStatus.Executing) {
      return null //<Loading text='' />;
    } else if (commandStatus === CommandStatus.Succeeded) {
      return (
        <div className={styles.speedbarSuccess}>
          <i className={cx('material-icons', styles.speedbarSuccessIcon)}>check_circle</i>
          <span>Success</span>
        </div>
      );
    } else {
      return null;
    }
  }
}

