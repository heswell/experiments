import { CommandType, TokenStyle } from '../command-bar';
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

export const VENUE = {
    name: 'venue',
    description: 'Venue',
    formatHelp: 'otc, listed',
    pattern: /^(otc|listed)$/i,
    required: false
};

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
