import 'jest';
import { resolveSearchTokens, buildRegexFromSearchTerm, NB_SPACE } from '../token-search';
import { mockSearchService, ELLIPSIS, SearchIdentifiers } from './token-search-test-support';

describe('resolveSearchTokens', () => {
  const command = {
    commandTokens: [
      {
        name: 'client',
        searchId: SearchIdentifiers.User
      },
      {
        name: 'test-1'
      },
      {
        name: 'test-2'
      },
      {
        name: 'asset',
        searchId: 'asset-search'
      }
    ]
  };

  test('text with no matched, returns text unchanged', async done => {
    const [text, searchTokens] = await resolveSearchTokens(command, 'blahdy blah', mockSearchService);
    expect(text).toEqual('blahdy blah');
    expect(Object.keys(searchTokens).length).toEqual(0);
    done();
  });

  test('matches single entity, returns single result', async done => {
    const [, searchTokens] = await resolveSearchTokens(command, 'john', mockSearchService);
    expect(Object.keys(searchTokens).length).toEqual(1);
    done();
  });

  test('multiple matches on a single token, unable to resolve', async done => {
    const [text, searchTokens] = await resolveSearchTokens(command, 'jones', mockSearchService);
    expect(text).toEqual('jones');
    expect(Object.keys(searchTokens).length).toEqual(0);
    done();
  });

  test('multiple matches on first token, single match on both, should resolve against both tokens', async done => {
    const [text, searchTokens] = await resolveSearchTokens(
      command,
      'jones credit',
      mockSearchService
    );
    expect(text).toEqual(`janie${NB_SPACE}Jones${NB_SPACE}(cr${ELLIPSIS})`);
    expect(Object.keys(searchTokens).length).toEqual(1);
    done();
  });
  test('multi - word search followed by token, correctly resolved', async done => {
    const [text, searchTokens] = await resolveSearchTokens(
      command,
      'jones credit test1',
      mockSearchService
    );
    expect(text).toEqual(`janie${NB_SPACE}Jones${NB_SPACE}(cr${ELLIPSIS}) test1`);
    expect(Object.keys(searchTokens).length).toEqual(1);
    done();
  });

  describe('buildRegexFromSearchTerm', () => {
    test('single word search term yields single match block', () => {
      const searchTerm = 'vod';
      const regexp = buildRegexFromSearchTerm(searchTerm);
      expect(regexp).toEqual(/(\bvod)/gi);
    });
    test('multi word search term yields multi block match pattern', () => {
      const searchTerm = 'vod london gbp';
      const regexp = buildRegexFromSearchTerm(searchTerm);
      expect(regexp).toEqual(/(\bvod|\blondon|\bgbp)/gi);
    });
    test('special characters break regex, they are removed', () => {
      const searchTerm = 'vod (london gbp)';
      const regexp = buildRegexFromSearchTerm(searchTerm);
      expect(regexp).toEqual(/(\bvod|\blondon|\bgbp)/gi);
    });
  });
});