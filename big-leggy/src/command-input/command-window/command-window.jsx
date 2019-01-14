import * as React from 'react';
import {
  CommandStatus,
  EmptyCommandState,
  parseCommand,
  matchCommandPrefix,
  buildDefaultSuggestions,
  removeTokenFromText,
  replaceCommandTextWithValues,
  replaceTextAtOffset
} from '../command-utils';

import {insertNonBreakingSpaces, resolveSearchTokens} from '../../token-search/token-search'
import { CommandSuggestionsMessageTypes as MessageType} from '../command-messages'
import CommandInput, { NavigationDirection, SpeedbarTopics, InputMethod} from '../command-input/command-input';
import CommandSuggestions from '../command-suggestions';
import { EmptyTokenList } from '../token-list';
import { showSpeedbarSuggestionsWindow, hideSpeedbarSuggestionsWindow, focusSpeedbarSuggestionsWindow} from '../window-utils';

import './command-window.css';

export const SpeedbarStatus = {
  Inactive: 'inactive',
  Active: 'active'
}

const styles = {
  speedbarWindow: 'command-window'
}

const EMPTY_STATE = {
  inputText: '',
  speedbarStatus: SpeedbarStatus.Active,
  commandState: EmptyCommandState,
  errorMessage: '',
  commandHints: undefined,
  searchTerm: '',
  suggestions: [],
  selectedSuggestionIdx: -1,
  searchTokens: {},
  command: undefined,
  tokenList: EmptyTokenList
};

export default class CommandWindow extends React.Component {

  constructor(props) {
    super(props);
    this.state = EMPTY_STATE;
    this.suggestionsChannel = new BroadcastChannel(SpeedbarTopics.SuggestionSync);
    this.suggestionsChannel.onmessage = this.handleMessageFromSpeedbar;
    this.width = 9;
    this.defaultSuggestions = buildDefaultSuggestions(props.commands);
    this.currentSearchTerm = '';
    this.rootEl = React.createRef();
    this.input = React.createRef();

    this.handleFocus = this.handleFocus.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.processInput = this.processInput.bind(this);
    this.processCommand = this.processCommand.bind(this);
    this.navigateSuggestions = this.navigateSuggestions.bind(this);
    this.acceptSuggestion = this.acceptSuggestion.bind(this);
    this.selectSuggestion = this.selectSuggestion.bind(this);
    this.clearState = this.clearState.bind(this);
    this.clearToken = this.clearToken.bind(this);
  }

  clearState(setlnactive = false) {
    this.setState({
      ...EMPTY_STATE,
      speedbarStatus: setlnactive ? SpeedbarStatus.Inactive : SpeedbarStatus.Active
    });
  };

  handleMessageFromSpeedbar(msg) {
    const speedbarMessage = msg.data;
    switch (speedbarMessage.type) {
      case MessageType.SpeedbarHidden:
        this.clearState();
        hideSpeedbarSuggestionsWindow();
        break;
      case MessageType.Focus:
        if (speedbarMessage.parentWindowBounds) {
          this.width = speedbarMessage.parentWindowBounds.width;
          showSpeedbarSuggestionsWindow(speedbarMessage.parentWindowBounds);
          this.sizeHeightToContent();
        } else {
          focusSpeedbarSuggestionsWindow();
          this.handleFocus();
        }
        break;
      case MessageType.Blur:
        hideSpeedbarSuggestionsWindow();
        break;
        default:
    }
  };
  handleFocus() {
    this.activate();
  }

  handleClick() {
    if (this.state.speedbarStatus === SpeedbarStatus.Inactive) {
      this.activate();
    }
  };

  activate() {
    this.setState({ speedbarStatus: SpeedbarStatus.Active });
  }
  componentDidMount() {
    this.sizeHeightToContent();
    if (this.input.current) {
      this.input.current.focus();
    }
  }
  componentWillUnmount() {
    this.suggestionsChannel.close();
  }
  componentDidUpdate() {
    this.sizeHeightToContent();
  }
  sizeHeightToContent() {
    if (this.rootEl.current) {
      const { clientHeight } = this.rootEl.current;
      // const suggestionsWindow = fin.desktop.Window.getCurrent();
      // suggestionsWindow.resizeTo(this.width, clientHeight, 'top-left');
    }
  }
  close() {
    hideSpeedbarSuggestionsWindow();
    this.suggestionsChannel.postMessage({
      type: MessageType.SpeedbarHidden
    });
  };

  selectSuggestion(selectedValue) {
    let selectedIdx = this.defaultSuggestions.findIndex(
      suggestion => suggestion.value === selectedValue
    );
    if (selectedIdx === -1) {
      selectedIdx = this.state.suggestions.findIndex(
        suggestion => suggestion.value === selectedValue
      );
    }
    if (selectedIdx !== -1) {
      this.acceptSuggestion(selectedIdx)
    }
    if (this.input.current) {
      this.input.current.focus();
    }
  };
  navigateSuggestions(direction) {
    let { selectedSuggestionIdx } = this.state;
    if (direction === NavigationDirection.FWD) {
      selectedSuggestionIdx += 1;
    } else {
      selectedSuggestionIdx -= 1;
    }
    this.setState({ selectedSuggestionIdx });
  };

