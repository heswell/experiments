import { NORMAL_SPACE, NB_SPACE, PATTERN_SPACE_ALL } from '../../token-search/token-search';

// redfined here, when exported from utils - lest does not import them correctly
const PATTERN_SPACE = new RegExp(`${NORMAL_SPACE}+`);

const UNKNOWN_TOKEN_DESCRIPTOR = {
  searchId: undefined,
  name: undefined
};
export const TokenType = {
  WhiteSpace: 'whitespace',
  Text: 'text'
}

const split = (arr, cond) => {
  const match = []
  const notMatch = []
  arr.forEach(item => {
    if (cond(item)){
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
    this.commandComplete= false;
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

  get unusedOptionalDescriptors() {
    return this._optionalDescriptors.filter(descriptor => descriptor.available !== false);
  }

  markOptionalTokenDescriptorUsed(tokenDescriptor){
    this._optionalDescriptors = this._optionalDescriptors.map(td => 
      td === tokenDescriptor
        ? {...tokenDescriptor, available: false}
        : td  
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
    const requiredDescriptors = this._requiredDescriptors;

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
        results.push(this.createToken(startOffset, t, tokenDescriptor, tokenIdx));
        startOffset += t.length;
        tokenIdx += 1;
      }
    }

    const requiredCount = requiredDescriptors.length;
    this.commandComplete = requiredCount > 0 && tokenIdx >= requiredCount;
    
    return results;
  
  }

  createToken(startOffset, text, tokenDescriptor, idx) {
    const { searchId = '' } = tokenDescriptor;
    return {
      name: tokenDescriptor.name,
      idx,
      type: TokenType.Text,
      startOffset,
      text,
      searchId: tokenDescriptor.searchId,
      resolved: searchId === ''
        ? undefined
        : searchId in this._searchTokens,
      invalid: !this.isTokenTextValid(text, tokenDescriptor)
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

  isTokenTextValid = (text, tokenDescriptor) => {
    if (tokenDescriptor === UNKNOWN_TOKEN_DESCRIPTOR){
      if (this._optionalDescriptors.length > 0){
        const optionalTokens  = this.unusedOptionalDescriptors;
        const matchingToken = optionalTokens.find(token => token.pattern.test(text));
        if (matchingToken){
          this.markOptionalTokenDescriptorUsed(matchingToken);
          return true;
        } else {
          return false;
        }
      }
      return false;
    } else if (tokenDescriptor.pattern){
      return tokenDescriptor.pattern.test(text);
    } else {
      return true;
    }
  }
  
}

export const EmptyTokenList = new TokenList();