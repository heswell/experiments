import React from 'react';
import ReactDOM from 'react-dom';
import CommandBar from './command-bar';
import {CommandType, TokenStyle} from './command-bar';
import {SearchIdentifiers} from './command-bar-services/rfq-command-service';
import * as tk from './command-bar-services/command-tokens';

import './index.css'

const DATE_PATTERN = /^([0-3]?[0-9])?(jan|feb|mar|apr|may|jun|jul|sep|oct|nov|dec)\d{2}$/i;
const DECIMAL_PATTERN = /^[+-]?\d+(\.\d+)?$/;
const DECIMAL_PATTERN_WITH_ABBREV = /^[+-]?\d+(\.\d+)?[mk]?$/i;

const commands = [
  {
    id : 'simple-command',
    prefix: 'CMD',
    getSpeedbarHandler: () =>
      import(/* webpackChunkName: 'command-handler' */ './command-bar-services/rfq-command-service'),
      commandType: CommandType.ActionCommand,
      description: 'simple action',
      icon: 'web_asset',
      commandTokens: [
        tk.CLIENT,
        tk.DIRECTION,
        tk.QUANTITY_WITH_RATIO,
        tk.STRIKE_RATIO
      ]
  },
  {
    id : 'simple-command-2',
    prefix: 'OPT',
    getSpeedbarHandler: () =>
      import(/* webpackChunkName: 'command-handler' */ './command-bar-services/rfq-command-service'),
      commandType: CommandType.ActionCommand,
      description: 'simple action with optional tokens',
      icon: 'web_asset',
      commandTokens: [
        tk.CLIENT,
        tk.DIRECTION,
        tk.QUANTITY_WITH_RATIO,
        tk.VENUE,
          { 
            name: 'delta',
            description: 'Delta',
            formatHelp: `o/r, w/d, e/ds`,
            pattern: /^(o\/r|w\/d|e\/ds)$/i,
            required: false
          },
          { 
            name: 'mid',
            description: 'Mid (OTC only)',
            formatHelp: `1023074mid`,
            pattern: /^(\d)+mid$/i,
            required: false
          },
          // { 
          //   name: 'exchange',
          //   description: 'Exchange',
          //   formatHelp: `EURX, LIFE`,
          //   pattern: /^[a-z]+$/i,
          //   required: false
          // },
          { 
            name: 'multiplier',
            description: 'Multiplier',
            formatHelp: `100x`,
            pattern: /^\d+x$/i,
            required: false
          },
          { 
            name: 'notional',
            description: 'notional (qty)',
            formatHelp: `ntl`,
            pattern: /^ntl$/i,
            required: false
          },
          { 
            name: 'lei',
            description: 'LEI',
            formatHelp: `xyzLE`,
            pattern: /^[a-z0-9]+le$/i,
            required: false
          },
          { 
            name: 'pctStrike',
            description: 'Percentage Strike',
            formatHelp: `pct`,
            pattern: /^pct$/i,
            required: false
          },
  
      ]
  },
  {
    id: 'rfq-ticket',
    prefix: 'RFQ Ticket',
    isEntitled: () => true,
    getSpeedbarHandler: () =>
      import(/* webpackChunkName: 'command-handler' */ './command-bar-services/rfq-command-service'),
    commandType: CommandType.WindowCommand,
    description: 'launch for your workspace',
    icon: 'web_asset',
    commandTokens: [
      tk.CLIENT,
      tk.DIRECTION,
      tk.QUANTITY_WITH_RATIO,
      {
        name: 'underlying',
        description: 'Underlying',
        searchId: SearchIdentifiers.Asset,
        tokenStyle: TokenStyle.Outline
        },
        {
        name: 'expiry',
        description: 'Expiry Date',
        formatHelp: 'Decl8, 29Marl8',
        pattern: DATE_PATTERN
        },
        tk.STRIKE_RATIO,
        {
          name: 'call/put/strategy',
          description: 'Call or Put',
          valuesHelp: [
            {value: 'C', description: 'Call'},
            {value: 'P', description: 'Put'},
            {value: 'CS', description: 'Call Spread'},
            {value: 'CC', description: 'Call Calendar'},
            {value: 'PS', description: 'Put Spread'},
            {value: 'PC', description: 'Put Calendar'},
            {value: 'RR', description: 'Risk Reversal'},
            {value: 'STG', description: 'Strangle'},
            {value: 'STD', description: 'Straddle'},
            {value: 'CF', description: 'Call Fly'},
            {value: 'PF', description: 'Put Fly'},
            {value: 'CSC', description: 'Call Spread Collar'},
            {value: 'PSC', description: 'Put Spread Collar'}


          ],
          pattern: /^(c|p|cs|cc|ps|pc|rr|stg|std|cf|pf|csc|psc)$/i
        },
        { name: 'ref', description: 'Reference', formatHelp: '3300f, 97.6s, 3125.99jun2020f' },
        tk.VENUE,
        { 
          name: 'delta',
          description: 'Delta',
          formatHelp: `o/r, w/d, e/ds`,
          pattern: /^(o\/r|w\/d|e\/ds)$/i,
          required: false
        },
        { 
          name: 'mid',
          description: 'Mid (OTC only)',
          formatHelp: `1023074mid`,
          pattern: /^(\d)+mid$/i,
          required: false
        },
        // { 
        //   name: 'exchange',
        //   description: 'Exchange',
        //   formatHelp: `EURX, LIFE`,
        //   pattern: /^[a-z]+$/i,
        //   required: false
        // },
        { 
          name: 'multiplier',
          description: 'Multiplier',
          formatHelp: `100x`,
          pattern: /^\d+x$/i,
          required: false
        },
        { 
          name: 'notional',
          description: 'Exchange',
          formatHelp: `ntl`,
          pattern: /^ntl$/i,
          required: false
        },
        { 
          name: 'lei',
          description: 'LEI',
          formatHelp: `xyzLE`,
          pattern: /^[a-z0-9]+e$/i,
          required: false
        },
        { 
          name: 'pctStrike',
          description: 'Percentage Strike',
          formatHelp: `pct`,
          pattern: /^pct$/i,
          required: false
        },
    ]
  }
]

class StandaloneCommandWindow extends React.Component {

  render(){
    return (
      <CommandBar commands={commands}/>
    )
  }
}

ReactDOM.render(
  <StandaloneCommandWindow />,
  document.getElementById('root'));


