import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {Motion, spring} from 'react-motion';

const springConfig = {stiffness: 300, damping: 50};

function clamp(n, min, max) {
    return Math.max(Math.min(n, max), min);
}

function reinsert(arr, from, to) {
    const _arr = arr.slice(0);
    const val = _arr[from];
    _arr.splice(from, 1);
    _arr.splice(to, 0, val);
    return _arr;
}


const Style = {
    button : {position:'absolute', right: 5, top:5, height: 13, width:13, backgroundColor:'blue'}
};


export default class List extends Component {

    constructor(props){
        super(props);

        this.state = {
            delta: 0,
            mouse: 0,
            isPressed: false,
            lastPressed: 0,
            order: Array.from(Array(props.items.length),(d,i) => i),
        }
    }

    render(){

        const className = "List";
        const {style, dragged, dragging, mouseMoveX, mouseMoveY, onTarget, items} = this.props;
        const {mouse, isPressed, lastPressed, order, dragOffsetX, dragOffsetY} = this.state;
        const {width} = style;

        const content = items.map((item,idx) => {

            const style = lastPressed === item && isPressed
                ? {
                    scale: spring(1.01, springConfig),
                    shadow: spring(16, springConfig),
                    x:0,
                    y: mouse,
                }
                : (item === dragged.item && onTarget
                    ? (dragging 
                        ? {
                            scale : spring(1.01, springConfig),
                            shadow: spring(16, springConfig),
                            x: dragOffsetX + mouseMoveX,
                            y: dragOffsetY + mouseMoveY
                        }
                        : { // Dropped onto target, slot into final resting place
                            scale: spring(1, springConfig),
                            shadow: spring(1, springConfig),
                            x: spring(0, springConfig),
                            y: spring(order.indexOf(idx) * 24, springConfig)
                        }
                    )
                    : { 
                        scale: spring(1, springConfig),
                        shadow: spring(1, springConfig),
                        x:0,
                        y: spring(order.indexOf(idx) * 24, springConfig),
                });
            return (
                <Motion style={style} key={item.name}>
                    {({scale, shadow, x, y}) =>
                    <div
                        onMouseDown={this.handleMouseDown.bind(this, item, idx, y)}
                        className="ListItem demo8-item"
                        style={{
                        position:'absolute',
                        width,
                        height: 23,
                        backgroundColor:'white',
                        cursor:'pointer',
                        boxShadow: `rgba(0, 0, 0, 0.2) 0px ${shadow}px ${2 * shadow}px 0px`,
                        transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
                        zIndex: item === lastPressed || item === dragged.item ? 99 : idx
                        }}>
                        <span>{`${order.indexOf(idx) + 1}  ${item.name}`}</span>
                        { dragging && item === dragged.item 
                            ? null 
                            : <div className="remove" style={Style.button} onClick={this.removeItem.bind(this,item)}/> }
                    </div>
                    }
                </Motion>
            )
        });

        if (dragged.item && !onTarget){

            const style2 = dragging 
            ? {
                scale : spring(1.01, springConfig),
                shadow: spring(16, springConfig),
                x: dragOffsetX + mouseMoveX,
                y: dragOffsetY + mouseMoveY
            }

            : { // No Drop - return to base - need to remove node at end
                scale: spring(1, springConfig),
                shadow: spring(1, springConfig),
                x: spring(dragOffsetX, springConfig),
                y: spring(dragOffsetY, springConfig)
            };

            content.push(			
                <Motion style={style2} key="dragged">
                    {({scale,shadow,x,y}) => 
                        <div className="ListItem demo8-item"
                            style={{
                            position:'absolute',
                            width,
                            backgroundColor: dragging ? 'yellow' : 'white',
                            boxShadow: `rgba(0, 0, 0, 0.2) 0px ${shadow}px ${2 * shadow}px 0px`,
                            transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
                            zIndex: 99
                            }}>
                            {`${dragged.item.name}`}
                        </div>
                    }
                </Motion>
            );

        }

        return (
            <div className={className} style={style}>
                {content}
            </div>

        );


    }

    componentDidMount(){
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        var {left, top, right, bottom} = ReactDOM.findDOMNode(this).getBoundingClientRect();

        this.setState({left,top, right, bottom});
        this.props.onMeasure({left, top, right, bottom});
        
    }

    componentWillReceiveProps(nextProps){
        
        var {dragged, items} = nextProps;

        if (items !== this.props.items){
            this.setState({order: Array.from(Array(items.length),(d,i) => i)});
        }

        if (dragged.item && dragged !== this.props.dragged){

            this.setState({
                items,
                dragOffsetX : dragged.rect.left - this.state.left,
                dragOffsetY: dragged.rect.top - this.state.top
            });

        }

    }

    removeItem(item){
        this.props.onItemRemoved(item);
    }

    handleMouseDown(item, pos, pressY, {pageY}) {
        this.setState({
            delta: pageY - pressY,
            mouse: pressY,
            isPressed: true,
            lastPressed: item,
            lastPressedPos: pos
        });	    

        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mouseup', this.handleMouseUp);

    }

    handleMouseMove({pageY}) {
        var itemsCount = this.props.items.length;
        const {isPressed, delta, order, lastPressedPos} = this.state;
        if (isPressed) {
            const mouse = pageY - delta;
            const row = clamp(Math.round(mouse / 24), 0, itemsCount - 1);
            const newOrder = reinsert(order, order.indexOf(lastPressedPos), row);
            this.setState({mouse: mouse, order: newOrder});
        }
    }

    handleMouseUp() {
        // pass all these in callback, so parent can feed them back in
        this.setState({isPressed: false, delta: 0});

        this.props.onReorder(this.state.order);

        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mouseup', this.handleMouseUp);


    }

} 

List.defaultProps = {
    dragged : {
        item: null
    }
};


