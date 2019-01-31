import React from 'react';

export default class Draggable extends React.Component {

    static defaultProps = {
        onDragStart: () => true,
        onDragEnd: () => {},
        onDrag: () => {}
    };

    x;
    y;

    constructor(props){
        super(props);
        this.state = {
        drag: null
        };

    }

    render() {
        const {component:Component, ...props} = this.props;

        if (Component){
            return <Component onMouseDown={this.handleMouseDown} {...props}/>;
        } else {
            return <div onMouseDown={this.handleMouseDown} {...props}/>;
        }
    }


    handleMouseDown = e => {
        const drag = this.props.onDragStart(e);

        if (drag === null && e.button !== 0) {
            return;
        }

        this.x = e.clientX;
        this.y = e.clientY;

        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('mousemove', this.onMouseMove);

        this.setState({drag});

        if (e.stopPropagation) {
            e.stopPropagation();
        }

        if (e.preventDefault) {
            e.preventDefault();
        }
        
    }

    onMouseMove = e => {
        if (this.state.drag === null) {
        return;
        }

        if (e.stopPropagation) {
        e.stopPropagation();
        }

        if (e.preventDefault) {
        e.preventDefault();
        }

        const x = e.clientX;
        const y = e.clientY;
        const deltaX = x - this.x;
        const deltaY = y - this.y;

        this.x = x;
        this.y = y;

        this.props.onDrag(e, deltaX, deltaY);
    }

    onMouseUp = e => {
        this.cleanUp();
        this.props.onDragEnd(e, this.state.drag);
        this.setState({drag: null});
    }

    componentWillUnmount() {
        this.cleanUp();
    }

    cleanUp() {
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('mousemove', this.onMouseMove);
    }
}
