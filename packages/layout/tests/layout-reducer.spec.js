import React from 'react';
import { applyLayout } from '../src/layoutUtils';
import { DraggableLayout, Flexbox, Component, Stack, View } from '../index';
import LayoutReducer from '../src/layout-reducer';
import { Action } from '../src/layout-action';
import {followPath} from '../src/utils/pathUtils';
import {typeOf} from '../src/utils/typeOf';

describe('LayoutReducer', () => {

  it('applies splitter changes to children ', () => {
    const component = (
      <Flexbox style={{flexDirection: 'row', width: 200, height: 100}}>
        <Component style={{flex:1}}/>
        <Component style={{flex:1}}/>
      </Flexbox>
    );
    const props = applyLayout('Flexbox', component.props);
    const {children: [c1, c2]} = LayoutReducer(props, {
      type: Action.SPLITTER_RESIZE, 
      path: '0', 
      sizes: [50, 150]
    });
    expect(c1.props.style).toEqual({flexBasis: 50, flexGrow: 1, flexShrink: 1, width: 'auto'})
    expect(c2.props.style).toEqual({flexBasis: 150, flexGrow: 1, flexShrink: 1, width: 'auto'})
  });

  it('updates active when stack switched ', () => {
    const component = (
      <Stack active={0} style={{flexDirection: 'row', width: 200, height: 100}}>
        <Component style={{flex:1}}/>
        <Component style={{flex:1}}/>
      </Stack>
    );
    const props = applyLayout('Flexbox', component.props);
    const {children: [child1, child2]} = props;  

    const {active, children: [c1, c2]} = LayoutReducer(props, {
      type: Action.SWITCH_TAB,
      path: '0',
      nextIdx: 1 
    });

    expect(active).toEqual(1);
    // Children should not be changed by this operation
    expect(c1 === child1).toEqual(true);
    expect(c2 === child2).toEqual(true);
  })

  describe('drag drop', () => {

    let layoutState;
    let draggable;

    beforeEach(() => {

      draggable = <Component key={12345} title="Draggable"/>;

      /**
       This is our initial structure onto which we are going to drop our draggable

        
      ┌┄┄┄┄─Flexbox 0 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┐
      ┊           ┌┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ Flexbox 0.1.0 ┈┈┈┈┈┈┈┈┈┈┈┐
      ┊   ┌───────┬────────────────────────┬──────────────────────────┐ ┊    ┐
      ┊   │  0.0  │        0.1.0.0         │        0.1.0.1           │ ┊    ┊
      ┊   │       │                        │                          │ ┊    ┊
      ┊   │       │                        │                          │ ┊  Flexbox  0.1
      ┊   │       │                        │                          │ ┊    ┊
      ┊   │       │                        │                          │ ┊    ┊ 
      ┊   │       ├────────────────────────┴──────────────────────────│ ┘    ┊ 
      ┊   │       │        0.1.1                                      │      ┊ 
      ┊   │       │                                                   │      ┊ 
      ┊   │       │                                                   │      ┊ 
      ┊   │       │                                                   │      ┊ 
      ┊   │       │                                                   │      ┊ 
      └   └───────┴───────────────────────────────────────────────────┘      ┊
                                                                             ┊                                            
                  └┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┘
                
        
       */
      const elementTree = (
        <DraggableLayout>
          <Flexbox style={{ width: 800, height: 500, flexDirection: 'row' }}>
            <View header resizeable title='Test 1'>
              <Component style={{ flex: 1, backgroundColor: 'yellow' }}/>
            </View>
            <Flexbox style={{ flex: 1, flexDirection: 'column' }} resizeable>
              <Flexbox style={{ flex: 2, flexGrow: 1, flexShrink: 1, flexDirection: 'row' }} resizeable>
                  <View header resizeable title='Test 2' style={{flex: 1}}>
                    <Component style={{ height: '100%', backgroundColor: 'orange' }}/>
                  </View>
                <View header resizeable title='Test 4' style={{flex: 1}}>
                  <Component style={{ height: '100%', backgroundColor: 'rebeccapurple' }}  />
                </View>
              </Flexbox>
              <View header resizeable title='Test 5' style={{flex: 1}}>
                <Component style={{ height: '100%', backgroundColor: 'blue' }} />
              </View>
            </Flexbox>
          </Flexbox>
        </DraggableLayout>        
      )

      layoutState = applyLayout('DraggableLayout', elementTree.props);
    })

    it('creates a Tabbed Stack wrapper when dropped onto View Header', () => {
      // simulate the drag-start, which stores the draggable component as prop

      const layout = React.cloneElement(layoutState, {
        drag: {draggable}
      });

      // TODO use followPath
      const target = followPath(layoutState, "0.1.1");

      const state = LayoutReducer(layout, {
        type: Action.DRAG_DROP,
        dropTarget: {
          pos: {position: {Header: true}}, 
          component: target
        }
      });
  
      const {props:{children: [flexBox, stack]}} = followPath(state, "0.1");
      expect(typeOf(flexBox)).toEqual('Flexbox');
      expect(typeOf(stack)).toEqual('Stack');
      expect(stack.props.children.length).toEqual(2);
      expect(stack.props.active).toEqual(1);

      expect(stack.props.style).toEqual({
        flexBasis: 0,
        flexGrow: 1,
        flexShrink: 1,
        flexDirection: 'column'
      });

      const {props: {children: [view, component]}} = stack;
      expect(view.props.path).toEqual("0.1.1.0")
      expect(view.props.title).toEqual("Test 5")
      expect(component.props.path).toEqual("0.1.1.1")
      expect(component.props.title).toEqual("Draggable");

      const expectedStyle = {
        flexBasis: 0,
        flexGrow: 1,
        flexShrink: 1,
        width: 'auto',
        height: 'auto'
      }
      expect(view.props.style).toEqual(expectedStyle);
      expect(component.props.style).toEqual(expectedStyle);

    });

  })



})
