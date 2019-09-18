import React from 'react';
import ReactDOM from 'react-dom';
import Layout1 from './sample-layouts/layout1.jsx';
import Layout2 from './sample-layouts/layout2.jsx';
import Layout3 from './sample-layouts/layout3.jsx';
import Layout4 from './sample-layouts/layout4.jsx';
import Layout5 from './sample-layouts/layout5.jsx';
import Layout6 from './sample-layouts/layout6.jsx';
import Layout7 from './sample-layouts/layout7.jsx';
import Layout8 from './sample-layouts/layout8.jsx';

const SampleLayout = ({ sample, width, height }) => {

  switch (sample) {
    case 1: return Layout1(width, height);  /* Component */
    case 2: return Layout2(width, height);  /* Surface, no children */
    case 3: return Layout3(width, height);  /* Surface, single child */ 
    case 4: return Layout4(width, height);  /* Application, single child */
    case 5: return Layout5(width, height);  /* Tower > Terrace, with margins and Borders */
    case 6: return Layout6(width, height);  /* Complex nested layout */
    case 7: return Layout7(width, height);  /* DynamicContainer (static content), within FlexBox */
    case 8: return Layout8(width, height);  /* DynamicContainer (JSON content), within FlexBox */
    default: return Layout1(width, height);
  }

}



ReactDOM.render(
  <>
    <SampleLayout sample={6} />
  </>,
  document.getElementById('root'));
