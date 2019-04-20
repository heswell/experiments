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
        suggestionText: [command,description]
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
            suggestionText: [command,description]
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
        const [firstName, lastName, company, oeAlias] = user;
        searchResult.searchResults.push({
          value: user.join(),
          speedbarText: `${lastName}, ${firstName} (${company.slice(0, 2)}${ELLIPSIS})`,
          suggestionText: [`${lastName}, ${firstName}`, `${oeAlias}`, company]
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
          const [bbgId, ric, name] = entity;
          searchResult.searchResults.push({
            value: entity.join(),
            speedbarText: `${bbgId}`,
            suggestionText: [bbgId, ric, name]
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
  ['janie', 'Jones', 'credit suisse (Casablanca Ltd)', 12356],
  ['simon', 'Johns', 'credit suisse (Casablanca Ltd)', 12345],
  ['billy', 'bragg', 'credit agricole', 100102],
  ['jenny', 'Jones', 'deutsche bank', 100606],
  ['grahame', 'greene', 'citadel', 100607],
  ['patsy', 'Sledge-hammer', 'Royal Caribbean Holidays', 34567],
  ['Richard', 'Chamberlain', 'citadel', 100607],
  ['billy', 'Budd', 'credit suisse (Casablanca Ltd)', 12345],
  ['sarah', 'Palin', 'credit suisse (Casablanca Ltd)', 12345],
  ['mary', 'Tudor', 'credit suisse (Casablanca Ltd)', 12345],
  ['Anne', 'Widdicombe', 'credit suisse (Casablanca Ltd)', 12345],
  ['Benedict', 'Cumberbach', 'credit suisse (Casablanca Ltd)', 12345],
  ['Jo', 'Blow', 'credit suisse (Casablanca Ltd)', 12345],
  ['william', 'Braithwaite', 'credit suisse (Casablanca Ltd)', 12345],
  ['Margaret', 'Smith-Williamson', 'credit suisse (Casablanca Ltd)', 12345],
  ['June', 'Whitfield', 'credit suisse (Casablanca Ltd)', 12345],
  ['Simon', 'Clegg', 'credit suisse (Casablanca Ltd)', 12345],
  ['billy', 'Graham', 'credit suisse (Casablanca Ltd)', 12345],
  ['Frank', 'Worthington', 'credit suisse (Casablanca Ltd)', 12345],
  ['Paul', 'McCartney', 'credit suisse (Casablanca Ltd)', 12345],
  ['John', 'Smith', 'credit suisse (Casablanca Ltd)', 12345],
  ['Joan', 'Smith', 'credit suisse (Casablanca Ltd)', 12345],
  ['Joanne', 'Smythe', 'credit suisse (Casablanca Ltd)', 12345],
  ['Derek', 'Jones', 'credit suisse (Casablanca Ltd)', 12345],
  ['Dan', 'Jonson', 'credit suisse (Casablanca Ltd)', 12345],
  ['Jerome', 'Jerome', 'credit suisse (Casablanca Ltd)', 12345],
  ['Michael', 'Poston', 'credit suisse (Casablanca Ltd)', 12345],
  ['Susanna', 'Barre', 'credit suisse (Casablanca Ltd)', 12345],
  ['Butch', 'Mahoney', 'credit suisse (Casablanca Ltd)', 12345],
  ['Percival', 'Shelley', 'credit suisse (Casablanca Ltd)', 12345],
  ['Shelley', 'Duval', 'credit suisse (Casablanca Ltd)', 12345],
  ['Fat', 'Ladd', 'credit suisse (Casablanca Ltd)', 12345],
  ['Slim', 'Shadey', 'credit suisse (Casablanca Ltd)', 12345],
  ['Alan', 'Ladd', 'credit suisse (Casablanca Ltd)', 12345],
  ['Julie', 'Christie', 'credit suisse (Casablanca Ltd)', 12345],
  ['Michelle', 'Pfeiffer', 'credit suisse (Casablanca Ltd)', 12345],
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
