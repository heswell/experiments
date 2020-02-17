import { buildRegexFromSearchTerm } from '../../../token-search';

export const SEARCHID_OPTIONAL_TOKENS = 'optional-tokens';

const patternsLast = (suggestion1, suggestion2) => {
  const s1 = suggestion1.pattern === undefined ? 0 : 1;
  const s2 = suggestion2.pattern === undefined ? 0 : 1;
  return s1 - s2;
}

export const getSuggestionsForOptionalTokens = tokenList => (searchId, searchTerm) => {
  const trimmedSearchTerm = searchTerm.trim();
  const searchTerms = trimmedSearchTerm.split(/\s+/);
  const searchPatterns = searchTerms.map(buildRegexFromSearchTerm);
  const tokenDescriptors = tokenList.unusedOptionalDescriptors;
  const searchResult = {
    searchTerm,
    searchResults: []
  };

  const suggestions = tokenDescriptors.reduce((list, tokenDescriptor) => {
    const { description, valuesHelp } = tokenDescriptor;
    if (valuesHelp) {
      valuesHelp.forEach(({ value, description: text, pattern }) => {
        list.push({
          value,
          speedbarText: value,
          suggestionText: [value,text],
          pattern
        })
      })

    } else {
      list.push({
        value: '',
        speedbarText: '',
        suggestionText: ['', description]
      })
    }

    return list.sort(patternsLast);
  }, [])

  if (trimmedSearchTerm === '') {
    searchResult.searchResults = suggestions.map(({pattern, ...suggestion}) => suggestion);
  } else {
    suggestions.forEach(({pattern, ...suggestion}) => {
      // search terms are logically ANDed together, so we must match every pattern
      if (pattern){
        if (pattern.test(trimmedSearchTerm)){
          searchResult.searchResults.push(suggestion);
        }
      } else {
        const [value] = suggestion.suggestionText;
        if (searchPatterns.every(pattern => pattern.test(value))) {
          searchResult.searchResults.push(suggestion);
        }
  
      }
    });
  }

  return Promise.resolve(searchResult)
}