  acceptSuggestion(selectedSuggestionIdx = this.state.selectedSuggestionIdx) {
    const {
      inputText,
      commandState: { commandStatus },
      tokenList
    } = this.state;
    const suggestions = this.getAvailableSuggestions();
    const suggestion = suggestions[selectedSuggestionIdx];
    if (commandStatus === CommandStatus.Empty || commandStatus === CommandStatus.Incomplete) {
      this.acceptCommandprefix(suggestion.speedbarText);
    } else {
      const speedbarText = insertNonBreakingSpaces(suggestion.speedbarText);
      const cursorPosition = this.getCursorPosition();
      const nextInputText = replaceTextAtOffset(inputText, speedbarText + ' ', cursorPosition);
      const token = tokenList.getTokenAtOffset(cursorPosition);
      this.setState(
        {
          inputText: nextInputText,
          searchTokens: {
            ...this.state.searchTokens,
            [token.searchld]: {
              status: 'resolved',
              suggestion: {
                ...suggestion,
                speedbarText
              }
            }
          }
        }, () => {
          this.processInput(nextInputText, InputMethod.AcceptSuggestion);
        }
      );
    }
  };

  acceptCommandprefix(inputText) {
    this.setState(
      {
        inputText
      }, () => {
        this.processInput(inputText, InputMethod.AcceptSuggestion);
      }
    );
  }

  clearToken(tokenOffset) {
    const { inputText, tokenList } = this.state;
    if (tokenList !== EmptyTokenList) {
      const offset = inputText[tokenOffset - 1] === ' ' ? tokenOffset - 1 : tokenOffset;
      const token = tokenList.getTokenAtOffset(offset);
      if (token && token.searchld) {
        const newInputText = removeTokenFromText(inputText, token);
        const { [token.searchld]: _, ...searchTokens } = this.state.searchTokens;
        this.setState(
          {
            searchTokens
          }, () => {
            this.processInput(newInputText);
          }
        );
        if (this.input.current) {
          // TODO should we do this through state/props
          this.input.current.setCursorPosition(token.startOffset);
        }
      }
    }
  };

  async processInput(inputText = '', inputMethod = InputMethod.UserInput) {
    const {
      searchTokens,
      commandState: { commandPrefix: validPrefix }
    } = this.state;
    const fullCommandText = `${validPrefix} ${inputText}`;
    const [commandState, tokenList, command] = parseCommand(
      this.props.commands,
      fullCommandText,
      searchTokens
    );

      console.log(`processInput inputText ${inputText} ${JSON.stringify(commandState)}`)

    if (
      inputMethod === InputMethod.AcceptSuggestion &&
      this.shouldProcessAcceptedCommand(command)
    ) {
      this.setState(
        { inputText: '', command, commandState, suggestions: [], searchTerm: '' },
        () => {
          this.processCommand();
        }
      );
    } else {
      this.setState({
        // we may be inactive if we have just launched a child window, but that window does not take focus
        // and user keeps typing in speedbar
        speedbarStatus: SpeedbarStatus.Active,
        // clear the inputText if we have just parsed a valid command prefix
        inputText: validPrefix === '' && commandState.commandPrefix !== '' ? '' : inputText,
        commandState,
        command,
        tokenList,
        selectedSuggestionIdx: -1,
        errorMessage: ''
      });
      if (command && inputMethod === InputMethod.PasteCommand) {
        this.setCursorPosition(inputText.length);
        const [resolvedTokenString, resolvedSearchTokens] = await resolveSearchTokens(
          command,
          tokenList.toString(),
          this
        );
        this.setState(
          {
            searchTokens: resolvedSearchTokens
          },
          () => {
            this.processInput(resolvedTokenString);
            this.setCursorPosition(resolvedTokenString.length);
          }
        );
      } else if (command && tokenList) {
        // const cursorPosition = this.inputElement.current.selectionStart;
        const cursorPosition = this.getCursorPosition();
        console.log(`[commandWindow] processInput cursor position ${cursorPosition}`)
        const token = tokenList.getTokenAtOffset(cursorPosition);
        if (token && token.searchld && !token.resolved) {
          const searchTerm = token.text.slice(0, cursorPosition - token.startOffset);
          this.invokeSearch(command, token.searchld, searchTerm);
        } else if (this.state.suggestions.length) {
          this.setState({
            searchTerm: '',
            suggestions: [],
            selectedSuggestionIdx: -1
          });
        }
      }
    }
  };

