import React from 'react';
import { Component, View } from '@uitk/layout';

import './material-design.css';

export default {
  title: 'Layout/View',
  component: View,
};

export const ComponentWithBorderAndHeader = ({width = 500, height = 400}) =>
  <View
    title="Tye Boss" 
    header
    style={{
      width,
      height,
      padding: 20,
      border: '5px solid black',
      backgroundColor: 'yellow'
      }} >
    <Component />
  </View>
