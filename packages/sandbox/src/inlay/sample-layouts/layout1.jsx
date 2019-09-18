import React from 'react';
import { LayoutItem, Component } from '@heswell/inlay';

export default (width = 500, height = 400) =>
  <LayoutItem style={{width,height,backgroundColor: 'yellow'}}>
    <Component />
  </LayoutItem>