  async invokeSearch(command, searchld, searchTerm) {
    const trimmedSearchTerm = searchTerm.trim();
    // don't resubmit a search if user has simply added a space
    if (trimmedSearchTerm !== this.state.searchTerm) {
      this.currentSearchTerm = trimmedSearchTerm;
      try {
        const searchResult = await this.getSearchResults(
          command,
          searchld,
          searchTerm
        );
        if (searchResult.searchTerm === this.currentSearchTerm) {
          this.setState({
            searchTerm: searchResult.searchTerm,
            suggestions: searchResult.searchResults
          });
        }
      } catch (err) {
        this.setState({
          errorMessage: `A problem was encountered searching for ${searchTerm}`,
          suggestions: []
        });
      }
    }
  }
  getSearchResults = async (command, searchld, searchTerm) => {
    const {
      getSearchSuggestions = null
    } = (await command.getSpeedbarHandler());
    if (getSearchSuggestions !== null) {
      try {
        const searchResult = await getSearchSuggestions(
          searchld,
          searchTerm
        );
        return searchResult;
      } catch (err) {
        throw err;
      }
    } else {
      const errorMessage = 'Problem loading handler for command';
      console.error(errorMessage);
      throw Error(errorMessage);
    }
  };
  /**
  *	Test whether user has accepted a command prefix which should execute immediately,
  *	i.e no further command input admissable.
  *	@param command
  */
  shouldProcessAcceptedCommand(command) {
    return command !== undefined && command.allowCommand === false;
  }
  async processCommand() {
    const {
      searchTokens,
      commandState: { commandPrefix, commandText },
      command
    } = this.state;
    const commandValue = replaceCommandTextWithValues(commandText, searchTokens);
    if (command && command.getSpeedbarHandler) {
      const { processInput } = (await command.getSpeedbarHandler());
      const commandState = {
        ...this.state.commandState,
        errorMessage: '',
        commandStatus: CommandStatus.Executing
      };
      this.setState({
        commandState
      });
      try {
        await processInput(commandPrefix, commandValue, searchTokens);
        this.setState({
          commandState: {
            ...this.state.commandState,
            commandStatus: CommandStatus.Succeeded
          }
        });
        setTimeout(() => {
          this.clearState(true);
        }, 100);
      } catch (err) {
        const errorMessage = err.toString();
        this.setState({
          errorMessage,
          commandState: {
            ...this.state.commandState,
            commandStatus: CommandStatus.Failed
          }
        });
        console.error(errorMessage);
      }
    } else {
      console.error(`No feature available to handle command ${commandPrefix} ${commandText}`)
    }
  };

  getAvailableSuggestions() {
    const { commandState, suggestions } = this.state;
    return commandState.commandStatus === CommandStatus.Empty
      ? this.defaultSuggestions
      : commandState.commandStatus === CommandStatus.Incomplete
        ? this.defaultSuggestions.filter(matchCommandPrefix(commandState.partialPrefix))
        : suggestions;
  }

  getCursorPosition() {
    if (this.input.current) {
      return this.input.current.getCursorPosition();
    } else {
      return this.state.inputText.length;
    }
  }

  setCursorPosition(offset) {
    if (this.input.current) {
      return this.input.current.setCursorPosition(offset);
    }
  }

  render() {
    const {
      inputText,
      speedbarStatus,
      errorMessage,
      commandState,
      searchTerm,
      suggestions,
      command,
      selectedSuggestionIdx,
      tokenList
    } = this.state;
    const availableSuggestions = this.getAvailableSuggestions();
    const showSuggestions =
      speedbarStatus !== SpeedbarStatus.Inactive &&
      commandState.commandStatus !== CommandStatus.Executing &&
      commandState.commandStatus !== CommandStatus.Succeeded;
    const commandTokens = command && command.commandTokens ? command.commandTokens : [];
    return (
      <div className={styles.speedbarWindow} ref={this.rootEl}>
        <CommandInput
          inputText={inputText}
          commandState={commandState}
          tokenList={tokenList}
          searchTerm={searchTerm}
          suggestions={availableSuggestions}
          selectedSuggestionIdx={selectedSuggestionIdx}
          commands={this.props.commands}
          currentCommand={command}
          errorMessage={errorMessage}
          ref={this.input}
          onShouldClose={this.close}
          onChange={this.processInput}
          onNavigateSuggestions={this.navigateSuggestions}
          onAcceptSuggestion={this.acceptSuggestion}
          onSubmit={this.processCommand}
          onClearToken={this.clearToken}
          onClear={this.clearState}
          onFocus={this.handleFocus}
          onClick={this.handleClick}
        />
        {showSuggestions && (
          <CommandSuggestions
            errorMessage={errorMessage}
            commandState={commandState}
            tokenDescriptors={commandTokens}
            defaultSuggestions={availableSuggestions}
            searchTerm={searchTerm || commandState.partialPrefix}
            suggestions={suggestions}
            selectedSuggestionIdx={selectedSuggestionIdx}
            onSelectSuggestion={this.selectSuggestion}
          />
        )}
      </div>
    );
  }
}