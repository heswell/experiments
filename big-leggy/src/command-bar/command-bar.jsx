import * as React from 'react';
import {
  CommandStatus,
  EmptyCommandState,
  parseCommand,
  matchCommandPrefix,
  buildDefaultSuggestions,
  replaceTokenWithinText,
  replaceCommandTextWithValues,
  replaceTextAtOffset
} from './utils/command-utils';

import { SEARCHID_OPTIONAL_TOKENS, getSuggestionsForOptionalTokens } from './suggestions/search/search-utils';

import { insertNonBreakingSpaces, resolveSearchTokens } from '../token-search/token-search';
import CommandInput, { NavigationDirection, InputMethod } from './input/command-input';
import CommandSuggestions from './suggestions';
import { EmptyTokenList, TokenType } from './parsing/token-list';
import { hideSpeedbarSuggestionsWindow } from './window-utils';

import './command-bar.css';

export const SpeedbarStatus = {
  Inactive: 'inactive',
  Active: 'active'
}

const styles = {
  commandBar: 'command-bar'
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
    this.width = 0;
    this.defaultSuggestions = buildDefaultSuggestions(props.commands);
    this.currentSearchTerm = '';
    this.rootEl = React.createRef();
    this.input = React.createRef();

    this.handleFocus = this.handleFocus.bind(this);
    this.handleInputClick = this.handleInputClick.bind(this);
    this.processInput = this.processInput.bind(this);
    this.processCommand = this.processCommand.bind(this);
    this.navigateSuggestions = this.navigateSuggestions.bind(this);
    this.acceptSuggestion = this.acceptSuggestion.bind(this);
    this.selectSuggestion = this.selectSuggestion.bind(this);
    this.clearState = this.clearState.bind(this);
    this.clearSearchToken = this.clearSearchToken.bind(this);
    this.revisitSearchToken = this.revisitSearchToken.bind(this);
  }

  clearState(setInactive = false) {
    this.setState({
      ...EMPTY_STATE,
      speedbarStatus: setInactive ? SpeedbarStatus.Inactive : SpeedbarStatus.Active
    });
  };

  handleFocus() {
    this.activate();
  }

  handleInputClick(tokenIdx = -1) {
    if (this.state.speedbarStatus === SpeedbarStatus.Inactive) {
      this.activate();
    } else if (tokenIdx !== -1) {
      const token = this.state.tokenList.tokens[tokenIdx];
      if (token.searchId && token.multipleResults) {
        const resolvedSearchResults = this.state.searchTokens[token.searchId];
        console.log('resolve multiple results for ${token.text)', resolvedSearchResults)
        // 1) populate the suggestions
        // 2) position cursor at end of search terms
        this.setState({
          searchTerm: resolvedSearchResults.searchTerm,
          suggestions: resolvedSearchResults.matchingSuggestions
        }, () => {
          this.setCursorPosition(token.startOffset + token.text.length);
        })
      }
    }
  };

  activate() {
    this.setState({ speedbarStatus: SpeedbarStatus.Active });
  }
  componentDidMount() {
    if (this.input.current) {
      this.input.current.focus();
    }
  }

  close() {
    hideSpeedbarSuggestionsWindow();
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
      commandState: { commandStatus, commandTermIdx },
      tokenList
    } = this.state;

    const suggestion = this.getSuggestion(selectedSuggestionIdx);
    if (commandStatus === CommandStatus.Empty || commandStatus === CommandStatus.Incomplete) {
      this.acceptCommandprefix(suggestion.speedbarText);
    } else {
      const speedbarText = insertNonBreakingSpaces(suggestion.speedbarText);
      const offset = this.getInsertionPositionForSearchResult();
      const nextInputText = replaceTextAtOffset(inputText, speedbarText + ' ', offset);
      const cursorPosition = this.getCursorPosition();
      let token = tokenList.getTokenAtOffset(cursorPosition);
      if (!token || token.type === TokenType.WhiteSpace) {
        token = tokenList.descriptors[commandTermIdx]
      }

      //No token here means we're accepting an option token value, we don’t need to record these
      const searchTokens = token
        ? {
          ...this.state.searchTokens,
          [token.searchId]: {
            status: 'resolved',
            suggestion: {
              ...suggestion,
              speedbarText
            }
          }
        }
        : this.state.searchTokens

      this.setState(
        {
          searchTerm: '',
          inputText: nextInputText,
          selectedSuggestionIdx: -1,
          suggestions: [],
          searchTokens
        }, () => {
          this.processInput(nextInputText, InputMethod.AcceptSuggestion);
          this.setCursorPosition(nextInputText.length);
        }
      );
    }
  };

  getInsertionPositionForSearchResult() {
    const cursorPosition = this.getCursorPosition();
    const { tokenList } = this.state;
    let token = tokenList.getTextTokenBeforeOffset(cursorPosition);
    // changes here
    if (token && token.text.replace(/\s/g, ' ') === this.state.searchTerm) {
      return token.startOffset;
    } else {
      return cursorPosition;
    }
  }

  acceptCommandprefix(inputText) {
    this.setState(
      {
        inputText,
        selectedSuggestionIdx: -1
      }, () => {
        this.processInput(inputText, InputMethod.AcceptSuggestion);
      }
    );
  }

  /**
  * User has edited a previously resolved search token. Remove the resolved status so search can again be triggered.
  */
  revisitSearchToken(tokenOffset) {
    const { inputText, tokenList } = this.state;
    const offset = inputText[tokenOffset - 1] === ' ' ? tokenOffset - 1 : tokenOffset;
    const token = tokenList.getTokenAtOffset(offset);
    if (token && token.searchId) {
      const { [token.searchId]: _, ...searchTokens } = this.state.searchTokens;
      this.setState(
        {
          searchTokens
        }
      );
    }
  }

  /** User has user CTRL+Backspace to remove a word and is positioned i=on a resolved search token.
  •* Clear the entire token,-which may incluse embedded spaces.
  */
  clearSearchToken(tokenOffset) {
    console.log(`clear search token at ${tokenOffset}`)
    const { inputText, tokenList } = this.state;
    if (tokenList !== EmptyTokenList) {
      const offset = inputText[tokenOffset - 1] === ' ' ? tokenOffset - 1 : tokenOffset;
      const token = tokenList.getTokenAtOffset(offset);
      if (token && token.searchId) {
        // the additional whitespace that we insert in place of the token we want
        // to remove will be removed by the backspace
        const newInputText = replaceTokenWithinText(inputText, token, '');
        console.log(`[clearSearchToken newInputText '${newInputText}'`)
        const { [token.searchId]: _, ...searchTokens } = this.state.searchTokens;
        this.setState(
          {
            searchTokens
          }, () => {
            console.log(`[clearSearchToken state callback newInputText '${newInputText}'`)
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

  processInput(inputText = '', inputMethod = InputMethod.UserInput) {
    const {
      searchTokens,
      commandState: { commandPrefix },
      selectedSuggestionIdx
    } = this.state;

    let validPrefix = commandPrefix

    if (selectedSuggestionIdx !== -1 && !validPrefix) {
      // If user has navigated to a command and just starts typing without ENTER first, assume
      // command is selected ...
      ({ speedbarText: validPrefix } = this.getSuggestion(selectedSuggestionIdx));
    }

    const fullCommandText = `${validPrefix} ${inputText}`;
    const [commandState, tokenList, command] = parseCommand(
      this.props.commands,
      fullCommandText,
      searchTokens
    );

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
      }, () => {
        if (inputMethod === InputMethod.PasteCommand) {
          this.postInputPasteHandling(inputText);
        } else {
          this.postInputSearchHandling(inputText);
        }
      });
    }
  };

  /**
  *	Following user paste operation, we need to identify search tokens within
  *	the pasted text and attempt to resolve those tokens to search results.
  */
  async postInputPasteHandling(inputText) {
    const { command, tokenList } = this.state;
    if (command) {
      this.setCursorPosition(inputText.length);
      const [resolvedTokenString, resolvedSearchTokens] = await resolveSearchTokens(
        command,
        tokenList.toString(),
        this
      );

      // Add a space to end of pasted text so final token will be treated as 'complete'
      const newInputText = resolvedTokenString.endsWith('	')
        ? resolvedTokenString
        : resolvedTokenString + '	';
      this.setState(
        {
          searchTokens: resolvedSearchTokens
        },
        () => {
          // if the resolvedTokenSTring is different from the inputText ?
          this.processInput(newInputText);
          this.setCursorPosition(newInputText.length);
        }
      );
    }
  }

  postInputSearchHandling(inputText) {
    console.log(`postInputSearchHandling '${inputText}'`)
    const { command, commandState, tokenList } = this.state;
    if (command && tokenList) {
      if (this.canSearch(tokenList, commandState)) {
        const [searchId, searchTerm] = this.getSearchTerm(inputText, tokenList, commandState)
        this.invokeSearch(command, searchId, searchTerm);
      } else if (this.canEnterOptionalToken(tokenList)) {
        const searchTerm = this.getOptionalTokenSearchTerm(tokenList)
        this.invokeSearch(command, 'optional-tokens', searchTerm);
      } else if (this.state.suggestions.length) {
        this.setState({
          searchTerm: '',
          suggestions: [],
          selectedSuggestionIdx: -1
        });
      }
    }
  }

  canEnterOptionalToken(tokenList) {
    return tokenList.beyondRequiredTokens &&
      tokenList.hasOptionalTokens &&
      tokenList.unusedOptionalDescriptors.length > 0;
  }

  canSearch(tokenList, commandState) {
    const cursorPosition = this.getCursorPosition();
    const token = tokenList.getTokenAtOffset(cursorPosition);
    if (token && token.searchId && !token.searchResolved) {
      // user has already started typing search term(s) for this search token
      return true;
    } else {
      const { commandTermIdx } = commandState;
      const { descriptors } = tokenList;
      const tokenDescriptor = descriptors[commandTermIdx];
      // console.log('tokenDescriptor at offset ${JSON.stringify(tokenDescriptor)}')
      if (tokenDescriptor && tokenDescriptor.searchId) {
        // next expected token is a search token, but user hasn’t started typing search term(s) yet
        // console.log('===> seems like we can do an empty search for ${tokenDescriptor.searchId}')
        return true;
      } else {
        return false;
      }
    }
  }

  invalidateSearchTerm(searchTerm) {
    const tokenList = this.state.tokenList.invalidateToken(searchTerm);
    this.setState({
      tokenList
    })
  }

  getOptionalTokenSearchTerm(tokenList) {
    const cursorPosition = this.getCursorPosition();
    const token = tokenList.getTokenAtOffset(cursorPosition);
    const result = token && token.type === TokenType.Text
      ? token.text
      : '';
    return result;
  }

  getSearchTerm(inputText, tokenList, commandState) {
    const cursorPosition = this.getCursorPosition();
    const token = tokenList.getTokenAtOffset(cursorPosition);

    if (token && token.searchId && !token.searchResolved) {
      // leave trailing space after search term is thta is what yuser has typed.-It may
      // be significant for search service
      const searchTerm = inputText.slice(token.startOffset, cursorPosition + 1);
      return [token.searchId, searchTerm];
    } else {
      const { commandTermIdx } = commandState;
      const { descriptors } = tokenList;
      const tokenDescriptor = descriptors[commandTermIdx];
      if (tokenDescriptor && tokenDescriptor.searchId) {
        return [tokenDescriptor.searchId, '']
      }
    }
    return []
  }

  async invokeSearch(command, searchId, searchTerm) {
    console.log(`[invokeSearch] '${searchTerm}'`)
    if (searchTerm === '' || searchTerm !== this.state.searchTerm) {
      this.currentSearchTerm = searchTerm;
      try {
        const searchResult = await this.getSearchResults(
          command,
          searchId,
          searchTerm
        );

        if (searchResult.searchTerm === this.currentSearchTerm) {
          this.setState({
            selectedSuggestionIdx: searchTerm.trim() === '' ? -1 : 0,
            searchTerm: searchResult.searchTerm,
            suggestions: searchResult.searchResults
          }, () => {
            if (searchTerm && searchResult.searchResults.length === 0) {
              this.invalidateSearchTerm(searchTerm);
            } else if (searchTerm[searchTerm.length - 1] === ' ' && searchResult.searchResults.length === 1) {
              console.log(`shall we auto accept here ??? ${searchResult.searchResults[0].speedbarText}`)
              this.acceptSuggestion(0);
            }
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

  getSearchResults = async (command, searchId, searchTerm) => {
    let getSearchSuggestions;

    if (searchId === SEARCHID_OPTIONAL_TOKENS) {
      getSearchSuggestions = getSuggestionsForOptionalTokens(this.state.tokenList)
    } else {
      ({
        getSearchSuggestions = null
      } = (await command.getSpeedbarHandler()));
    }

    if (getSearchSuggestions !== null) {
      try {
        const searchResult = await getSearchSuggestions(
          searchId,
          searchTerm
        );
        return searchResult;
      } catch (err) {
        // any point ?
        throw err;
      }
    } else {
      const errorMessage = 'Problem loading handler for command';
      console.error(errorMessage);
      throw Error(errorMessage);
    }
  }

  /**
  *	Test whether user has accepted a command prefix which should execute immediately,
  *	i.e no further command input admissable.
  *	@param command
  */
  shouldProcessAcceptedCommand(command) {
    return command !== undefined && command.allowCommand === false;
  }

  getIndicesOfTokensToHighlight(tokenList) {
    const { tokens } = tokenList;
    return tokens.filter(token =>
      typeof token.multipleResults === 'number' &&
      token.multipleResults > 1)
      .map(token => token.idx)
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

  getSuggestion(idx) {
    const suggestions = this.getAvailableSuggestions();
    if (suggestions.length > 0 && suggestions[idx]) {
      return suggestions[idx];
    }
  }

  getAvailableSuggestions() {
    const { commandState, suggestions } = this.state;
    return commandState.commandStatus === CommandStatus.Empty
      ? this.defaultSuggestions
      : commandState.commandStatus === CommandStatus.Incomplete
        ? this.defaultSuggestions.filter(matchCommandPrefix(commandState.partialPrefix))
        : suggestions;
  }

  getUnresolvedSearchTokens(){
    const {searchTokens} = this.state;
    return Object.values(searchTokens).filter(token => token.matchingSuggestions && token.matchingSuggestions.length > 0);
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
    const highlightTokensOnHover = this.getIndicesOfTokensToHighlight(tokenList);
    const unresolvedSearchResults = this.getUnresolvedSearchTokens();

    const showSuggestions =
      speedbarStatus !== SpeedbarStatus.Inactive &&
      commandState.commandStatus !== CommandStatus.Executing &&
      commandState.commandStatus !== CommandStatus.Succeeded;

    const commandTokens = command && command.commandTokens ? command.commandTokens : [];

    return (
      <div className={styles.commandBar} ref={this.rootEl}>
        <CommandInput
          ref={this.input}
          inputText={inputText}
          commandState={commandState}
          tokenList={tokenList}
          searchTerm={searchTerm}
          suggestions={availableSuggestions}
          selectedSuggestionIdx={selectedSuggestionIdx}
          commands={this.props.commands}
          currentCommand={command}
          errorMessage={errorMessage}
          highlightTokensOnHover={highlightTokensOnHover}
          onShouldClose={this.close}
          onChange={this.processInput}
          onNavigateSuggestions={this.navigateSuggestions}
          onAcceptSuggestion={this.acceptSuggestion}
          onSubmit={this.processCommand}
          onClear={this.clearState}
          onClearSearchToken={this.clearSearchToken}
          onRevisitSearchToken={this.revisitSearchToken}
          onFocus={this.handleFocus}
          onClick={this.handleClick}
        />
        {showSuggestions && (
          <CommandSuggestions
            errorMessage={errorMessage}
            commandState={commandState}
            tokenDescriptors={commandTokens}
            defaultSuggestions={availableSuggestions}
            unresolvedSearchResults={unresolvedSearchResults}
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