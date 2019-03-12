import { storiesOf } from '@storybook/react';
import * as React from 'react';
import * as ReactDOM from 'react-dom'
import LargeScrollingList from './largeScrollingList'
import './index.css'

storiesOf('Virtual Scrolling', module)
.add('Very large list', () => {
  return <LargeScrollingList height={500} rowHeight={50}/>
})