import 'jest';
import TokenList, { TokenType } from './token-list';
import { NB_SPACE, SearchTokenStatus } from '../../token-search';
import { CommandType } from '..';

describe('TokenList', () => {

  describe('text tokenizing', () => {
    let command;

    beforeAll(() => {
      command = {
        prefix: '1 Quote',
        description: 'Quote',
        commandType: CommandType.WindowCommand,
        commandTokens: [
          { name: 'client', description: '' },
          { name: 'direction', description: '', pattern: /^(mkt|buy|sell)$/i },
          { name: 'quantity', description: '', pattern: /^\d+$/ }
        ],
        getSpeedbarService: () => { },
        isEntltled: () => true
      };
    });

    test('creation with no command or inputText yields empty tokenlist', () => {
      const tokenList = new TokenList();
      expect(tokenList.toString()).toEqual('');
      expect(tokenList.commandComplete).toEqual(false);
    });

    test('parsing with command but no inputText yields empty tokenList', () => {
      const tokenList = new TokenList(command);
      expect(tokenList.toString()).toEqual('');
    });

    test('parses single word, yielding single token', () => {
      let tokenList = new TokenList(command, 'a');
      expect(tokenList.toString()).toEqual('a');
      expect(tokenList.tokens.length).toEqual(1);
      let [token] = tokenList.tokens;
      expect(token.type).toEqual(TokenType.Text);

      tokenList = new TokenList(command, 'abc1234');
      expect(tokenList.toString()).toEqual('abc1234');
      [token] = tokenList.tokens;
      expect(token.text).toEqual('abc1234');

      tokenList = new TokenList(command, '123');
      expect(tokenList.toString()).toEqual('123');
      [token] = tokenList.tokens;
      expect(token.text).toEqual('123');
      expect(tokenList.commandComplete).toEqual(false);

    });

    test('parses single word with whitespace, yields Text and Whitespace tokens', () => {
      let tokenList = new TokenList(command, 'a ');
      expect(tokenList.toString()).toEqual('a ');
      expect(tokenList.tokens.length).toEqual(2);
      let [token1, token2, token3] = tokenList.tokens;
      expect(token1.type).toEqual(TokenType.Text);
      expect(token2.type).toEqual(TokenType.WhiteSpace);
      tokenList = new TokenList(command, ' a');
      expect(tokenList.toString()).toEqual(' a');
      expect(tokenList.tokens.length).toEqual(2);
      [token1, token2] = tokenList.tokens;
      expect(token1.type).toEqual(TokenType.WhiteSpace);
      expect(token2.type).toEqual(TokenType.Text);
      tokenList = new TokenList(command, ' a ');
      expect(tokenList.toString()).toEqual(' a ');
      expect(tokenList.tokens.length).toEqual(3);
      [token1, token2, token3] = tokenList.tokens;
      expect(token1.type).toEqual(TokenType.WhiteSpace);
      expect(token2.type).toEqual(TokenType.Text);
      expect(token3.type).toEqual(TokenType.WhiteSpace);
      expect(token1.text).toEqual(' ');
      expect(token2.text).toEqual('a');
      expect(token3.text).toEqual(' ');
    });

    test('parses multiple words, yields correct tokens', () => {
      const tokenList = new TokenList(command, 'client mkt 2000');
      expect(tokenList.toString()).toEqual('client mkt 2000');
      expect(tokenList.tokens.length).toEqual(5);
      const [, , , , tokenl] = tokenList.tokens;
      expect(tokenl.type).toEqual(TokenType.Text);
      expect(tokenl.text).toEqual('2000');
      expect(tokenList.commandComplete).toEqual(true);

    });

    test('parse multi-word token with NB_SPACE whitespace, yields multi-term token', () => {
      const inputText = `long${NB_SPACE}client${NB_SPACE}name mkt 2000`;
      const tokenList = new TokenList(command, inputText);
      expect(tokenList.toString()).toEqual(inputText);
      expect(tokenList.tokens.length).toEqual(5);
      const [tokenl, wsl, , , token2] = tokenList.tokens;
      expect(tokenl.type).toEqual(TokenType.Text);
      expect(tokenl.text).toEqual(`long${NB_SPACE}client${NB_SPACE}name`);
      expect(wsl.type).toEqual(TokenType.WhiteSpace);
      expect(token2.text).toEqual('2000');
      expect(tokenList.commandComplete).toEqual(true);
    });

    test('parse command with invalid tokens, marks them as invalid', () => {
      const inputText = 'client market two';
      const tokenList = new TokenList(command, inputText);
      expect(tokenList.toString()).toEqual(inputText);
      // extract the non-whitespace tokens
      const [tClient, , tDirection, , tQty] = tokenList.tokens;
      expect(tClient.invalid).toBe(false)
      expect(tDirection.invalid).toBe(true)
      expect(tQty.invalid).toBe(true)
      // should it be complete when one or more tokens are invalid ?
      expect(tokenList.commandComplete).toEqual(true);

    })

    test('parse command with superfluous tokens, marks them as invalid', () => {
      const inputText = 'client mkt 2000 blah';
      const tokenList = new TokenList(command, inputText);
      expect(tokenList.toString()).toEqual(inputText);
      const token = tokenList.tokens[6];
      expect(token.invalid).toBe(true)
    })
  });

  describe('optional tokens', () => {
    let command;

    beforeAll(() => {
      command = {
        prefix: '1 Quote',
        description: 'Quote',
        commandType: CommandType.WindowCommand,
        commandTokens: [
          { name: 'client', description: '' },
          { name: 'direction', description: '', pattern: /^(mkt|buy|sell)$/i },
          { name: 'quantity', description: '', pattern: /^\d+$/ },
          { name: 'venue', description: '', required: false, pattern: /^(otc)$/ },
          { name: 'delta', description: '', required: false, pattern: /^(o\/r)$/ },
          { name: 'exchange', description: '', required: false, pattern: /^[a-z]+$/i }
        ],
        getSpeedbarService: () => { },
        isEntltled: () => true
      };
    });

    test('parse command matching first optional token, parses everything as valid', () => {
      const inputText = 'client mkt 2000 otc';
      const tokenList = new TokenList(command, inputText);
      expect(tokenList.toString()).toEqual(inputText);
      const token = tokenList.tokens[6];
      expect(token.invalid).toBe(false)
      expect(tokenList.commandComplete).toEqual(true);
    })

    test('parse command matching last optional token, parses everything as valid', () => {
      const inputText = 'client mkt 2000 test';
      const tokenList = new TokenList(command, inputText);
      expect(tokenList.toString()).toEqual(inputText);
      const token = tokenList.tokens[6];
      expect(token.invalid).toBe(false)
    })

    test('parse command matching all optional tokens in random order, parses everything as valid', () => {
      const inputText = `client mkt 2000 test otc o/r`;
      const tokenList = new TokenList(command, inputText);
      expect(tokenList.toString()).toEqual(inputText);
      expect(tokenList.tokens.some(t => t.invalid)).toBe(false);
      expect(tokenList.commandComplete).toEqual(true);
    })

    test('parse command matching optional tokens plus invalid token, correctly marks invalid token', () => {
      const inputText = `client mkt 2000 test otc dec18 o/r`;
      const tokenList = new TokenList(command, inputText);
      expect(tokenList.toString()).toEqual(inputText);
      expect(tokenList.tokens.filter(t => t.invalid).length).toBe(1);
      expect(tokenList.tokens.find(t => t.invalid)).toEqual({
        type: 'text',
        startOffset: 25,
        text: 'dec18',
        invalid: true
      })
    })

    test('parse command matching optional tokens with duplicate, correctly marks invalid token', () => {
      const inputText = `client mkt 2000 test otc o/r otc`;
      const tokenList = new TokenList(command, inputText);
      expect(tokenList.toString()).toEqual(inputText);
      expect(tokenList.tokens.filter(t => t.invalid).length).toBe(1);
      expect(tokenList.tokens.find(t => t.invalid)).toEqual({
        type: 'text',
        startOffset: 29,
        text: 'otc',
        invalid: true
      })
    })

  })

  describe('getTokenAtOffset', () => {
    let command;
    beforeAll(() => {
      command = {
        prefix: 'Quote',
        commandType: CommandType.WindowCommand,
        description: '',
        commandTokens: [
          { name: 'client', description: '' },
          { name: 'direction', description: '' },
          { name: 'quantity', description: '' }
        ],
        getSpeedbarService: () => { },
        isEntltled: () => true
      };
    });

    test('called with valid offset, yields correct token', () => {
      const tokenList = new TokenList(command, 'clientl mkt 2009');
      const tokens = tokenList.tokens;
      expect(tokenList.getTokenAtOffset(0)).toEqual(tokens[0]);
      expect(tokenList.getTokenAtOffset(1)).toEqual(tokens[0]);
      expect(tokenList.getTokenAtOffset(7)).toEqual(tokens[0]);
      expect(tokenList.getTokenAtOffset(8)).toEqual(tokens[1]);
      expect(tokenList.getTokenAtOffset(16)).toEqual(tokens[4]);
      expect(tokenList.getTokenAtOffset(17)).toBeUndefined();
    });
  });

  describe('handles multi-term search tokens', () => {
    let command;
    beforeAll(() => {
      command = {
        prefix: 'Quote',
        description: 'create a quote',
        commandTokens: [
          { name: 'client', description: 'client name', searchId: 'client' },
          { name: 'direction', description: '' },
          { name: 'quantity', description: '' }
        ]
      };
    });

    test('parses unresolved search tokens, yields multi - word token', () => {
      const tokenList = new TokenList(command, 'test client', {});
      expect(tokenList.toString()).toEqual(`test${NB_SPACE}client`);
      expect(tokenList.tokens[0].resolved).toBe(false);
    });

    test('parses unresolved search token with trailing whitespace, includes whitespace in token', () => {
      const tokenList = new TokenList(command, 'test ', {});
      expect(tokenList.toString()).toEqual(`test${NB_SPACE}`);
      expect(tokenList.tokens[0].resolved).toBe(false);
    });

    test('parses resolved search tokens, preserves multi-word tokens', () => {
      let searchTokens = {
        client: {
          status: SearchTokenStatus.resolved,
          suggestion: { value: 'test', speedbarText: 'test', suggestionText: 'test' }
        }
      };
      let tokenList = new TokenList(command, 'test mkt', searchTokens);
      expect(tokenList.toString()).toEqual('test mkt');
      searchTokens = {
        client: {
          status: SearchTokenStatus.resolved,
          suggestion: {
            value: 'test',
            speedbarText: `test${NB_SPACE}client`,
            suggestionText: 'test'
          }
        }
      };
      tokenList = new TokenList(command, `test${NB_SPACE}client mkt`, searchTokens);
      expect(tokenList.toString()).toEqual(`test${NB_SPACE}client mkt`);
      expect(tokenList.commandComplete).toEqual(false);

    });

  });
});