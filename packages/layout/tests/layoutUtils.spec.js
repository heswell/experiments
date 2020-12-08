import React from 'react';
import { applyLayout } from '../src/layoutUtils';
import { typeOf } from '../src/utils'
import { DraggableLayout, Flexbox, Component } from '../index';

describe('applyLayout', () => {

  test('DraggableLayout root, empty', () => {
    const dispatch = () => undefined;
    const component = (
      <DraggableLayout style={{ width: 200, height: 100 }}>
      </DraggableLayout>
    )

    const { children, ...props } = applyLayout('DraggableLayout', component.props, dispatch);
    expect(props.path).toEqual("0")  
    expect(props.layoutId).toBeDefined();
    expect(props.dispatch).toEqual(dispatch);
    expect(children).toBeUndefined();  

  });

  test('DraggableLayout root, Flexbox child', () => {
    const dispatch = () => undefined;
    const component = (
      <DraggableLayout style={{ width: 200, height: 100 }}>
        <Flexbox style={{ flexDirection: 'row', width: '100%', height: '100%' }}>
          <div style={{ flex: 1 }} />
          <div style={{ flex: 1 }} />
        </Flexbox>
      </DraggableLayout>
    )

    const { children, ...props } = applyLayout('DraggableLayout', component.props, dispatch);
    expect(props.path).toEqual("0")  
    expect(props.layoutId).toBeDefined();
    expect(props.dispatch).toEqual(dispatch);
    expect(children.length).toEqual(1);  

    expect(children[0].props.layoutId).toBeDefined();
    expect(children[0].props.path).toEqual("0.0");
    expect(children[0].props.children.length).toEqual(2);

  });


  test('Flexbox root, element children', () => {
    const dispatch = () => undefined;
    const component = (
      <Flexbox style={{ flexDirection: 'row', width: 200, height: 100 }}>
        <div style={{ flex: 1 }} />
        <div style={{ flex: 1 }} />
      </Flexbox>
    )
    const { children, ...props } = applyLayout('Flexbox', component.props, dispatch);

    expect(props.layoutId).toBeDefined();
    expect(props.path).toEqual('0')
    expect(props.dispatch).toEqual(dispatch);

    expect(children[0].props.id).toBeDefined();
    expect(children[0].props.layoutId).toBeUndefined();
    expect(children[0].props.path).toBeUndefined();
    expect(children[0].props.dispatch).toBeUndefined()

    expect(children[1].props.id).toBeDefined();
    expect(children[1].props.layoutId).toBeUndefined();
    expect(children[1].props.path).toBeUndefined();
    expect(children[1].props.dispatch).toBeUndefined()

  });

  test('Flexbox root, Component children', () => {
    const dispatch = () => undefined;
    const component = (
      <Flexbox style={{ flexDirection: 'row', width: 200, height: 100 }}>
        <Component style={{ flex: 1 }} />
        <Component style={{ flex: 1 }} />
      </Flexbox>
    )
    const { children, ...props } = applyLayout('Flexbox', component.props, dispatch);

    expect(props.layoutId).toBeDefined();
    expect(props.path).toEqual('0')
    expect(props.dispatch).toEqual(dispatch);

    expect(children[0].props.layoutId).toBeDefined();
    expect(children[0].props.path).toEqual('0.0');
    expect(children[0].props.dispatch).toEqual(dispatch);

    expect(children[1].props.layoutId).toBeDefined();
    expect(children[1].props.path).toEqual('0.1');
    expect(children[1].props.dispatch).toEqual(dispatch);
  });

  test('DraggableLayout, Flexbox layout root, Component children', () => {
    const dispatch = () => undefined;
    const component = (
      <DraggableLayout>
        <Flexbox style={{ flexDirection: 'row', width: 200, height: 100 }}>
          <Component style={{ flex: 1 }} />
          <Component style={{ flex: 1 }} />
        </Flexbox>
      </DraggableLayout>
    )

    const { children } = applyLayout('DraggableLayout', component.props, dispatch);
    expect(children.length).toEqual(1);
    const [flexbox] = children;

    expect(typeOf(flexbox)).toEqual('Flexbox');
    expect(flexbox.props.path).toEqual('0.0');
    expect(flexbox.props.layoutId).toBeDefined();
    expect(flexbox.props.dispatch).toEqual(dispatch);  
    const {props: {children: flexChildren}} = flexbox;

    expect(flexChildren[0].props.layoutId).toBeDefined();  
    expect(flexChildren[0].props.path).toEqual('0.0.0');  
    expect(flexChildren[0].props.dispatch).toEqual(dispatch);  

    expect(flexChildren[1].props.layoutId).toBeDefined();  
    expect(flexChildren[1].props.path).toEqual('0.0.1');  
    expect(flexChildren[1].props.dispatch).toEqual(dispatch);  
  });


})
