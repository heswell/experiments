/**
* Mock Search service to support the tests in token-search
*/
import { buildRegexFromSearchTerm } from '../token-search';
export const ELLIPSIS = String.fromCharCode(8230);

export const SearchIdentifiers = {
  User: 'user-search',
  Asset: 'asset-search'
}

const getSearchResults = (_, searchId, searchTerm) => {
  if (searchId === SearchIdentifiers.User) {
    return searchUsers(searchTerm);
  } else if (searchId === SearchIdentifiers.Asset) {
    return searchAssets(searchTerm);
  } else {
    return Promise.reject('unknown searchId');
  }
};
export const searchUsers = searchTerm =>
  new Promise(resolve => {
    const searchPatterns = searchTerm.split(/\s+/).map(buildRegexFromSearchTerm);
    const searchResult = {
      searchTerm,
      searchResults: []
    };
    Users.forEach(user => {
      // search terms are logically ANDed together, so we must match every pattern
      if (searchPatterns.every(pattern => user.some(property => pattern.test(property)))) {
        const [firstname, surname, company] = user;
        searchResult.searchResults.push({
          value: user.join(),
          speedbarText: `${firstname} ${surname} (${company.slice(0, 2)}${ELLIPSIS})`,
          suggestionText: `${firstname} ${surname} (${company})`
        });
      }
    });
    resolve(searchResult);
  });

export const searchAssets = searchTerm =>
  new Promise(resolve => {
    const searchPatterns = searchTerm.split(/\s+/).map(buildRegexFromSearchTerm);
    const searchResult = {
      searchTerm,
      searchResults: []
    };
    Assets.forEach(entity => {
      // search terms are logically ANDed together, so we must match every pattern
      if (searchPatterns.every(pattern => entity.some(property => pattern.test(property)))) {
        const [bbgld, ric, name] = entity;
        searchResult.searchResults.push({
          value: entity.join(),
          speedbarText: `${bbgld}`,
          suggestionText: `${bbgld} ${ric} (${name})`
        });
      }
    });
    resolve(searchResult);
  });
const Users = [
  ['janie', 'Jones', 'credit suisse'],
  ['simon', 'Johns', 'credit suisse'],
  ['billy', 'bragg', 'credit agricole'],
  ['jenny', 'Jones','deutsche bank'],
  ['grahame', 'greene','citadel'],
  ['patsy', 'Sledge-hammer','Royal Caribbean'],
  ['Richard', 'Chamberlain','citadel']
];
const Assets = [
  ['vod In', 'vod.l', 'vodafone'],
  ['ftse’,	’ftse', 'FTSE	100'],
  ['sx5e', 'sx5e', 'Euro	Stoxx	50'],
  ['sx5f', 'sx5f', 'Euro	Stoxx	60'],
  ['sx5g', 'sx5g', 'Euro	Stoxx	70']
];
export const mockSearchService = {
  getSearchResults
}
