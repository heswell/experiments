import React from 'react';
import cx from 'classnames';
import { auto, calculateScrollOffset } from './scroll-utils';
import * as styles from './scrollable.styles';

const defaultState = {
  contentWidth: auto,
  // scrollRight: 0,
  scrollLeft: auto,
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
    const {contentWidth, scrollLeft} = this.state;
    if (contentWidth !== auto){
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
    const {contentWidth} = this.state;
    if (contentWidth !== auto){
      const width = this.getWidth();
      const scrollLeft = width - contentWidth;
      if (this.state.scrollLeft !== scrollLeft){
        this.setState({scrollLeft})

      }
    }
}

 scrollIntoView({ tokenLeft, tokenWidth }) {
   console.log(`[Scrollable] scrollIntoView ${tokenLeft} ${tokenWidth}`)
    const scrollLeft = calculateScrollOffset(
      this.state.scrollLeft,
      this.getWidth(),
      this.state.contentWidth,
      tokenLeft - 3,
      tokenWidth + 6);

    if (scrollLeft !== this.state.scrollLeft) {
      this.setState({ scrollLeft })
    }
  }

  onContentResize(width) {
    const containerWidth = this.getWidth();
    if (containerWidth) {
      const contentWidth = width > containerWidth
        ? width
        : auto;

      if (contentWidth !== this.state.contentWidth) {
        // assuming cursor ar end ...
        const scrollLeft = containerWidth - contentWidth;
        console.log(`set contentWidth ${contentWidth} left ${scrollLeft}`)
        this.setState({
          scrollLeft,
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
    const { contentWidth: width, scrollLeft: left, animateScroll } = this.state;
    const components = Array.isArray(children)
      ? children : [children];

    return (
      <div ref={this.el} className={cx(styles.scrollable, className)} onScroll={this.handleScroll}>
        <div ref={this.scrollingElement}
          style={{ width, left }}
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
