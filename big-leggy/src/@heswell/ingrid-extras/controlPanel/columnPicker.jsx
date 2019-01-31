import React from 'react';
import ReactDOM from 'react-dom';
import {Motion, spring} from 'react-motion';
import {FlexBox} from '@heswell/finlay';
import ColumnList from './columnList';
import {springConfig, springConfigFast, listStyle, checkLayout, dragOffsets, moveItemWithinList} from './listUtils';

const NULL_DRAGGED = {item: null};

const initColumn = column => ({
    name: column.name,
    column,
    inUse: false
});

const setColumn = map => column => ({
    name: column.name,
    column,
    inUse: map[column.name] === true
});

function switchTargetList(item, fromList, toList, targetPosition){

    const items1 = fromList.items.filter(i => i !== item);
    const items2 = toList.items.slice();

    items2.splice(targetPosition,0,item);

    return [{...fromList, onTarget: false, items: items1}, {...toList, onTarget: true, items: items2}];
}

function clearTargetList(item, fromList){
    const items = fromList.items.filter(i => i !== item);
    return {...fromList, onTarget: false, items};
}

function getAvailableItems(availableItems, list1, list2){
    const toMapOfNames = (map,item) => (map[item.name] = true, map);
    const mapOfNames = list1.concat(list2).reduce(toMapOfNames,{});
    return availableItems.map(setColumn(mapOfNames));
}

export default class ColumnPicker extends React.Component {

    constructor(props) {
        super(props);

        const columns = props.availableColumns.map(initColumn);
        this.state = {
            dragged: NULL_DRAGGED,
            list0: { rect: null, items: columns },
            list1: { rect: null, items: [], onTarget: false },
            list2: { rect: null, items: columns, onTarget: false }
        };
    }

