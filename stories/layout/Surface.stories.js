import React from 'react';

import { Component, Surface} from '@heswell/layout';

export default {
  title: 'Layout/Surface',
  component: Surface
};

export const Empty = ({width = 500, height = 400}) =>
  <Surface style={{width,height,backgroundColor: 'brown'}}/>

export const SingleChild = ({width = 500, height = 400}) =>
  <Surface style={{width:800,height:300,backgroundColor: 'brown'}}>
    <Component
      title='R Component'
      header={true}
      style={{
        backgroundColor: 'yellow',
        left: 200,
        top:50,
        width: 100, 
        height: 100
        }}/>
  </Surface>
