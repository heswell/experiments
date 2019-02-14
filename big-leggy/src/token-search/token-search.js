export const SearchTokenStatus = {
  Resolved: 'resolved'
}

const PATTERN_MATCH_ANYTHING = /\S+/;
export const NORMAL_SPACE = String.fromCharCode(32);
export const NB_SPACE = String.fromCharCode(160);
export const PATTERN_SPACE_ALL = new RegExp(`${NORMAL_SPACE}+`, 'g');
export function insertNonBreakingSpaces(text) {
  return text.replace(PATTERN_SPACE_ALL, NB_SPACE);
}

export function buildRegexFromSearchTerm(searchTerm) {
  const safeSearchTerm = searchTerm.replace(/[()]/g, '');
  if (safeSearchTerm.match(/\w/) === null) {
    return new RegExp('\\b(’ + safeSearchTerm + ’)', 'ig');
  } else {
    const pattern = safeSearchTerm
      .split(/\s+/)
      .map(s => '\\b' + s)
      .join('|');

    return new RegExp(`(${pattern})`, 'ig');
  }
}

export const resolveSearchTokens = async (command, inputText, searchService) =>
  new Promise(resolve => {
    const { commandTokens: descriptors = [] } = command;
    let token;
    let remainingText = inputText;
    let suggestion;
    const tokens = [];
    const searchTokens = {};
    let tokenIdx = 0;

    const nextToken = async () => {
      const descriptor = descriptors[tokenIdx];
      const nextDescriptor = descriptors[tokenIdx + 1];
      suggestion = undefined;

      if (descriptor.searchId) {
        try {
          [token, remainingText, suggestion] = await resolveSearchToken(
            command,
            descriptor.searchId,
            remainingText,
            searchService,
            nextDescriptor
          )
        } catch (e) {
          // once we fail to resolve a search token, stop
          token = remainingText;
          remainingText = '';
        }
      } else {
        [token, remainingText] = stripLeadingToken(remainingText);
      }
      tokens.push(token);
      if (suggestion) {
        if (descriptor.searchId) {
          searchTokens[descriptor.searchId] = {
            status: SearchTokenStatus.Resolved,
            suggestion
          };
        }
      }
      tokenIdx += 1;
      if (remainingText) {
        await nextToken();
      } else {
        resolve([tokens.join(' '), searchTokens]);
      }
    };
    nextToken();
  });

export const resolveSearchToken = async (command, searchId, text, searchService, nextTokenDescriptor) =>
  new Promise((resolve, reject) => {
    const searchTerms = text.trim().split(/\s+/);
    const currentSearchTerms = [];
    let lastSearchResult = null;
    const nextTokenPattern =
      nextTokenDescriptor && nextTokenDescriptor.pattern
        ? nextTokenDescriptor.pattern
        : PATTERN_MATCH_ANYTHING;

    const nextResult = async () => {
      // new  
      const previousSearchTerms = currentSearchTerms.join(' ');

      currentSearchTerms.push(searchTerms.shift());
      const searchText = currentSearchTerms.join(' ');
      const result = await searchService.getSearchResults(command, searchId, searchText);
      let resolved = false;
      if (result.searchResults.length === 0) {
        if (lastSearchResult && lastSearchResult.suggestions.length === 1) {
          // the most common scenario when we have a well-specified search
          // (and we’re not at the end of the command)
          resolved = true;
        } else {
          // is one of the results an exact match ?
          const suggestion = lastSearchResult && lastSearchResult.suggestions.find(({speedbarText}) => speedbarText === lastSearchResult.searchTerm)
          if (suggestion){
            resolved = true;
          } else {
            if (lastSearchResult){
              // do we try matching remaining searchTerms against remaining tokens to determine extent of search terms
              console.log(`absolutely no match for ${searchText} what about ${lastSearchResult.searchTerm} or ${previousSearchTerms}`)
            }
            return reject(Error(`No match found for ’${searchText}'`));
          }
          // const nextTerm = currentSearchTerms[currentSearchTerms.length - 1]
          // if (nextTokenPattern.test(nextTerm)){
          //   console.log(`looks like we have a match against ${nextTokenDescriptor.name} for ${nextTerm}`, lastSearchResult.suggestions)
          // }

        }
      } else if (
        // try and guard against consuming too many tokens by matching against next token
        result.searchResults.length > 0 &&
        lastSearchResult &&
        lastSearchResult.suggestions.length === 1 &&
        nextTokenPattern.test(currentSearchTerms[currentSearchTerms.length - 1])
      ) {
        resolved = true;
      } else {
        lastSearchResult = {
          suggestions: result.searchResults,
          searchTerm: searchText,
          remainingText: searchTerms.join(' ')
        };
      }
      if (searchTerms.length > 0 && !resolved) {
        // add the next token to our search terms and try again ...
        nextResult();
      } else if (result.searchResults.length === 1) {
        // this will be the case with a well specified search and we are at the end of the command
        resolved = true;
      } else if (!resolved) {
        reject(Error(`No match found for ’${searchText}'`));
      }

      if (resolved) {
        const [suggestion] = lastSearchResult.suggestions;
        const speedbarText = insertNonBreakingSpaces(suggestion.speedbarText);
        resolve([
          speedbarText,
          lastSearchResult.remainingText,
          {
            ...suggestion,
            speedbarText
          }
        ]);
      }
    };
    if (searchTerms.length > 0) {
      // kick off the token by token search process
      nextResult();
    } else {
      reject(Error('invalid input, empty text'));
    }
  })

function stripLeadingToken(text) {
  const [firstToken, ...rest] = text.split(/\s+/);
  return [firstToken, rest ? rest.join(' ').trim() : ''];
}