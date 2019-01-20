
import React from 'react';
import { buildRegexFromSearchTerm } from '../token-search/token-search';

const styles = {
  searchMatch: 'search-suggestion-search-match'
}

export function hilightSearchTermMatchesInText(text,searchTerm) {
  if(searchTerm === undefined || searchTerm.trim() === '') {
  return [text];
} else {
  const pattern = buildRegexFromSearchTerm(searchTerm);
  const textChunks = text.split(pattern).filter(s => s !== '');
  return textChunks.map((textChunk, chunkIdx) => {
    if (pattern.test(textChunk)) {
      return (
        <span key={chunkIdx} className={styles.searchMatch}>
          {textChunk}
        </span>
      );
    } else {
      return textChunk;
    }
  });
}
}
