import { NORMAL_SPACE, NB_SPACE, PATTERN_SPACE_ALL } from '../token-search/token-search';

// redfined here, when exported from utils - lest does not import them correctly
const PATTERN_SPACE = new RegExp(`${NORMAL_SPACE}+`);
const NULL_TOKEN_DESCRIPTOR = {
  searchld: undefined,
  name: undefined
};
export const TokenType = {
  WhiteSpace: 'whitespace',
  Text: 'text'
}


export default class TokenList {

  constructor(command, inputText, searchTokens = {}) {
    this._descriptors = command && command.commandTokens ? command.commandTokens : [];
    this._searchTokens = searchTokens;
    this._tokens = [];
    this.text = inputText || '';
  }
  set text(value) {
    this._tokens = this.parseText(value);
  }
  get tokens() {
    return this._tokens;
  }
  get searchTokens() {
    return this._searchTokens;
  }
  get descriptors() {
    return this._descriptors;
  }

  getTokenAtOffset(offset) {
    return this._tokens.find(
      ({ startOffset, text }) => offset >= startOffset && offset <= startOffset + text.length
    );
  }
  toString() {
    return this._tokens.map(t => t.text).join('');
  }
  /**
  *	split text string into array of whitespace/non-whitespace sections. Multi
  *	word tokens e.g. client names are delimited with special space characters
  *	so thye can be represented as a single token.
  */
  parseText(text, delimiter = PATTERN_SPACE) {
    const results = [];
    let character;
    let tokenStart;
    const len = text.length;
    let startOffset = 0;
    let tokenIdx = 0;
    for (let i = 0; i < text.length; i++) {
      character = text[i];
      tokenStart = i;
      if (delimiter.test(character)) {
        while (i < len && delimiter.test(text[i + 1])) {
          i++;
        }
        const t = text.substring(tokenStart, i + 1);
        results.push({ type: TokenType.WhiteSpace, startOffset, text: t });
        startOffset += t.length;
      } else {
        const tokenDescriptor = this._descriptors[tokenIdx] || NULL_TOKEN_DESCRIPTOR;
        while (i < len && !this.isTokenDelimiterNext(text, i, delimiter, tokenDescriptor)) {
          i++;
        }
        const { searchld } = tokenDescriptor;
        let t = text.substring(tokenStart, i + 1);
        if (searchld) {
          // this is for multi-term search tokens, which have not yet been resolved
          // will be a no-op for already resolved search tokens
          t = t.replace(PATTERN_SPACE_ALL, NB_SPACE);
        }
        results.push(this.createToken(startOffset, t, tokenDescriptor));
        startOffset += t.length;
        tokenIdx += 1;
      }
    }
    return results;
  }

  createToken(startOffset, text, tokenDescriptor) {
    const { searchld: searchId = '' } = tokenDescriptor;
    const resolved = searchId in this._searchTokens ? true : undefined;
    const invalid = tokenDescriptor.pattern
      ? tokenDescriptor.pattern.test(text) === false
      : undefined;
    return {
      type: TokenType.Text,
      startOffset,
      text,
      searchld: tokenDescriptor.searchld,
      resolved,
      invalid
    };
  }
  // Is the next character a token delimiter (space). Handles special case where
  // we encounter multiple search terms for a searchable token which has not yet
  // been resolved.
  isTokenDelimiterNext(text, currentPos, delimiter, { searchId = '' }) {
    const character = text[currentPos + 1];
    const matchesDelimiter = delimiter.test(character);
    if (matchesDelimiter && searchId && !(searchId in this._searchTokens)) {
      return false;
    }
    return matchesDelimiter;
  }
}

export const EmptyTokenList = new TokenList();