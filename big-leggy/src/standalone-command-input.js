import React from 'react';
import ReactDOM from 'react-dom';
import CommandWindow from './command-input/command-window';
import {CommandType, TokenStyle} from './command-input/index';
import {SearchIdentifiers} from './command-input/command-handlers/command-handler';

import './index.css'

const DATE_PATTERN = /^([0-3]?[0-9])?(jan|feb|mar|apr|may|jun|jul|sep|oct|nov|dec)\d{2}$/i;
const DECIMAL_PATTERN = /^[+-]?\d+(\.\d+)?$/;
const DECIMAL_PATTERN_WITH_ABBREV = /^[+-]?\d+(\.\d+)?[mk]?$/i;

const commands = [
  {
    id: 'rfq-ticket',
    kpld: undefined,
    prefix: 'RFQ Ticket',
    isEntitled: () => true,
    getSpeedbarHandler: () =>
      import(/* webpackChunkName: 'command-handler' */ './command-input/command-handlers/command-handler'),
    commandType: CommandType.WindowCommand,
    description: 'launch for your workspace',
    icon: 'web_asset',
    commandTokens: [
        {
        name: 'client',
        description: 'Contact name/Client',
        searchld: SearchIdentifiers.User,
        tokenStyle: TokenStyle.Outline
        },
        {
        name: 'direction',
        description: 'direction',
        cueText: 'Enter Direction',
        formatHelp: 'Mkt, Buy, Sell',
        pattern: /^(mkt|buy|sell)$/i
        },
        {
        name: 'quantity',
        description: 'Quantity',
        formatHelp: '1k, 10m',
        pattern: DECIMAL_PATTERN_WITH_ABBREV
        },
        {
        name: 'underlying',
        description: 'Underlying',
        searchld: SearchIdentifiers.Asset,
        tokenStyle: TokenStyle.Outline
        },
        {
        name: 'expiry',
        description: 'Expiry Date',
        formatHelp: 'Decl8, 29Marl8',
        pattern: DATE_PATTERN
        },
        { name: 'strike', description: 'Strike Price', pattern: DECIMAL_PATTERN },
        { name: 'c/p', description: 'Call or Put', formatHelp: 'c, p', pattern: /^[cp]$/i },
        { name: 'ref', description: 'Reference', formatHelp: '3300f, 97.6s, 3125.99jun2020f' },
        { 
          name: 'venue',
          description: 'Venue',
          formatHelp: 'OTC, Listed (default)',
          pattern: /^(otc|listed)$/i,
          required: false
        },
    ]
  }
]

class StandaloneCommandWindow extends React.Component {

  render(){
    return (
      <CommandWindow commands={commands}/>
    )
  }
}

ReactDOM.render(
  <StandaloneCommandWindow />,
  document.getElementById('root'));


