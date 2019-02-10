import { buildRegexFromSearchTerm } from '../../../token-search';

export const getSuggestionsForOptionalTokens = tokenList => (searchld, searchTerm) => {

  const searchTerms = searchTerm.trim().split(/\s+/);
  const searchPatterns = searchTerms.map(buildRegexFromSearchTerm);
  const tokenDescriptors = tokenList.unusedOptionalDescriptors;
  const searchResult = {
    searchTerm,
    searchResults: []
  };

  const suggestions = tokenDescriptors.reduce((list, tokenDescriptor) => {
    const { description, valuesHelp } = tokenDescriptor;
    if (valuesHelp) {
      valuesHelp.forEach(({ value, description: text }) => {
        list.push({
          value,
          speedbarText: value,
          suggestionText: `${value} ${text}`
        })
      })
    } else {
      list.push({
        value: '',
        speedbarText: '',
        suggestionText: description
      })
    }

    return list;
  }, [])

  if (searchTerm.trim() === '') {
    searchResult.searchResults = suggestions;
  } else {
    suggestions.forEach(suggestion => {
      // search terms are logically ANDed together, so we must match every pattern
      const props = Object.values(suggestion)
      if (searchPatterns.every(pattern => props.some(property => pattern.test(property)))) {
        searchResult.searchResults.push(suggestion);
      }
    });
  }

  return Promise.resolve(searchResult)
}