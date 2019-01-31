"use strict";

import shallowCloneObject from './util/shallowCloneObject';
import {transform} from './util/jsonUtils';
import {adjustPath, 
    followPath, 
    followPathToParent} from './util/pathUtils';
import {getJSON} from './util/componentUtils';
import LayoutModel from './util/LayoutModel'



export default function Layout(){

}

Layout.handleLayout = handleLayout;
Layout.dropLayout = dropLayout;
Layout.resizeLayout = resizeLayout;
Layout.removeLayout = removeLayout;
Layout.minimize = minimize;
Layout.maximize = maximize;
Layout.restore = restore;
Layout.config = config;
Layout.tab = tab;

var Dimensions = {
    row : 'width',
    column : 'height'
}

function  handleLayout(layout, command, options){

        if (command === 'resize'){
            return resizeLayout(layout, options);
        }
        else if (command === 'drag-start'){
            // just need to set dragging to the correct idx
            //json = Layout.config(json, options);
            console.log(`ThreeGrids.onLayout drag-start ${options.dragging}`);
            return;
        }
        else if (command === 'config-change'){
            return Layout.config(layout, options);
        }
        else if (command === 'switch-tab'){
            return tab(layout, options);
        }
        else if (command === 'remove'){
            return removeLayout(layout, options);
        }
        else if (command === 'minimize'){
            return Layout.minimize(layout, options);
        }
        else if (command === 'maximize'){
            return Layout.maximize(layout, options);
        }
        else if (command === 'restore'){
            return Layout.restore(layout, options);
        }
        else {  
            console.log('%cdrop component ' + options.layout.id,'color:blue')
            return dropLayout(layout, options);
        }

}

function restore(layout, {path}){
    return config(layout,{path, properties:{state:0}});
}

function minimize(layout, {path}){
    return config(layout,{path, properties:{state:1}});
}

function maximize(layout, {path}){

    return config(layout,{path, properties:{state:2}});
}

function config(layout, {path, properties}){

    var target = followPath(layout, path);
    return layout.replace(target, target.set(properties));

}

function tab(layout, {path, idx, nextIdx}){

    var container = followPath(layout, path);
    var content = container.layout.slice();

    // we need to set height of slected child, even if it is not needed for 
    // rendering - children will inherit the value;
    content[nextIdx] = content[nextIdx].set({height: content[idx].height});
    content[idx] = content[idx].set({height:0});

    var newContainer = container.set({active:nextIdx,layout:content});

    return layout.replace(container, newContainer);

}

function resizeLayout(layout1, {path, measurements, dimension}){

    //onsole.log(`%cLayout.resizeLayout new measurements:\n${JSON.stringify(measurements)}\n`,
    //            'color:blue;font-weight:bold;');

    var target =  followPath(layout1, path);
    var children = target.children.slice();

    children.forEach((targetChild,idx) => {
        // if (measurements[idx][dimension] !== targetChild[dimension]){
        //     var {top,left,width,height} = measurements[idx];
        //     // set state to 0 to de-minimize
        //     var {top:t,left:l,width:w,height:h,flex:f, ...rest} = targetChild.style;
        //     children[idx] = targetChild.clone({state:0,style:{...rest,top,left,width,height}});
        // }
        //TODO if child flex is zero leave
        var size = measurements[idx][dimension]
        if (size !== targetChild.flex){
            var {width,height} = measurements[idx];
            // set state to 0 to de-minimize
            var {width:w,height:h,flex:f, ...rest} = targetChild.style;
            children[idx] = targetChild.clone({state:0,style:{...rest,flex:size,width,height}});
        }
    });

    return layout1.replace(target, target.clone({children}));

}

function removeLayout(layout, {layout:source, path}){

    if (path){
        source = followPath(layout, path);
    }


    return LayoutModel.transform(layout,{
        remove: {node: source}
    });
}

