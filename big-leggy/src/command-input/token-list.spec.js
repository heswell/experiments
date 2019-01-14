import 'jest';
import noop from 'lodash-es/noop';
import { ICommand, CommandType, ISpeedbarSuggestion } from '@mq/aurora-desktop-core*;
import { TokenList, TokenType } from ’./token-list*;
import { NORMAL_SPACE, NB_SPACE } from '../command1;
let command: ICommand;
describe('TokenList', () => {
describe('text tokenizing', () => {
beforeAll(() => {
command = {
speedbarPrefixes: [
{
prefix: 1 Quote',
description: 'Quote',
commandType: CommandType.WindowCommand
}
b
commandTokens: [
{ name: 'client', description: " },
{ name: 'direction', description: " },
{ name: 'quantity', description: '' }
b
geJtSp^edbarHandler: noop,
isEntltled: noop
};
});
test('creation with no command or inputText yields empty tokenlist', () => {
const tokenList = new TokenListQ;
expect(tokenList.toString()).toEqual('');
});
test('parsing with command but no inputText yields empty tokenList', () => {
const tokenList = new TokenList(command,
expect(tokenList.toString()).toEqual('');
});
test('parses single word, yielding single token', () => {
let tokenList = new TokenList(command, 'a');
expect(tokenList.toString()).toEqual('a');
expect(tokenList.tokens.length).toEqual(l);
let [token] = tokenList.tokens;
expect(token.type).toEqual(TokenType.Text);
tokenList = new TokenList(command, 'abcl234');
expect(tokenList.toString()).toEqual('abcl234');
[token] = tokenList.tokens;
expect(token.text).toEqual('abcl234');
tokenList = new TokenList(command, '123');
expect(tokenList.toString()).toEqual('123');
[token] = tokenList.tokens;
expect(token.text).toEqual(’123’);
});
test('parses single word with whitespace, yields Text and Whitespace tokens', () => {
let tokenList = new TokenList(command, ’a ’);
expect(tokenList.toString()).toEqual('a ');
expect(tokenList.tokens.length).toEqual(2);
let [tokenl, token2, token3] = tokenList.tokens;
expect(tokenl.type).toEqual(TokenType.Text);
expect(token2.type).toEqual(TokenType.WhiteSpace);
tokenList = new TokenList(command, 1 a’);
expect(tokenList.toString()).toEqual(' a’);
expect(tokenList.tokens.length).toEqual(2);
[tokenl, token2] = tokenList.tokens;
expect(tokenl.type).toEqual(TokenType.WhiteSpace);
expect(token2.type).toEqual(TokenType.Text);
tokenList = new TokenList(command, ‘a ’);
expect(tokenList.toString()).toEqual(‘ a ’);
expect(tokenList.tokens.length).toEqual(3);
[tokenl, token2, token3] = tokenList.tokens;
expect(tokenl.type).toEqual(TokenType.WhiteSpace);
expect(token2.type).toEqual(TokenType.Text);
expect(token3.type).toEqual(TokenType.WhiteSpace);
expect(tokenl.text).toEqual(’ ');
expect(token2.text).toEqual(’a‘);
expect(token3.text).toEqual(’	’);
});
test(‘parses multiple words ,yields correct tokens', () => {
const tokenList = new TokenList(command, ’clienl mkt 2000');
expect(tokenList.toString()).toEqual('clienl mkt 2000');
expect(tokenList.tokens.length).toEqual(5);
const [, , , , tokenl] = tokenList.tokens;
expect(tokenl.type).toEqual(TokenType.Text);
expect(tokenl.text).toEqual(’2000');
});
test('parse multi-word token with NB_SPACE whitespace, yields multi-term token’, () => {
const inputText = 'long${NB_SPACE}client${NB_SPACE}name mkt 2000';
const tokenList = new TokenList(command, inputText);
expect(tokenList.toString()).toEqual(inputText);
expect(tokenList.tokens.length).toEqual(5);
const [tokenl, wsl, , , token2] = tokenList.tokens;
expect(tokenl.type).toEqual(TokenType.Text);
expect(tokenl.text).toEqual('long${NB_SPACE}client${NB_SPACE}name');
expect(wsl.type).toEqual(TokenType.WhiteSpace);
expect(token2.text).toEqual(’2000');
});
});
describe('getTokenAtOffset', () => {
beforeAll(() => {
command = {
speedbarPrefixes: [
{
prefix: 'Quote',
commandType: CommandType.WindowCommand,
description: ’’
}
b
commandTokens: [
{ name: ’client', description: '’ },
{ name: 'direction', description: ” },
{ name: 'quantity', description: '' }
b
^etS^edbarHandler: noop,
isEntltled: noop
};
});
test(’called with valid offset, yields correct token', () => {
const tokenList = new TokenList(command, 'clientl mkt 2009');
const tokens = tokenList.tokens;
expect(tokenList.getTokenAtOffset(0)),toEqual(tokens[0]);
expect(tokenList.getTokenAtOffset(1)).toEqual(tokens[0]);
expect(tokenList.getTokenAtOffset(7)).toEqual(tokens[0]);
expect(tokenList.getTokenAtOffset(8)).toEqual(tokens[l]);
expect(tokenList.getTokenAtOffset(16)).toEqual(tokens[4]);
expect(tokenList.getTokenAtOffset(17)).toBeUndefinedQ;
});
})j
describe('handles multi-term search tokens', () => {
beforeAll(() => {
command = {
speedbarPrefixes: [
{
prefix: 'Quote',
description: 'create a quote',
commandType: CommandType.WindowCommand
>
],
commandTokens: [
{
name: ’client',
description: 'client name',
searchld: 'client'
b
{ name: 'direction', description: ” },
{ name: 'quantity', description: '' }
b
^etS^edbarHandler: noop,
isEntltled: noop
};
});
test(’parses unresolved search tokens, yields multi-word token', () => {
const tokenList = new TokenList(command, 'test client');
expect(tokenList.toString()).toEqual('test${NB_SPACE}client%);
});

import 'jest';
import noop from 'lodash-es/noop';
import { ICommand, CommandType, ISpeedbarSuggestion } from '@mq/aurora-desktop-core*;
import { TokenList, TokenType } from ’./token-list*;
import { NORMAL_SPACE, NB_SPACE } from '../command1;
let command: ICommand;
describe('TokenList', () => {
describe('text tokenizing', () => {
beforeAll(() => {
command = {
speedbarPrefixes: [
{
prefix: 1 Quote',
description: 'Quote',
commandType: CommandType.WindowCommand
}
b
commandTokens: [
{ name: 'client', description: " },
{ name: 'direction', description: " },
{ name: 'quantity', description: '' }
b
geJtSp^edbarHandler: noop,
isEntltled: noop
};
});
test('creation with no command or inputText yields empty tokenlist', () => {
const tokenList = new TokenListQ;
expect(tokenList.toString()).toEqual('');
});
test('parsing with command but no inputText yields empty tokenList', () => {
const tokenList = new TokenList(command,
expect(tokenList.toString()).toEqual('');
});
test('parses single word, yielding single token', () => {
let tokenList = new TokenList(command, 'a');
expect(tokenList.toString()).toEqual('a');
expect(tokenList.tokens.length).toEqual(l);
let [token] = tokenList.tokens;
expect(token.type).toEqual(TokenType.Text);
tokenList = new TokenList(command, 'abcl234');
expect(tokenList.toString()).toEqual('abcl234');
[token] = tokenList.tokens;
expect(token.text).toEqual('abcl234');
tokenList = new TokenList(command, '123');
expect(tokenList.toString()).toEqual('123');
[token] = tokenList.tokens;
expect(token.text).toEqual(’123’);
});
test('parses single word with whitespace, yields Text and Whitespace tokens', () => {
let tokenList = new TokenList(command, ’a ’);
expect(tokenList.toString()).toEqual('a ');
expect(tokenList.tokens.length).toEqual(2);
let [tokenl, token2, token3] = tokenList.tokens;
expect(tokenl.type).toEqual(TokenType.Text);
expect(token2.type).toEqual(TokenType.WhiteSpace);
tokenList = new TokenList(command, 1 a’);
expect(tokenList.toString()).toEqual(' a’);
expect(tokenList.tokens.length).toEqual(2);
[tokenl, token2] = tokenList.tokens;
expect(tokenl.type).toEqual(TokenType.WhiteSpace);
expect(token2.type).toEqual(TokenType.Text);
tokenList = new TokenList(command, ‘a ’);
expect(tokenList.toString()).toEqual(‘ a ’);
expect(tokenList.tokens.length).toEqual(3);
[tokenl, token2, token3] = tokenList.tokens;
expect(tokenl.type).toEqual(TokenType.WhiteSpace);
expect(token2.type).toEqual(TokenType.Text);
expect(token3.type).toEqual(TokenType.WhiteSpace);
expect(tokenl.text).toEqual(’ ');
expect(token2.text).toEqual(’a‘);
expect(token3.text).toEqual(’	’);
});
test(‘parses multiple words ,yields correct tokens', () => {
const tokenList = new TokenList(command, ’clienl mkt 2000');
expect(tokenList.toString()).toEqual('clienl mkt 2000');
expect(tokenList.tokens.length).toEqual(5);
const [, , , , tokenl] = tokenList.tokens;
expect(tokenl.type).toEqual(TokenType.Text);
expect(tokenl.text).toEqual(’2000');
});
test('parse multi-word token with NB_SPACE whitespace, yields multi-term token’, () => {
const inputText = 'long${NB_SPACE}client${NB_SPACE}name mkt 2000';
const tokenList = new TokenList(command, inputText);
expect(tokenList.toString()).toEqual(inputText);
expect(tokenList.tokens.length).toEqual(5);
const [tokenl, wsl, , , token2] = tokenList.tokens;
expect(tokenl.type).toEqual(TokenType.Text);
expect(tokenl.text).toEqual('long${NB_SPACE}client${NB_SPACE}name');
expect(wsl.type).toEqual(TokenType.WhiteSpace);
expect(token2.text).toEqual(’2000');
});
});
describe('getTokenAtOffset', () => {
beforeAll(() => {
command = {
speedbarPrefixes: [
{
prefix: 'Quote',
commandType: CommandType.WindowCommand,
description: ’’
}
b
commandTokens: [
{ name: ’client', description: '’ },
{ name: 'direction', description: ” },
{ name: 'quantity', description: '' }
b
^etS^edbarHandler: noop,
isEntltled: noop
};
});
test(’called with valid offset, yields correct token', () => {
const tokenList = new TokenList(command, 'clientl mkt 2009');
const tokens = tokenList.tokens;
expect(tokenList.getTokenAtOffset(0)),toEqual(tokens[0]);
expect(tokenList.getTokenAtOffset(1)).toEqual(tokens[0]);
expect(tokenList.getTokenAtOffset(7)).toEqual(tokens[0]);
expect(tokenList.getTokenAtOffset(8)).toEqual(tokens[l]);
expect(tokenList.getTokenAtOffset(16)).toEqual(tokens[4]);
expect(tokenList.getTokenAtOffset(17)).toBeUndefinedQ;
});
})j
describe('handles multi-term search tokens', () => {
beforeAll(() => {
command = {
speedbarPrefixes: [
{
prefix: 'Quote',
description: 'create a quote',
commandType: CommandType.WindowCommand
>
],
commandTokens: [
{
name: ’client',
description: 'client name',
searchld: 'client'
b
{ name: 'direction', description: ” },
{ name: 'quantity', description: '' }
b
^etS^edbarHandler: noop,
isEntltled: noop
};
});
test(’parses unresolved search tokens, yields multi-word token', () => {
const tokenList = new TokenList(command, 'test client');
expect(tokenList.toString()).toEqual('test${NB_SPACE}client%);
});