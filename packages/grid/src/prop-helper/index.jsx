import React, {Suspense} from 'react';

const PropHelper = React.lazy(() => import('./GridPropHelper'));

export default (props) => 
  <Suspense fallback={<div>Loading ...</div>}>
    <PropHelper {...props}/>
  </Suspense>
