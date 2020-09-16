import React, { useRef } from 'react';
import cx from 'classnames';
import { useComponentRegistry } from '../registry/component-registry';
import LayoutItem from './layout-item';
import rootWrapper from './layout-root-wrapper';
import {registerClass, typeOf, isLayout} from '../component-registry';
import { Action } from '../model/layout-reducer';
import { componentFromLayout } from '../util/component-from-layout-json';

/** @type {TabbedContainerComponent} */
export default function TabbedContainer(props){

    const {layoutModel, dispatch, onTabSelectionChanged} = props;

    //  TODO
    if (layoutModel === undefined){
        // this causes problems DO NOT USE 
        return rootWrapper(TabbedContainer, props);
    }

    const el = useRef(null);

    const Tabstrip = useComponentRegistry('Tabstrip');
    const Tab = useComponentRegistry('Tab');

    const onMouseDown = (evt, model=layoutModel) => {
        evt.stopPropagation();
        const dragRect = el.current.getBoundingClientRect();
        dispatch({type: Action.DRAG_START, evt, layoutModel: model, dragRect });
    }

    const handleTabSelection = (e, nextIdx) => {
        console.log(`handleTabSelection newSelectedIdx=${nextIdx}`);
        dispatch({type: Action.SWITCH_TAB, path: layoutModel.$path, nextIdx });

        if (onTabSelectionChanged){
            onTabSelectionChanged(nextIdx);
        }
    }

    function closeTab(idx){
        dispatch({type: Action.REMOVE, layoutModel: layoutModel.children[idx]});
    }

    const tabs = () => layoutModel.children.map((child,idx) =>
        <Tab key={idx} label={titleFor(child)} onMouseDown={e => onMouseDown(e,child)} onClose={closeTab}/>
    );

    const {$id, computedStyle, active} = layoutModel;
    const className = cx('TabbedContainer', props.className );
    return (
        <div id={$id} ref={el} className={className} style={computedStyle}>
            <Tabstrip className='header'
                // we used to store a 'ref' here
                // TODO use layoutModel.header
                style={{position: 'absolute',top: 0,left: 0, width: computedStyle.width, height: 26}}
                draggable={true} // To be investigated
                value={active}
                onMouseDown={onMouseDown}
                onChange={handleTabSelection}>{tabs()}</Tabstrip>
            {renderChildren()}
        </div>
    );

    function renderChildren(){
        const {active=0, children: {[active]: childLayoutModel}} = layoutModel;        
        const {children: {[active]: propsChild}} = props;

        // essentiallybthe same logic as flexbox - look to reuse
        const child = typeOf(propsChild) === childLayoutModel.type
            ? propsChild
            : componentFromLayout(childLayoutModel);

        const layoutProps = {
            key: childLayoutModel.$id,
            layoutModel: childLayoutModel,
            dispatch
        };

        if (isLayout(child)){
            return React.cloneElement(child, {...layoutProps});
        } else {
            return <LayoutItem {...child.props} {...layoutProps}>{child}</LayoutItem>;
        }
    }
}

registerClass('TabbedContainer', TabbedContainer, true);

function titleFor(component){
    return (component.props && component.props.title) || 'Tab X';
}
