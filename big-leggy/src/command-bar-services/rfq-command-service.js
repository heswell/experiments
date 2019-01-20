import {searchUsers, searchAssets} from '../token-search/__tests__/token-search-test-support';

export const SearchIdentifiers = {
  User: 'user',
  Asset: 'asset'
}

export const getSearchSuggestions = (searchId, searchTerm) =>
  searchId === SearchIdentifiers.User ? searchUsers(searchTerm) : searchAssets(searchTerm);

export const processInput = async (commandPrefix, commandText, searchTokens) => {
  switch (commandPrefix) {
    case 'RFQ Ticket':
      console.log(`Command invoked ${commandPrefix} ${commandText} ${JSON.stringify(searchTokens)}`)
    break;
    default:
      return Promise.reject(`Unexpected command prefix ${commandPrefix}`);
  }
};
