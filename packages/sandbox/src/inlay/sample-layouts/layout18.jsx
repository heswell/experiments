import React from 'react';
import { Application, DynamicContainer, FlexBox, Component } from '@heswell/inlay';

export default (width = 500, height = 400) =>
    <FlexBox style={{ width: 800, height: 500, flexDirection: 'row' }}>
        <Component title='Y Component' style={{ flex: 1, backgroundColor: 'yellow' }} header resizeable />
        <FlexBox style={{ flex: 1, flexDirection: 'column' }} resizeable>
            <FlexBox style={{ flex: 2, flexDirection: 'row' }} resizeable>
                <FlexBox style={{ flex: 1, flexDirection: 'column' }} resizeable>
                    <Component title='B Component' style={{ flex: 1, backgroundColor: 'orange' }} header resizeable />
                    <Component title='R Component' style={{ flex: 1, backgroundColor: 'brown' }} header resizeable />
                </FlexBox>
                <Component title='R Component' style={{ flex: 1, backgroundColor: 'rebeccapurple' }} header resizeable />
            </FlexBox>
            <Component title='B Component' style={{ flex: 1, backgroundColor: 'blue' }} header resizeable />
            <Component title='R Component' style={{ flex: 1, backgroundColor: 'red' }} header resizeable />
        </FlexBox>
    </FlexBox>
