import { searchUsers, searchAssets, searchStrategy, SearchIdentifiers } from '../token-search/__tests__/token-search-test-support';

export {SearchIdentifiers};

export const getSearchSuggestions = (searchId, searchTerm) =>
  searchId === SearchIdentifiers.User
    ? searchUsers(searchTerm)
    : searchId === SearchIdentifiers.Asset
      ? searchAssets(searchTerm)
      : searchStrategy(searchTerm);

export const processInput = async (commandPrefix, commandText, searchTokens) => {
  switch (commandPrefix) {
    case 'RFQ Ticket':
      console.log(`Command invoked ${commandPrefix} ${commandText} ${JSON.stringify(searchTokens)}`)
      break;
    default:
      return Promise.reject(`Unexpected command prefix ${commandPrefix}`);
  }
};
