import React from 'react';

import './order-book.css';

export default function ({ style }) {

  return (
    <div className="Orderbook" style={style}>
      <div className="toolbar" />
      <div className="depth-view">
        <div className="Header Row">
          <div className="Cell">My Vol</div>
          <div className="Cell">Volume</div>
          <div className="Cell">Bid</div>
          <div className="Cell">Ask</div>
          <div className="Cell">Volume</div>
          <div className="Cell">My Vol</div>
        </div>
        <div className="Row">
          <div className="Cell"></div>
          <div className="Cell"></div>
          <div className="Cell buy">132.6</div>
          <div className="Cell sell">136.3</div>
          <div className="Cell"></div>
          <div className="Cell"></div>
        </div>
        <div className="Row">
          <div className="Cell"></div>
          <div className="Cell"></div>
          <div className="Cell buy">136.1</div>
          <div className="Cell sell">136.4</div>
          <div className="Cell"></div>
          <div className="Cell"></div>
        </div>
        <div className="Row">
          <div className="Cell"></div>
          <div className="Cell"></div>
          <div className="Cell buy">136</div>
          <div className="Cell sell">136.5</div>
          <div className="Cell"></div>
          <div className="Cell"></div>
        </div>
        <div className="Row">
          <div className="Cell"></div>
          <div className="Cell"></div>
          <div className="Cell buy">135.9</div>
          <div className="Cell sell">136.6</div>
          <div className="Cell"></div>
          <div className="Cell"></div>
        </div>
        <div className="Row">
          <div className="Cell"></div>
          <div className="Cell"></div>
          <div className="Cell buy">135.8</div>
          <div className="Cell sell">136.7</div>
          <div className="Cell"></div>
          <div className="Cell"></div>
        </div>
        <div className="Row">
          <div className="Cell"></div>
          <div className="Cell"></div>
          <div className="Cell buy">135.7</div>
          <div className="Cell sell">136.8</div>
          <div className="Cell"></div>
          <div className="Cell"></div>
        </div>
        <div className="Row">
          <div className="Cell"></div>
          <div className="Cell"></div>
          <div className="Cell buy">135.6</div>
          <div className="Cell sell">136.9</div>
          <div className="Cell"></div>
          <div className="Cell"></div>
        </div>
        <div className="Row">
          <div className="Cell"></div>
          <div className="Cell"></div>
          <div className="Cell buy">135.5</div>
          <div className="Cell sell">137</div>
          <div className="Cell"></div>
          <div className="Cell"></div>
        </div>
        <div className="Row">
          <div className="Cell"></div>
          <div className="Cell"></div>
          <div className="Cell buy">135.4</div>
          <div className="Cell sell">137.1</div>
          <div className="Cell"></div>
          <div className="Cell"></div>
        </div>
        <div className="Row">
          <div className="Cell"></div>
          <div className="Cell"></div>
          <div className="Cell buy">135.3</div>
          <div className="Cell sell">137.2</div>
          <div className="Cell"></div>
          <div className="Cell"></div>
        </div>

      </div>
    </div>
  )
} 