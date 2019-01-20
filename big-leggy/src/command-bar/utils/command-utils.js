import { buildRegexFromSearchTerm, NB_SPACE, NORMAL_SPACE } from '../../token-search/token-search';
import TokenList from '../parsing/token-list';

const PATTERN_SPACE = new RegExp(`${NORMAL_SPACE}+`);
const TOKEN_SPACE_ALL = new RegExp(`${NB_SPACE}+`, 'g');

export const CommandStatus = {
  Empty: 'empty',
  Incomplete: 'incomplete',
  Invalid: 'invalid',
  PrefixValid: 'prefix-valid',
  CommandComplete: 'command-complete',
  Executing: 'executing',
  Succeeded: 'succeeded',
  Failed: 'failed'
}

export const EmptyCommandState = {
  commandStatus: CommandStatus.Empty,
  commandPrefix: '',
  commandText: '',
  commandTermCount: 0,
  message: '',
  partialPrefix: ''
}

const partialMatch = (matchTerm) => {
  const pattern = new RegExp(`^${matchTerm}`, 'i');
  return (text) => pattern.test(text);
};
export const prefixesToRegexp = (prefixes) =>
  // the --NOMATCH-- entry will ensure there is no match if prefixes is empty
  new RegExp(`^(${['--NOMATCH--'].concat(prefixes).join('|')})(?:\\W+(.*))?`, 'i');

export const parseCommand = (
  commands,
  inputText,
  searchTokens = {}
) => {
  const [commandState, command] = parsePrefixAndMapToCommand(commands, inputText.trimLeft())

  const tokenList = new TokenList(command, commandState.commandText, searchTokens);
  const [commandTermCount, commandTermIdx] = getTermCountAndIdx(tokenList.toString())

  return [
    {
      ...commandState,
      commandStatus: tokenList.commandComplete
        ? CommandStatus.CommandComplete
        : commandState.commandStatus,
      commandText: tokenList.toString(),
      commandTermCount,
      commandTermIdx
    },
    tokenList,
    command
  ];
}

function parsePrefixAndMapToCommand(
  commands,
  inputText
) {
  let commandStatus = CommandStatus.Empty;
  let command;
  let commandPrefix = '';
  let partialPrefix = '';
  let commandText = '';
  let message = '';

  if (inputText !== '') {
    const prefixes = buildPrefixList(commands);
    const pattern = prefixesToRegexp(prefixes);
    const match = pattern.exec(inputText);

    if (match) {
      commandStatus = CommandStatus.PrefixValid;
      [, commandPrefix, commandText = ''] = match;
    } else if (prefixes.some(partialMatch(inputText))) {
      commandStatus = CommandStatus.Incomplete;
      partialPrefix = inputText;
    } else {
      commandStatus = CommandStatus.Invalid;
      message = 'No match found';
    }

    if (commandStatus === CommandStatus.PrefixValid) {
      const cmdPrefix = commandPrefix.toUpperCase();
      command = commands.find(cmd => cmd.prefix.toUpperCase() === cmdPrefix);
    } else {
      commandPrefix = '';
    }
  }

  return [
    {
      commandStatus,
      commandPrefix,
      partialPrefix,
      commandText,
      message
    },
    command
  ];
}

const getTermCountAndIdx = commandText => {
  const commandTermCount = countTokens(commandText);
  const commandTermIdx =
    commandText.trim() === ''
      ? 0
      : commandText[commandText.length - 1] === ' '
        ? commandTermCount
        : commandTermCount - 1;
  return [commandTermCount, commandTermIdx];
}

export const buildPrefixList = (commands) => {
  const set = commands.reduce((list, command) => {
    const cmdPrefix = command.prefix.toUpperCase();
    if (list.has(cmdPrefix)) {
      console.error(`Command prefixes must be unique. The prefix ’${command.prefix}' has been defined more than once`);
    } else {
      list.add(cmdPrefix);
    }
    return list;
  }, new Set());

  return Array.from(set);
}

export function replaceTextAtOffset(
  text,
  replacementText,
  offset = text.length
) {
  const term = getWordAtOffset(text, offset);
  const start = offset - term.length;
  return (
    text.slice(0, start) +
    replacementText +
    // this fixes an issue with mid-text token replacement but is not a long-term fix
    // it will break multi-term tokens that happen to follow the replaced token. Needs to take
    // the searchTokens into account
    text.slice(offset).replace(TOKEN_SPACE_ALL, NORMAL_SPACE)
  );
}
export function removeTokenFromText(inputText, token) {
  const { startOffset, text } = token;
  const tail = inputText.slice(startOffset + text.length);
  if (startOffset === 0) {
    return tail;
  } else {
    return inputText.slice(0, startOffset) + tail;
  }
}
function countTokens(text = '') {
  const trimmedText = text.trim();
  return trimmedText === '' ? 0 : trimmedText.split(PATTERN_SPACE).length;
}
export function getWordAtOffset(text, cursor) {
  const startPos = findLastSpace(text, cursor);
  const term = text.slice(startPos + 1, cursor);
  return term;
}
function findLastSpace(text, start = text.length) {
  for (let i = start - 1; i >= 0; i--) {
    if (PATTERN_SPACE.test(text[i])) {
      return i;
    }
  }
  return -1;
}

export function buildDefaultSuggestions(commands) {
  return commands.map(command => {
    const { prefix, commandType, description, icon } = command;
    return {
      value: prefix,
      speedbarText: prefix,
      suggestionText: description || prefix,
      icon,
      className: `speedbar-${commandType}`
    };
  });
}
export function getCommandWithPrefix(
  commands,
  commandPrefix
) {
  return commands.find(command => command.prefix === commandPrefix);
}
export function matchCommandPrefix(prefix) {
  const pattern = buildRegexFromSearchTerm(prefix);
  return (suggestion) => {
    const { value } = suggestion;
    pattern.lastIndex = 0;
    return pattern.test(value);
  };
}
/**
*	Searchable tokens allow/ for a display value that appears in the speedbar and a different underlying value that
*	gets included in the submitted command (typically a uniqueld rathar than a display-friendly name). Make the
*	substitutions here, in preparation for submitting the command.
*	@param commandText text from the speedbar input
*	@param searchTokens entities to v/hich the search tokens have been resolved
*/
export const replaceCommandTextWithValues = (
  commandText,
  searchTokens = {}
) => {
  const suggestions = Object.values(searchTokens);
  if (suggestions.length) {
    suggestions.forEach(({suggestion}) => {
      const { speedbarText, value } = suggestion;
      if(commandText.indexOf(speedbarText) !== -1) {
      commandText = commandText.replace(speedbarText, value);
    }
  });
}
return commandText;
};