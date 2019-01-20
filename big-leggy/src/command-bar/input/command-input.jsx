import React from 'react';
import cx from 'classnames'
import * as Key from '../../utils/key-code';
import { CommandStatus, getCommandWithPrefix } from '../utils/command-utils';
import { TokenMirror } from './token-mirror/token-mirror'

import './command-input.css';

export const NavigationDirection = {
  FWD: 'FWD',
  BWD: 'BWD'
}

const styles = {
  speedbar: 'speedbar',
  speedbarOuterContainer: 'speedbar-outer-container',
  speedbarCommand: 'speedbar-command',
  speedbarInnerContainer: 'speedbar-inner-container',
  speedbarScrollingContainer: 'speedbar-scrolling-container',
  speedbarInput: 'speedbar-input',
  speedbarErrorIcon: 'speedbar-error-icon',
  speedbarCommandHint: 'speedbar-command-hint',
  speedbarSuccessIcon: 'speedbar-success-icon'
}

export const SpeedbarTopics = {
  SuggestionSync: 'suggestion-sync'
};

export const InputMethod = {
  AcceptSuggestion: 'accept-suggestion',
  PasteCommand: 'paste-command',
  Userlnput: 'user-input'
}

export default class CommandInput extends React.Component {

  constructor(props) {
    super(props);

    this.containerElement = React.createRef();
    this.scrollingElement = React.createRef();
    this.inputElement = React.createRef();

    this.suggestionsChannel = new BroadcastChannel(SpeedbarTopics.SuggestionSync);
    this.cursorPosition = 0;
    this.cursorTimeout = 0;

    this.state = {
      containerWidth: undefined,
      inputWidth: '100%'
    }

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handlePaste = this.handlePaste.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleContentResize = this.handleContentResize.bind(this);
    this.handleContainerResize = this.handleContainerResize.bind(this);
    this.handleSelectionChange = this.handleSelectionChange.bind(this);
  }

  componentDidMount() {
    if (this.containerElement.current) {
      const { width } = this.containerElement.current.getBoundingClientRect();
      this.setState({
        containerWidth: width
      })
    }
    if (this.inputElement.current) {
      this.inputElement.current.focus();
    }
  }
  componentWillUnmount() {
    this.suggestionsChannel.close();
  }

  componentWillReceiveProps(nextProps) {
    const {
      searchTerm,
      suggestions,
      commandState: { commandStatus: newStatus }
    } = nextProps

    const {
      commandState: { commandStatus: oldStatus }
    } = this.props;
    if (newStatus === CommandStatus.Empty && oldStatus !== CommandStatus.Empty) {
      this.setState({ inputWidth: '100%' });
    } else if (suggestions.length === 1 && searchTerm !== this.props.searchTerm) {
      // do we want to auto-accept suggestion if there is only 1 ?
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

  handleSelectionChange() {
    const cursorPosition = this.getCursorPosition();
    console.log(`selectionchange cursor pos ${cursorPosition}`)
  }

  async handleChange(e) {
    const value = e.target.value;
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
          } else if (this.canClearToken()) {
            this.cursorPosition = this.getCursorPosition();
            this.clearToken();
          }
        }
        break;
      case Key.ESC:
        this.props.onShouldClose();
        break;
      default:

        switch (e.key) {
          case Key.HOME:
            e.preventDefault();
            this.scroll('start')
            break;
          case Key.END:
            e.preventDefault();
            this.scroll('end')
            break;
          default:
        }
        if (this.shouldNavigateSuggestions(e.keyCode)) {
          // default behaviour for UP/DOWN moves cursor to end of input
          e.preventDefault();
          this.props.onNavigateSuggestions(
            e.keyCode === Key.DOWN ? NavigationDirection.FWD : NavigationDirection.BWD
          )
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
  canClearToken() {
    const { inputText, tokenList } = this.props;
    const cursorPosition = this.getCursorPosition();
    if (tokenList) {
      const offset = inputText[cursorPosition - 1] === ' ' ? cursorPosition - 1 : cursorPosition
      const token = tokenList.getTokenAtOffset(offset);
      if (token && token.searchId && this.hasAcceptedSuggestion(token.searchId)) {
        return true;
      }
    }
    return false;
  }

  clearToken() {
    const cursorPosition = this.getCursorPosition();
    this.props.onClearToken(cursorPosition);
  }

  scroll(direction) {
    console.log(`scroll ${direction}`);
    if (this.state.inputWidth !== '100%') {
      // this.setState({
      //   scrollLeft: 0
      // })
      if (direction === 'start') {
        const { containerWidth, inputWidth } = this.state;
        const scrollDistance = containerWidth - inputWidth;
        this.scrollingElement.current.style.right = scrollDistance + 'px';
        this.setCursorPosition(0);
      } else {
        this.scrollingElement.current.style.right = '0px';
        this.setCursorPosition(1000);
      }
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
    return this.props.suggestions.length === 1;
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
    const endOflnputText = this.props.inputText.length;
    if (this.inputElement.current) {
      const { selectionStart } = this.inputElement.current;
      return selectionStart === null ? endOflnputText : selectionStart;
    } else {
      return endOflnputText;
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
  handleContainerResize(width) {
    if (this.state.containerWidth !== width) {
      this.setState({
        containerWidth: width
      })
    }
  }

  handleContentResize(width) {
    this.setState({
      inputWidth: width || '100%'
    })
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
          <div className={styles.speedbarInnerContainer}>
            <div ref={this.scrollingElement} className={styles.speedbarScrollingContainer}>
              {showCommand && (
                <TokenMirror
                  tokenList={tokenList}
                  onContainerResize={this.handleContainerResize}
                  onContentResize={this.handleContentResize}
                  width={this.state.containerWidth} />
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
            </div>
          </div>
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
        <div className={styles.speedbarCommandSuccess}>
          <i className={cx('material-icons', styles.speedbarSuccessIcon)}>check_circle</i>
          <span>Success</span>
        </div>
      );
    } else {
      return null;
    }
  }
}

