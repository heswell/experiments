import React from 'react';
import Grid from '../../../src/@heswell/ingrid/grid';
import { FlexBox } from '../../../src/@heswell/inlay';
import { Titlebar } from '../../../src/@algo'

import './order-book.css';

const columns = [
  { name: 'Id', hidden: true },
  { name: 'ISIN', hidden: true },
  { name: 'Level', hidden: true },
  { name: 'Bid Party', width: 100},
  { name: 'Bid Volume', width: 120, type: 'number'},
  {
    name: 'Bid',
    width: 80,
    className: 'bid',
    type: {
      name: 'number',
      formatting: { decimals: 2, zeroPad: true }
    }
  },
  {
    name: 'Ask',
    width: 80,
    className: 'ask',
    type: {
      name: 'number',
      formatting: { decimals: 2, zeroPad: true }
    }
  },
  { name: 'Ask Volume', width: 120, type: 'number' },
  { name: 'Ask Party', width: 100 },
]

export default function ({
  style,
  instrumentName,
  dataView
}) {

  return (
    <FlexBox style={style}>
      <Titlebar style={{ height: 70}}>
        <div className="orderbook-header">
            <div className="col">
              <div className="data-row instrument"><span className="label">Name</span><span>VODAFONE GROUP PLC</span></div>
              <div className="data-row"><span className="label">Last</span><span>136.2</span></div>
              <div className="data-row"><span className="label">Change</span><span className="negative">-1 (0.7%)</span></div>
            </div>
            <div className="col">
              <div className="best-bid-ask">
                <span>136.2</span>
                <span className="separator">-</span>
                <span>136.3</span>
              </div>
              <div className="total-vol"><span>5,581,075</span></div>
            </div>
            <div className="col">
              <div className="data-row"><span className="label">Open</span><span>136.3</span></div>
              <div className="data-row"><span className="label">High</span><span>136.5</span></div>
              <div className="data-row"><span className="label">Low</span><span>135</span></div>
            </div>
        </div>
      </Titlebar>
      <Grid
        className="OrderBook"
        showHeaders={false}
        style={{ flex: 1 }}
        dataView={dataView}
        columns={columns}
      />
    </FlexBox>
  )
} 