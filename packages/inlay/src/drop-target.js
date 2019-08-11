

import {BoxModel, positionValues} from './model/boxModel';
import {containerOf} from './model/layoutModel';

export default class DropTarget {

	constructor({component, pos/*, closeToTheEdge*/, nextDropTarget}){
	    this.component = component; 
	    this.pos = pos;
	    this.nextDropTarget = nextDropTarget;
	    this.active = false;       
	}

	activate(){
	    this.active=true;
	    return this;
	}

	static getActiveDropTarget(dropTarget){
	    return dropTarget.active ? dropTarget : DropTarget.getActiveDropTarget(dropTarget.nextDropTarget);
	}

	    // Initial entry to this method is always via the app (may be it should be *on* the app)
	static identifyDropTarget(x, y, model, dragState, measurements){

	     let dropTarget = null;
	   
	    //onsole.log('Draggable.identifyDropTarget for component  ' + box.name + ' (' + box.nestedBoxes.length + ' children)') ;
        // this could return all boxes containing point, which would make getNextDropTarget almost free
        // Also, if we are over  atabstrip, it could include the actual tab
	    var component = BoxModel.smallestBoxContainingPoint(model, measurements, x, y);
	    
	    if (component){
	        // onsole.log(`%cidentifyDropTarget target path ${component.$path}
	        //     position: ${JSON.stringify(component.$position)}
	        //     measurements : ${JSON.stringify(_measurements[component.$path])}
	        //     `,'color:cornflowerblue;font-weight:bold;');
	        const pos = BoxModel.pointPositionWithinRect(x,y,measurements[component.$path]);
            const nextDropTarget = getNextDropTarget(model, component, pos, dragState.constraint.zone, measurements, x, y);
	        dropTarget = new DropTarget({component, pos, nextDropTarget}).activate()
	    
	        // onsole.log('%c'+printDropTarget(dropTarget),'color:green');

	    }

	    //onsole.log(`\n${printDropTarget(dropTarget)}`);

	    return dropTarget;
	}

}

// must be cleared when we end the drag
// layout never changes
// component never changes
// pos neve changes
// zone enver changes
// measurements never change
export function getNextDropTarget(layout, component, pos, zone, measurements, x, y){

	const {north, south, east, west} = positionValues;
	const eastwest = east+west;
	const northsouth = north+south;

    return next();

    function next(container=containerOf(layout, component)){

        if (pos.position.Header || pos.closeToTheEdge){

            let nextDropTarget = false;

            // experiment...
            let containerPos = BoxModel.pointPositionWithinRect(x,y,measurements[container.$path]);

            while (container && positionedAtOuterContainerEdge(container, pos, component, measurements)){               
                //onsole.log(`${component.type} positioned at outer edge of container ${container.type}`);
                // if its a VBox and we're close to left or right ...
                if ((isVBox(container) || isTabbedContainer(container)) && (pos.closeToTheEdge & eastwest)){
                    nextDropTarget = true;
                    containerPos.width = 120;
                }
                // if it's a HBox and we're close to top or bottom ...
                else if ((isHBox(container) || isTabbedContainer(container)) && (pos.position.Header || (pos.closeToTheEdge & northsouth))){
                    nextDropTarget = true;
                    containerPos.height = 120;
                }
                if (nextDropTarget){
                    if (containerPos.position.Header){
                        containerPos = {...containerPos, position:north};    
                    }
                    // For each DropTarget, specify which drop operations are appropriate
                    return new DropTarget({
                        component:container, 
                        pos: containerPos, // <<<<  a local pos for each container
                        nextDropTarget: next(containerOf(layout, container))
                    });
                }

                container = containerOf(layout, container);
            }
        } 
    }
}

function positionedAtOuterContainerEdge(containingComponent, {closeToTheEdge,position}, component, measurements){
    
    const containingBox = measurements[containingComponent.$path]; 
    const box = measurements[component.$path];

    const closeToTop = closeToTheEdge & positionValues.north;
    const closeToRight = closeToTheEdge & positionValues.east;
    const closeToBottom = closeToTheEdge & positionValues.south;
    const closeToLeft = closeToTheEdge & positionValues.west;

    if ((closeToTop || position.Header) && box.top === containingBox.top) return true;
    if (closeToRight && box.right === containingBox.right) return true;
    if (closeToBottom && box.bottom === containingBox.bottom) return true;
    if (closeToLeft && box.left === containingBox.left) return true;

    return false
}

function isTabbedContainer({type}){
    return type === 'TabbedContainer';
}

function isVBox({type,style:{flexDirection}}){
    return type === 'FlexBox' &&  flexDirection === "column";
}

function isHBox({type, style:{flexDirection}}){
    return type === 'FlexBox' &&  flexDirection === "row";
}


// const w = '  ';

// function printDropTarget(dropTarget, s=w){

// 	const {pos} = dropTarget;
// 	const ctte = pos.closeToTheEdge ? `=>${printClose(pos.closeToTheEdge)}<=` : '';
//     const size = pos.width ? ` width:${pos.width} ` : pos.height ? ` height:${pos.height} ` : '';

//     var str = `<${dropTarget.component.type}> ${ctte} ${size} $${dropTarget.component.$path}`;
//     if (dropTarget.nextDropTarget != null){
//         str += `\n${s} ${printDropTarget(dropTarget.nextDropTarget,s+w)}` 
//     }
//     return str;
// }

// function printClose(val){
// 	var s = '';
// 	if (val & 1) s+= 'N';
// 	if (val & 4) s+= 'S';
// 	if (val & 2) s+= 'E';
// 	if (val & 8) s += 'W';
// 	return s;
// }