function dropLayout(layout, {layout: source, dropTarget:{component:target, pos},  measurements, releaseSpace}){

    // console.log(`%cLayout.dropLayout\n${JSON.stringify(source,null,2)}\n...onto...\n${JSON.stringify(target,null,2)}`,
    //     'color:blue;font-weight:bold;')

    // note: source may not always have a container, may be a palette icon etc
    var targetContainer = followPathToParent(layout, target.path);

    // console.log(`%cLayout.dropLayout\n${JSON.stringify(sourceContainer,null,2)}\n...onto...\n${JSON.stringify(targetContainer,null,2)}`,
    //     'color:green;font-weight:bold;')

    if (pos.position.Header){ // case 2)

        if (target.type === 'TabbedContainer'){ console.log('CASE 2 Works)');
            var after = target.children[target.children.length-1];    
            var opts = { insert: {source, after} };

             return LayoutModel.transform(layout,opts);

        }
        else { 
            console.log('CASE 2B Works)'); 
            return LayoutModel.transform(layout, { wrap: {target, source, pos },measurements}); 
        }
    
    }
    else { 
        // case 4)
        return dropLayoutIntoDifferentContainer(layout, pos, source, target, targetContainer, releaseSpace, measurements);
    }  

    return layout;

}

function dropLayoutIntoDifferentContainer(layout, pos, source, target, targetContainer, releaseSpace, measurements){

    if (target === layout || isDraggableRoot(layout, target)){ 
        // Can only be against the grain...
        if (withTheGrain(pos, target)){
            throw('How the hell did we do this');
        }
        else { console.log('CASE 4A) Works');
            return transform(layout, { wrap: {target, source, pos }, releaseSpace}); 
        }
    }
    else if (withTheGrain(pos, targetContainer)){
        // Insert into a new container, with the grain
        if (pos.position.SouthOrEast){ 
            console.log('CASE 4B) Works');

            var opts = { releaseSpace, insert: {source, after: target, pos} };

            return LayoutModel.transform(layout, opts);
            //json = insertAfter(json, target, source);
        }
        else { 
            console.log('CASE 4C) Works');

            var opts = { releaseSpace, insert: {source, before: target}, measurements };

            return LayoutModel.transform(layout,opts);
        }
    }
    else if (againstTheGrain(pos, targetContainer)){ 
        console.log('CASE 4D) Works.');
        return LayoutModel.transform(layout, { wrap: {target, source, pos }, measurements, releaseSpace}); 
    }
    else if (isContainer(targetContainer)){
        console.log('CASE 4) Works.');
        return LayoutModel.transform(layout, { wrap: {target, source, pos }, measurements, releaseSpace}); 
    }
    else {
        console.log('no support right now for position = ' + pos.position);
    }
    return layout;



}


function isDraggableRoot(layout, component){

    if (component.path === '0'){
        return true;
    }

    var container = LayoutModel.containerOf(layout, component);
    if (container){
        return container.type === 'App';
    }
    else {
        debugger;
    }
}

// Note: withTheGrain is not the negative of againstTheGrain - the difference lies in the 
// handling of non-Flexible containers, the response for which is always false;
function withTheGrain(pos, container){

    return pos.position.NorthOrSouth ?  isTower(container)    
         : pos.position.EastOrWest   ?  isTerrace(container)
         : false;
}

function againstTheGrain(pos, layout){
    
    return pos.position.EastOrWest   ?  isTower(layout)  || isTabset(layout)  
         : pos.position.NorthOrSouth ?  isTerrace(layout) || isTabset(layout) 
         : false;

}

function isContainer(layout){
    return layout.type === 'Container';
}

function isTabset(layout){
    return layout.type === "TabbedContainer";
}

function isTower(layout){
    return layout.type === "FlexBox" && layout.style.flexDirection === "column";
}

function isTerrace(layout){
    return layout.type === "FlexBox" && layout.style.flexDirection === "row";
}


function contains({content}, target){
        
    if (Array.isArray(content)){
        for (var i=0;i<content.length;i++){
            if (content[i] === target){
                return true;
            }
            else if (contains(content[i],target)){
                return true;
            }
        }
    }
    
    return false;

}