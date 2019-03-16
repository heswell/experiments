import React from 'react';
import cx from 'classnames';
import { auto, calculateScrollOffsetRight } from './scroll-utils';
import * as styles from './scrollable.styles';

const defaultState = {
  contentWidth: auto,
  scrollRight: 0,
  scrollLeft: 0,
  animateScroll: false
}

export default class Scrollable extends React.Component {
  constructor(props) {
    super(props);
    this.el = React.createRef();
    this.scrollingElement = React.createRef();
    this.state = defaultState;

    this.onContentResize = this.onContentResize.bind(this);
  }

  getWidth() {
    if (this.el.current) {
      const { width } = this.el.current.getBoundingClientRect();
      return Math.round(width);
    }
  }

  reset(){
    const {contentWidth, scrollRight} = this.state;
    if (contentWidth !== auto || scrollRight === 0){
      this.setState(defaultState);
    }
  }

  canScroll() {
    return this.state.contentWidth !== auto;
  }

  scrollToStart(){
    if (this.canScroll()){
      if (this.state.scrollLeft !== 0){
        this.setState({scrollLeft: 0})
      }
    }
  }

  scrollToEnd() {
    if (this.canScroll()) {
      if (this.state.scrollRight !== 0) {
        this.setState({
          scrollRight: 0
        });
      }
    }
  }

  setCurrentInputPosition(cursorPosition, inputLength, tokenPosition){
    const {scrollLeft, scrollRight} = this.state;
    const {left: tokenLeft, width: tokenWidth} = tokenPosition;

    if (cursorPosition === 0 && scrollLeft === auto){
      // flip scrollCOntrol from right to left, then animate to start
      const {contentWidth} = this.state;
      const containerWidth = this.getWidth();
      this.setState({
        scrollLeft: containerWidth - contentWidth,
        scrollRight: auto
      });

    } else if (cursorPosition === inputLength && scrollRight === auto){
      // flip scrollControl from left to right, then animate to start
      const {contentWidth} = this.state;
      const containerWidth = this.getWidth();
      this.setState({
        scrollLeft: auto,
        scrollRIght: containerWidth - contentWidth
      });
    } else {
      this.scrollIntoView(tokenPosition)
    }
  }

  componentDidUpdate(prevProps, prevState){
    if (prevState.scrollRight !== auto && this.state.scrollRight === auto){
      requestAnimationFrame(() => {
        this.scrollingElement.current.style.left = '0px';
      });
    } else if (prevState.scrollLeft !== auto && this.state.scrollLeft === auto){
      requestAnimationFrame(() => {
        this.scrollingElement.current.style.right = '0px';
      });
    }
  }


 scrollIntoView({ left: tokenLeft, width: tokenWidth }) {
    const scrollRight = calculateScrollOffsetRight(
      this.state.scrollRight,
      this.getWidth(),
      this.state.contentWidth,
      tokenLeft - 3,
      tokenWidth + 6);

    if (scrollRight !== this.state.scrollRight) {
      this.setState({ scrollRight })
    }
  }

  onContentResize(width) {
    const containerWidth = this.getWidth();
    let { contentWidth } = this.state;
    if (containerWidth) {
      if (width > containerWidth) {
        contentWidth = width;
      } else {
        contentWidth = auto;
      }
      if (contentWidth !== this.state.contentWidth) {
        this.setState({
          contentWidth,
          animateScroll: true
        });
      }
    }
  };

  handleScroll = (e) => {
    this.el.current.scrollLeft = 0;
  }

  render() {
    const { children, className } = this.props;
    const { contentWidth: width, scrollRight: right, scrollLeft: left, animateScroll } = this.state;
    const components = Array.isArray(children)
      ? children : [children];

    return (
      <div ref={this.el} className={cx(styles.scrollable, className)} onScroll={this.handleScroll}>
        <div ref={this.scrollingElement}
          style={{ width, left, right }}
          className={cx(styles.scrollingContainer, {
            [styles.scrollingContainerStatic]: animateScroll === false
          })}>
          {
            components.map((component, i) => {
              if (React.isValidElement(component) && component.props.monitorContentSize) {
                return React.cloneElement(component, {
                  key: i,
                  onContentResize: this.onContentResize
                })
              } else {
                return component;
              }
            })
          }
        </div>
      </div>
    )
  }
}
