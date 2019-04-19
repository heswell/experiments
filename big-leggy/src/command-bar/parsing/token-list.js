import { NORMAL_SPACE, NB_SPACE, PATTERN_SPACE_ALL } from '../../token-search/token-search';

// redfined here, when exported from utils - lest does not import them correctly
const PATTERN_SPACE = new RegExp(`${NORMAL_SPACE}+`);

export const TokenType = {
  WhiteSpace: 'whitespace',
  Text: 'text'
}

const UNKNOWN_TOKEN_DESCRIPTOR = {
  type: TokenType.Text,
  searchId: undefined,
  name: undefined,
  required: false
};

const split = (arr, cond) => {
  const match = []
  const notMatch = []
  arr.forEach(item => {
    if (cond(item)) {
      match.push(item)
    } else {
      notMatch.push(item)
    }
  })
  return [match, notMatch]
}

export default class TokenList {

  constructor(command, inputText, searchTokens = {}) {
    const tokens = command && command.commandTokens ? command.commandTokens : [];
    const [requiredTokens, optionalTokens] = split(tokens, token => token.required !== false)
    this._requiredDescriptors = requiredTokens;
    this._optionalDescriptors = optionalTokens;
    this._searchTokens = searchTokens;
    this._tokens = [];
    this.commandComplete = false;
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
    return this._requiredDescriptors;
  }

  get hasOptionalTokens() {
    return this._optionalDescriptors && this._optionalDescriptors.length > 0
  }

  get unusedOptionalDescriptors() {
    return this.hasOptionalTokens
      ? this._optionalDescriptors.filter(descriptor => descriptor.available !== false)
      : undefined;
  }

  get lastToken() {
    if (this.tokens && this.tokens.length > 0) {
      return this._tokens[this._tokens.length - 1];
    } else {
      return undefined;
    }
  }

  get beyondRequiredTokens() {
    if (this.commandComplete) {
      const token = this.lastToken;
      return token.type === TokenType.WhiteSpace || token.required === false;
    }
    return false;
  }

  shouldApplyValidation(){
    return this._requiredDescriptors.length > 0 || this._optionalDescriptors.length > 0;
  }

  /**
    * this will return a new tokenList
    */
  invalidateToken(tokenText) {
    const { _requiredDescriptors, _optionalDescriptors, _searchTokens, _tokens, commandComplete } = this;
    const tokenList = new TokenList();
    tokenList._requiredDescriptors = _requiredDescriptors;
    tokenList._optionalDescriptors = _optionalDescriptors;
    tokenList._searchTokens = _searchTokens;
    tokenList.commandComplete = commandComplete;
    tokenList._tokens = _tokens.map(token => {
      if (token.text === tokenText) {
        return {
          ...token,
          invalid: true
        }
      } else {
        return token;
      }
    });
    return tokenList;
  }

  markOptionalTokenDescriptorUsed(tokenDescriptor) {
    this._optionalDescriptors = this._optionalDescriptors.map(td =>
      td === tokenDescriptor
        ? { ...tokenDescriptor, available: false }
        : td
    )
  }

  /**
*	get the text token at offset. If we find token at offset is a whitespace token,
*	get the preceeding text token.
*/
  getTextTokenBeforeOffset(offset) {
    const token = this.getTokenAtOffset(offset);
    if (token && token.type === TokenType.WhiteSpace) {
      return this.getTextTokenBeforeOffset(offset - 1);
    } else {
      // this will be either the required token or undefined if we have no text token at this offset
      return token;
    }
  }

  getNextTokenIndexAtOffset(offset) {

    if (offset === 0 && this._tokens.length === 0) {
      return -1;
    } else {
      let token = this.getTokenAtOffset(offset);
      if (token && token.type === 'text') {
        return token.idx;
      } else if (token && token.type === 'whitespace') {
        const idx = this._tokens.indexOf(token);
        if (idx === 0) {
          return 0;
        } else {
          const prevToken = this._tokens[idx - 1];
          return prevToken.idx + 1;
        }
      }
    }
  }