    render() {
        const {list1, list2, dragged, selectedColumn, dragged: {origin}} = this.state;
        const {dragging, zeroDrag, droppedOnTarget, mouseMoveX, mouseMoveY, dragStartLeft, dragStartTop} = this.state;
        const onRest = dragging ? undefined : this.removeDraggedItemFromAvailableList;
        
        let draggedItem = null;
        let dragStyle;

        if (dragged.item){
            const originList = this.state[origin];

            if (droppedOnTarget){
                const targetList = list1.onTarget ? list1 : list2;
                const idx = targetList.items.indexOf(dragged.item);
                const width = spring(targetList.rect.right - targetList.rect.left, springConfig);
                const x = spring(targetList.rect.left - dragStartLeft, springConfig);
                const y = spring(targetList.rect.top - dragStartTop + (idx*24), springConfig);
                dragStyle = listStyle(1,1,x,y,width);
            }
            else {
                const posX = originList.dragOffsetX + mouseMoveX;
                const posY = originList.dragOffsetY + mouseMoveY;
                const width = dragged.rect.width;
                const rmConfig = zeroDrag ? springConfigFast : springConfig;
                // console.log(`drop in place dragging ${dragging}   zeroDrag ${zeroDrag}`);
                dragStyle = dragging
                    ? listStyle(1.01,16,posX, posY, width)
                    // TODO No Drop - return to base - need to remove node at end (should fade transparency)
                    // TODO remove draggee from list at end
                    // TODO If the item has not been dragged - animate it more quickly back into place
                    : listStyle(1,1,spring(originList.dragOffsetX, rmConfig),spring(originList.dragOffsetY, rmConfig), width);
            }

            draggedItem = (
                <Motion style={dragStyle} key="dragged" onRest={onRest}>
                    {({scale,shadow,x,y, w}) =>
                        // x === dragOffsetX 
                        // ? null : 
                        <div className="ListItem dragging"
                            style={{
                                position: 'absolute',
                                width: w,
                                boxShadow: `rgba(0, 0, 0, 0.2) 0px ${shadow}px ${2 * shadow}px 0px`,
                                transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
                                zIndex: 99
                            }}>
                            <span>{`${dragged.item.name}`}</span>
                        </div>
                    }
                </Motion>
            );
        }

        const {style} = this.props

        return (
            <div className='ColumnPicker' style={style}>
                <div key='list' className="List" ref={c => this.dragHolsterEl = ReactDOM.findDOMNode(c)}style={{width: 0}}>{draggedItem}</div>
                <FlexBox className='ColumnPicker' key='picker' style={{...style, top: 0, flexDirection: 'column', padding: 1, borderWidth: 1}} id='col-picker' title='Columns' header={{height: 24, menu: false}}>
                    <ColumnList name="list1" style={{height: 50}} flexible={true}
                        ref={c => this.list1el = ReactDOM.findDOMNode(c)} items={list1.items}
                        onMouseDown={this.handleDragStart}
                        dragged={list1.onTarget ? dragged : NULL_DRAGGED}
                        onItemAction={this.handleItemAction} />
                    <ColumnList name="list2" style={{flex: 1, borderWidth: 1}} flexible={true}
                        ref={c => this.list2el = ReactDOM.findDOMNode(c)}
                        items={list2.items} selectionModel='multiple'
                        onMouseDown={this.handleDragStart}
                        dragged={list2.onTarget ? dragged : NULL_DRAGGED}
                        onItemAction={this.handleItemAction}
                        selectedItem={selectedColumn}
                        onSelectionChange={this.handleSelectionChange} />
                </FlexBox>
            </div>
        )
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.availableColumns !== this.props.availableColumns){
            const columns = nextProps.availableColumns.map(initColumn);
            this.setState({
                list0: {
                    ...this.state.list0,
                    items: columns
                },
                list2: {
                    ...this.state.list2,
                    items: columns
                }
            });
        }
    }

    handleItemAction = (item,componentName) => {

        const {list0, list1, list2} = this.state;
        let items;

        if (componentName === 'list0'){
            items = list2.items.concat(item.column);
            this.setState({
                list0: {
                    ...list0,
                    items: getAvailableItems(this.props.availableColumns, list1.items, items)
                },
                list2: {...list2,items}});

        }
        else {

            const list = this.state[componentName];
            items = list.items.filter(col => col !== item);
            const lists = list === list1 ? [items, list2.items] : [list1.items,items];

            this.setState({
                list0: {
                    ...list0,
                    items: getAvailableItems(this.props.availableColumns, ...lists)
                },
                [componentName]: {
                    ...list,
                    items
                }
            });
        }

        this.props.onChange('columns',list1.items.concat(items).map(col => col.name));

    };

    handleDragStart = (componentName, item, rect, x, y) => {

        const lastDraggedItem = this.state.dragged.item;
        const {left: dragStartLeft, top: dragStartTop} = this.dragHolsterEl.getBoundingClientRect();
        const list0 = checkLayout(this.state.list0, this.list0el);
        const list1 = checkLayout(this.state.list1, this.list1el);
        const list2 = checkLayout(this.state.list2, this.list2el);
        const idx = this.state.list0.items.indexOf(lastDraggedItem);
        if (idx !== -1){
            this.state.list0.items.splice(idx,1);
        }

        // If we are dragging from the available list, and we want used items to remain in
        // this list (the only option right now), inject a duplicate into the list which
        // will be the dragged item. We will remove the duplicate on drag end.
        const draggedItem = componentName === 'list0' ? {...item} : item;
        const items0 = componentName === 'list0'
            ? list0.items.concat(draggedItem)
            : list0.items;

        this.setState({
            dragDirection: componentName === 'list0' ? 'any' : 'vertical',
            dragStartLeft,
            dragStartTop,
            dragged: {
                item: draggedItem,
                origin: componentName,
                rect,
                // offset of exact mouse position from item left,top
                offetX: x - rect.left,
                offsetY: y - rect.top,
                startX: x,
                startY: y
            },
            mouseMoveX: 0,
            mouseMoveY: 0,
            dragging: true,
            dropped: false,
            droppedOnTarget: false,
            list0: {...list0, items: items0, ...dragOffsets(list0, rect, dragStartLeft, dragStartTop)},
            list1: {...list1, onTarget: componentName === 'list1', ...dragOffsets(list1, rect, dragStartLeft, dragStartTop)},
            list2: {...list2, onTarget: componentName === 'list2', ...dragOffsets(list2, rect, dragStartLeft, dragStartTop)}
        });

        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mouseup', this.handleMouseUp);

    }

    handleMouseMove = ({pageX, pageY}) => {
        let {
            dragged: {startX, startY, item, origin},
            list0,
            list1,
            list2} = this.state;

        const LIST_1 = 'list1';
        const LIST_2 = 'list2';
        const onTarget = true;
        const NO_TARGET = '';
        const wasOnTarget = list1.onTarget || list2.onTarget;
        const [listName,listState] = this.containsPoint(list1.rect, pageX, pageY)
            ? [LIST_1,list1]
            : this.containsPoint(list2.rect, pageX, pageY)
                ? [LIST_2,list2]
                : [NO_TARGET,false];

        // 1) was not on target, is now onTarget list1 or list2
        if (!wasOnTarget && listName !== NO_TARGET){
            let pos = Math.floor((pageY - listState.rect.top) / 24);
            let items = listState.items.slice();
            items.splice(pos,0,item);
            // if origin was list0, splice the draggee out of there - target will render the draggee
            if (origin === 'list0'){
                list0 = {...list0, items: list0.items.filter(i => i !== item)};
            }
            this.setState({
                list0,
                [listName]: {...listState, onTarget, items}
            });
        }
        // 3) was onTarget List1 now not onTarget
        else if (list1.onTarget && listName === NO_TARGET){
            if (origin === 'list0'){
                list0 = {...list0, items: list0.items.concat(item)};
            }
            this.setState({
                list0,
                list1: clearTargetList(item, list1)
            });
        }
        // 4) was onTarget List2 now not onTarget
        else if (list2.onTarget && listName === NO_TARGET){
            if (origin === 'list0'){
                list0 = {...list0, items: list0.items.concat(item)};
            }
            this.setState({
                list0,
                list2: clearTargetList(item, list2)
            });
        }
        // 5) was onTarget List1 now onTarget List2
        else if (list1.onTarget && listName === LIST_2){
            const targetPosition = Math.floor((pageY - list2.rect.top) / 24);
            ([list1, list2] = switchTargetList(item,list1,list2,targetPosition));
            this.setState({list1, list2});
        }
        // 6) was onTarget List2 now onTarget List1
        else if (list2.onTarget && listName === LIST_1){
            const targetPosition = Math.floor((pageY - list1.rect.top) / 24);
            ([list2, list1] = switchTargetList(item,list2,list1,targetPosition));
            this.setState({list1, list2});
        }
        // 7) was onTarget List1/List2, still onTarget same target
        else if ((list1.onTarget && listName === LIST_1) || (list2.onTarget && listName === LIST_2)){
            const targetPosition = Math.floor((pageY - listState.rect.top) / 24);
            const newList = moveItemWithinList(item, listState, targetPosition);
            if (newList !== listState){
                this.setState({[listName]: newList});
            }
        }

        // if (dragDirection === 'vertical'){
        //     this.setState({mouseMoveX: 0, mouseMoveY: pageY - startY, pageX, pageY });
        // }
        // else {
        this.setState({mouseMoveX: pageX - startX, mouseMoveY: pageY - startY, pageX, pageY});

        // }
    }

    handleMouseUp = ({pageX, pageY}) => {

        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mouseup', this.handleMouseUp);

        const {list0, list1, list2, dragged: {item, startX, startY}} = this.state;

        const zeroDrag = startX === pageX && startY === pageY;

        // The reason we add the dragged item back in is so we can animate it out of
        // the picture if not onTarget
        const items = list1.onTarget || list2.onTarget
            ? getAvailableItems(this.props.availableColumns, list1.items, list2.items)
            : getAvailableItems(this.props.availableColumns, list1.items, list2.items).concat(item);

        this.setState({
            dragging: false,
            dropped: true,
            zeroDrag,
            droppedOnTarget: list1.onTarget || list2.onTarget,
            list0: { ...list0, items }
        });

        if (list1.onTarget){
            this.props.onChange('groupBy',list1.items.map(col => col.name));
        }
        else if (list2.onTarget){
            this.props.onChange('columns', list2.items.map(col => col.name));
        }

    }

}

/* <ColumnList name="list0" style={{width: 150, padding: 1, borderWidth: 1}}
title='Available Columns' header={{height: 24, menu: false}}
ref={c => this.list0el = ReactDOM.findDOMNode(c)} items={list0.items}
dragged={list1.onTarget || list2.onTarget ? NULL_DRAGGED : dragged}
onMouseDown={this.handleDragStart}
itemClassName={item => item.inUse ? 'in-use': ''}
onItemAction={this.handleItemAction}
/> */
