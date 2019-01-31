import React, { Component } from 'react';
// import { Motion, spring } from 'react-motion';

// const springConfig = { stiffness: 300, damping: 50 };

const Style = {
    button: { position: 'absolute', right: 5, top: 5, height: 13, width: 13, backgroundColor: 'blue' }
};

// function clamp(n, min, max) {
//     return Math.max(Math.min(n, max), min);
// }

// function reinsert(arr, from, to) {
//     const _arr = arr.slice(0);
//     const val = _arr[from];
//     _arr.splice(from, 1);
//     _arr.splice(to, 0, val);
//     return _arr;
// }

// class ListItem extends React.Component {

//     render() {

//         var { text, model } = this.props;

//         return (
//             <div className="ListItem">{text}</div>
//         );
//     }
// }

export default class List extends Component {

    constructor(props) {
        super(props);

        this.state = {
            isPressed: false,
            lastPressed: 0,
            order: Array.from(Array(props.items.length), (d, i) => i),
        };
    }

    render() {

        const className = "List";
        const { style, items } = this.props;
        const { mouseX, mouseY, isPressed, lastPressed, lastPressedPos, order } = this.state;
        const { width, height } = style;
        const listItems = items.map((item, idx) => {

            let mouseDownHandler = item.inUse ? null : this.handleMouseDown.bind(this, item.column);

            return (
                <div
                    onMouseDown={mouseDownHandler}
                    className="ListItem demo8-item"
                    style={{
                        position: 'absolute',
                        width: width - 15,
                        height: 23,
                        lineHeight: '22px',
                        backgroundColor: item.inUse ? '#ccc' : 'white',
                        cursor: 'pointer',
                        boxShadow: `rgba(0, 0, 0, 0.2) 0px 1px 2px 0px`,
                        transform: `translate3d(0, ${idx * 24}px, 0)`,
                        zIndex: item === lastPressed ? 99 : idx,
                    }}>
                    <span>{`${order.indexOf(idx) + 1}  ${item.column.name}`}</span>
                    {item.inUse ? null :
                        <div className="add" style={Style.button}
                            onClick={this.addItem.bind(this, item)}
                            onMouseDown={e => e.stopPropagation()} />}
                </div>
            );
        });

        return (
            <div className={className} style={style}>
                <div className="ViewPort" style={{ position: 'absolute', overflow: 'hidden', top: 0, left: 0, width, height }}>
                    <div className="scrollable-content" style={{ position: 'absolute', top: 0, left: 0, width, height, overflow: 'auto' }}>
                        <div className="scrolling-canvas-container" style={{ width: width - 15, height: items.length * 24 }}>
                            {listItems}
                        </div>
                    </div>
                </div>
            </div>

        );

    }

    addItem(item) {
        this.props.onItemAdded(item);
    }

    handleMouseDown(column, { target, pageX, pageY }) {
        this.props.onMouseDown(column, target.getBoundingClientRect(), pageX, pageY);
    }



}