  getIndexOfTokenAtOffset(offset){
    return this._tokens.findIndex(
      ({ startOffset, text }) => offset >= startOffset && offset <= startOffset + text.length
    )

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
    let wsIdx = 0;
    const requiredDescriptors = this._requiredDescriptors;

    for (let i = 0; i < text.length; i++) {
      character = text[i];
      tokenStart = i;

      if (delimiter.test(character)) {
        while (i < len && delimiter.test(text[i + 1])) {
          i++;
        }
        const t = text.substring(tokenStart, i + 1);
        results.push({ type: TokenType.WhiteSpace, startOffset, text: t, wsIdx });
        startOffset += t.length;
        wsIdx += 1;
      } else {
        const tokenDescriptor = requiredDescriptors[tokenIdx] || UNKNOWN_TOKEN_DESCRIPTOR;
        const { searchId } = tokenDescriptor;
        while (i < len && !this.isTokenDelimiterNext(text, i, delimiter, searchId)) {
          i++;
        }
        let t = text.substring(tokenStart, i + 1);
        if (searchId) {
          // this is for multi-term search tokens, which have not yet been resolved
          // will be a no-op for already resolved search tokens
          t = t.replace(PATTERN_SPACE_ALL, NB_SPACE);
        }
        const isFinalToken = startOffset + t.length === len;
        results.push(this.createToken(startOffset, t, tokenDescriptor, tokenIdx, isFinalToken));
        startOffset += t.length;
        tokenIdx += 1;
      }
    }

    const requiredCount = requiredDescriptors.length;
    this.commandComplete = requiredCount > 0 && tokenIdx >= requiredCount;

    return results;

  }

  createToken(startOffset, text, tokenDescriptor, idx, isFinalToken) {
    const { searchId = '', required } = tokenDescriptor;
    const {_searchTokens} = this;
    const applyValidation = this.shouldApplyValidation();

    return {
      name: tokenDescriptor.name,
      idx,
      type: TokenType.Text,
      startOffset,
      text,
      searchId: tokenDescriptor.searchId,
      resolved: searchId === ''
        ? undefined
        : searchId in _searchTokens,
        multipleResults: searchTokenResolvedMultipleResults(_searchTokens,searchId),
      invalid: applyValidation && !this.isTokenTextValid(text, tokenDescriptor, isFinalToken),
      required
    };
  }
  // Is the next character a token delimiter (space). Handles special case where
  // we encounter multiple search terms for a searchable token which has not yet
  // been resolved.
  isTokenDelimiterNext(text, currentPos, delimiter, searchId = '') {
    const character = text[currentPos + 1];
    const matchesDelimiter = delimiter.test(character);
    if (matchesDelimiter && searchId && !(searchId in this._searchTokens)) {
      return false;
    }
    return matchesDelimiter;
  }

  isTokenTextValid = (text, tokenDescriptor, isFinalToken) => {
    if (tokenDescriptor === UNKNOWN_TOKEN_DESCRIPTOR) {
      // Not one of our ’required' tokenDescriptors ...
      if (this._optionalDescriptors.length > 0) {
        const optionalTokens = this.unusedOptionalDescriptors;
        const matchingToken = optionalTokens.find(token => token.pattern.test(text));
        if (matchingToken && !isFinalToken) {
          // Only mark an optional token as unavailable once user has at least typed a further space
          this.markOptionalTokenDescriptorUsed(matchingToken);
          return true;
        } else {
          return false;
        }
      }
      return false;
    } else if (tokenDescriptor.pattern) {
      return tokenDescriptor.pattern.test(text);
    } else {
      return true;
    }
  }

}

const searchTokenResolvedMultipleResults = (_searchTokens, searchId) => {
  const searchToken = _searchTokens[searchId];
  return searchToken && searchToken.matchingSuggestions && searchToken.matchingSuggestions.length;
}

export const EmptyTokenList = new TokenList();