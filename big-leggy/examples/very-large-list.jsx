import React from 'react';
import ReactDOM from 'react-dom';

import LargeScrollingList from '../src/very-large-grid/largeScrollingList';

ReactDOM.render(
  <>
    <LargeScrollingList height={900} rowHeight={25} rowCount={1000000}/>
  </>,
  document.getElementById('root'));
