import { TokenStyle } from '../command-bar';
import { SearchIdentifiers } from './rfq-command-service';

const DATE_PATTERN = /^([0-3]?[0-9])?(jan|feb|mar|apr|may|jun|jul|sep|oct|nov|dec)\d{2}$/i;

const DECIMAL_PATTERN = '[+-]?\\d+(\\.\\d+)?';
const DECIMAL_REG = new RegExp(`^(${DECIMAL_PATTERN})$`)
const DECIMAL_RATIO_REG = new RegExp(`^(${DECIMAL_PATTERN})(\\/(${DECIMAL_PATTERN}))?$`)

// decimal is invalid unless followed by m or k
const QTY_PATTERN = '\\d+[mk]?|\\d+\\.\\d+[mk]';
const QTY_REG = new RegExp(`^(${QTY_PATTERN})$`)
const QTY_RATIO_REG = new RegExp(`^(${QTY_PATTERN})(\\/(${QTY_PATTERN}))?$`)

export const CLIENT = {
  name: 'client',
  description: 'Contact name/Client',
  searchId: SearchIdentifiers.User,
  tokenStyle: TokenStyle.Outline
};

export const DIRECTION = {
  name: 'direction',
  description: 'direction',
  cueText: 'Enter Direction',
  formatHelp: 'Mkt, Buy, Sell',
  pattern: /^(mkt|buy|sell)$/i
};

export const QUANTITY = {
  name: 'quantity',
  description: 'Quantity',
  formatHelp: '1k, 10m, 10000',
  pattern: QTY_REG
};

export const QUANTITY_WITH_RATIO = {
  name: 'quantity',
  description: 'Quantity, Quantity pair if in a ratio',
  formatHelp: '1k, 10m, 10000, 1.5k/2.5k, 1000/1025',
  pattern: QTY_RATIO_REG
};

export const STRATEGY = {
  name: 'call/put/strategy',
  description: 'Call or Put',
  searchId: SearchIdentifiers.Strategy,
  pattern: /^(c|p|cs|cc|ps|pc|rr|stg|std|cf|pf|esc|psc)$/i
}

export const STRIKE = {
  name: 'strike',
  description: 'Strike Price',
  pattern: DECIMAL_REG
}

export const STRIKE_RATIO = {
  name: 'strike',
  description: 'Strike Price',
  formatHelp: '1025.99, 177, 149/150, 100.25/100.89',
  pattern: DECIMAL_RATIO_REG
}

export const VENUE = {
  name: 'venue',
  description: 'Venue',
  formatHelp: 'otc, listed',
  valuesHelp: [
    { value: 'otc', description: 'Venue' },
    { value: 'listed', description: 'Venue' },
  ],
  pattern: /^(otc|listed)$/i,
  required: false
};

export const DELTA = {
  name: 'delta',
  description: 'Delta',
  formatHelp: 'o/r, w/d, e/ds',
  valuesHelp: [
    { value: 'o/r', description: 'Delta' },
    { value: 'w/d', description: 'Delta' },
    { value: 'e/ds', description: 'Delta' }
  ],
  pattern: /^(o\/r|w\/d|e\/ds)$/i,
  required: false
};

export const MID = {
  name: 'mid',
  description: '12307mid Mid (OTC only)',
  formatHelp: '1023074mid',
  valuesHelp: [
    {value: '<value>mid', description: 'Mid (OTC only)', pattern: /^\d+(m|mi|mid)?$/}
  ],
  pattern: /^(\d)+mid$/i,
  required: false
}

export const MULTIPLIER = {
  name: 'multiplier',
  description: '100x Multiplier',
  formatHelp: '100x',
  valuesHelp: [
    {value: '<value>x', description: 'Multiplier', pattern: /^\d+(x)?$/}
  ],
  pattern: /^\d+x$/i,
  required: false
}
export const NOTIONAL = {
  name: 'notional',
  description: 'Notional',
  formatHelp: 'ntl',
  valuesHelp: [
    { value: 'ntl', description: 'Notional' }
  ],
  pattern: /^ntl$/i,
  required: false
}

export const LEI = {
  name: 'lei',
  description: 'xyzLE LEI',
  formatHelp: 'xyzLE',
  valuesHelp: [
    {value: '<entity>le', description: 'LEI', pattern: /^[a-z,\d]+(l|le)?$/}
  ],
  pattern: /^[a-z0-9]+le$/i,
  required: false
}

export const PCT_STRIKE = {
  name: 'pctStrike',
  description: 'Percentage Strike',
  formatHelp: 'pct',
  valuesHelp: [
    { value: 'pct', description: 'Pct Strike' }
  ],
  pattern: /^pct$/i,
  required: false
}