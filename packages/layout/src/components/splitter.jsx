
import React from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames';

var _splitter,
    _mousedown = false,
    _direction,
    _diff = 0;


export default class Splitter extends React.Component {

    render() {

        const { computedStyle: style } = this.props.layoutModel

        // onsole.log(`%c     Splitter ${top},${left},${width},${height}`,`background-color:brown;color:lime;`);

        var className = cx(
            'Splitter',
            this.props.className
        );

        return <div className={className} style={style} />
    }

    componentDidMount() {
        this._mouseDownHandler = this.handleMousedown.bind(this);
        ReactDOM.findDOMNode(this).addEventListener('mousedown', this._mouseDownHandler, false);
    }

    componentWillUnmount() {
        ReactDOM.findDOMNode(this).removeEventListener('mousedown', this._mouseDownHandler, false);
        this._mouseDownHandler = null;
    }

    handleMousedown(e) {

        _splitter = this;
        _mousedown = true;
        _diff = 0;

        initDrag.call(this, e);

        window.addEventListener("mousemove", mouseMoved, false);
        window.addEventListener("mouseup", mouseUp, false);

        e.preventDefault();
    }

}

function mouseMoved(evt) {
    return onDrag.call(_splitter, evt)
}

function mouseUp(evt) {
    return onDragEnd.call(_splitter, evt)
}

function initDrag(e) {

    _direction = this.props.direction;

    var vertical = _direction === "vertical";
    // var dim = vertical ? "height" : "width";

    this.lastPos = (vertical ? e.clientY : e.clientX);

    this.props.onDragStart(this.props.absIdx);

}

function onDrag(evt) {

    var clientPos/*,
        dimension*/;

    if (_direction === 'vertical') {
        clientPos = "clientY";
        // dimension = "height";
    }
    else {
        clientPos = "clientX";
        // dimension = "width";
    }

    var pos = evt[clientPos],
        diff = pos - this.lastPos;


    // we seem to get a final value of zero
    if (pos && (pos !== this.lastPos)) {
        this.props.onDrag(diff);
    }

    this.lastPos = pos;

}

function onDragEnd() {

    _mousedown = false;
    _splitter = null;

    window.removeEventListener("mousemove", mouseMoved, false);
    window.removeEventListener("mouseup", mouseUp, false);

    this.props.onDragEnd();

}
