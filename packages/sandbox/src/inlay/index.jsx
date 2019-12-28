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
import Layout9 from './sample-layouts/layout9.jsx';
import Layout10 from './sample-layouts/layout10.jsx';
import Layout11 from './sample-layouts/layout11.jsx';
import Layout12 from './sample-layouts/layout12.jsx';
import Layout13 from './sample-layouts/layout13.jsx';
import Layout14 from './sample-layouts/layout14.jsx';
import Layout15 from './sample-layouts/layout15.jsx';
import Layout16 from './sample-layouts/layout16.jsx';
import Layout17 from './sample-layouts/layout17.jsx';

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
    case 9: return Layout9(width, height);  /* Singleton FlexBox */
    case 10: return Layout10(width, height);  /* FlexBox, with Tree & Configutator */
    case 11: return Layout11(width, height);  /* Twin FlexBox */
    case 12: return Layout12(width, height);  /* Twin FlexBox, with header */
    case 13: return Layout13(width, height);  /* Twin FlexBox Application */
    case 14: return Layout14(width, height);  /* Quad FlexBox, children can be moved, removed */
    case 15: return Layout15(width, height);  /* Quad FlexBox, Flexbox shuffle */
    case 16: return Layout16(width, height);  /* Nested FlexBox */
    case 17: return <Layout17 width={width} height={height} />;  /* Layout Builder */
    default: return Layout1(width, height);
  }

}

import('stretch-layout').then((stretch) => {

  ReactDOM.render(
    <>
      <SampleLayout sample={13} />
    </>,
    document.getElementById('root')
  );

  
//   const { Allocator, Node, Display, AlignItems } = stretch;
//   const allocator = new Allocator();
 
//   const rootNode = new Node(allocator, {width: 600, height: 300, display: Display.Flex, alignItems: AlignItems.Stretch});

//   const childNodes = [
//     new Node(allocator, {flexShrink:1, flexGrow:1, flexBasis: 'auto'}),
//     new Node(allocator, {flexShrink:1, flexGrow:1, flexBasis: 'auto'})
//   ]
//   rootNode.addChild(childNodes[0]);
//   rootNode.addChild(childNodes[1]);

//   const computedLayout = rootNode.computeLayout();
 
//   logLayout(computedLayout)

// })

// function logLayout(computedLayout){
//   const {x, y, width, height, childCount} = computedLayout;
//   console.log(`x:${x}, y:${y}, width:${width}, height:${height}`);

//   for (let i=0;i<childCount; i++) {
//       logLayout(computedLayout.child(i));
//   };

});