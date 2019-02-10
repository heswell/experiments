/**
* Mock Search service to support the tests in token-search
*/
import { buildRegexFromSearchTerm } from '../token-search';
export const ELLIPSIS = String.fromCharCode(8230);

export const SearchIdentifiers = {
  User: 'user',
  Asset: 'asset',
  Strategy: 'strategy',
  OptionalFields: 'optionals'
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

export const searchStrategy = searchTerm =>
  new Promise(resolve => {
    console.log(`search strategy '${searchTerm}'`)
    const searchResult = {
      searchTerm,
      searchResults: []
    };
    let trailingSpace = false;
    if (searchTerm.trim() === '') {
      searchResult.searchResults = strategies.map(([command, description]) => ({
        value: command,
        speedbarText: command,
        suggestionText: `${command} ${description}`
      }))
    } else {
      trailingSpace = searchTerm[searchTerm.length - 1] === ' ';
      const searchTerms = searchTerm.trim().split(/\s+/);
      const searchPatterns = searchTerms.map(buildRegexFromSearchTerm);
      strategies.forEach(strategy => {
        // search terms are logically ANDed together, so we must match every pattern
        if (searchPatterns.every(pattern => strategy.some(property => pattern.test(property)))) {
          const [command, description] = strategy;
          searchResult.searchResults.push({
            value: command,
            speedbarText: command,
            suggestionText: `${command} ${description}`
          });
        }
      });
      if (trailingSpace && searchTerms.length === 1) {
        // check to see if we have a unique identifier full match
        const [trimmedTerm] = searchTerms;
        const match = searchResult.searchResults.filter(suggestion => suggestion.speedbarText.toLowerCase() === trimmedTerm.toLowerCase())
        if (match.length === 1) {
          searchResult.searchResults = match
        }
      }
    }
    resolve(searchResult);
  })

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
    const searchResult = {
      searchTerm,
      searchResults: []
    };
    if (searchTerm.trim() === '') {
      resolve(searchResult)
    } else {
      const trailingSpace = searchTerm[searchTerm.length - 1] === ' ';
      const searchTerms = searchTerm.trim().split(/\s+/);
      const searchPatterns = searchTerms.map(buildRegexFromSearchTerm);
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
      if (trailingSpace && searchTerms.length === 1) {
        // check to see if we have a unique identifier full match
        const [trimmedTerm] = searchTerms;
        const match = searchResult.searchResults.filter(asset => asset.speedbarText.toLowerCase() === trimmedTerm.toLowerCase())
        if (match.length === 1) {
          searchResult.searchResults = match
        }
      }
      resolve(searchResult);
    }
  });
const strategies = [
  ['C', 'Call'],
  ['P', 'Put'],
  ['CS', 'Call Spread'],
  ['CC', 'Call Calendar'],
  ['PS', 'Put Spread'],
  ['PC', 'Put Calendar'],
  ['RR', 'Risk Reversal'],
  ['STG', 'Strangle'],
  ['STD', 'Straddle'],
  ['CF', 'Call Fly'],
  ['PF', 'Put Fly'],
  ['CSC', 'Call Spread Collar'],
  ['PSC', 'Put Spread Collar']
];

const Users = [
  ['janie', 'Jones', 'credit suisse'],
  ['simon', 'Johns', 'credit suisse'],
  ['billy', 'bragg', 'credit agricole'],
  ['jenny', 'Jones', 'deutsche bank'],
  ['grahame', 'greene', 'citadel'],
  ['patsy', 'Sledge-hammer', 'Royal Caribbean'],
  ['Richard', 'Chamberlain', 'citadel']
];
const Assets = [
  ['vod In', 'vod.l', 'vodafone'],
  ['ftse’,	’ftse', 'FTSE	100'],
  ['sx5e', 'sx5e', 'Euro	Stoxx	50'],
  ['sx5egp', 'sx5egp', 'Euro	Stoxx	50 GP'],
  ['sx5f', 'sx5f', 'Euro	Stoxx	60'],
  ['sx5g', 'sx5g', 'Euro	Stoxx	70']
];
export const mockSearchService = {
  getSearchResults
}
