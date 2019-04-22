import React from 'react';
import cx from 'classnames';
import { auto, calculateScrollOffset } from './scroll-utils';
import * as styles from './scrollable.styles';

const defaultState = {
  contentWidth: auto,
  scrollLeft: 3,
  animateScroll: false
}

export default class Scrollable extends React.Component {
  constructor(props) {
    super(props);
    this.el = React.createRef();
    this.scrollingElement = React.createRef();
    this.state = defaultState;
    this.cursorAtEnd = true;

    this.onContentResize = this.onContentResize.bind(this);
  }

  getWidth() {
    if (this.el.current) {
      const { width } = this.el.current.getBoundingClientRect();
      return Math.round(width);
    }
  }

  reset() {
    const { contentWidth } = this.state;
    if (contentWidth !== auto) {
      this.setState(defaultState);
    }
  }

  setCursorAtEnd(cursorAtEnd) {
    console.log(`Scrollable cursorAtEnd=${cursorAtEnd}`)
    this.cursorAtEnd = cursorAtEnd;
  }

  canScroll() {
    return this.state.contentWidth !== auto;
  }

  scrollToStart() {
    if (this.canScroll()) {
      if (this.state.scrollLeft !== 0) {
        this.setState({ scrollLeft: 0 })
      }
    }
  }

  scrollToEnd() {
    const { contentWidth } = this.state;
    if (contentWidth !== auto) {
      const width = this.getWidth();
      const scrollLeft = width - contentWidth;
      if (this.state.scrollLeft !== scrollLeft) {
        this.setState({ scrollLeft })

      }
    }
  }

  scrollIntoView({ tokenLeft, tokenWidth }) {
    console.log(`[Scrollable] scrollIntoView ${tokenLeft} ${tokenWidth}`)

    const width = this.getWidth();
    const { contentWidth } = this.state;

    const scrollLeft = calculateScrollOffset(
      this.state.scrollLeft,
      width,
      contentWidth,
      tokenLeft - 3,
      tokenWidth + 6);

    if (scrollLeft !== this.state.scrollLeft) {
      this.setState({
        scrollLeft,
        // animate unless we're typing at the far right
        animateScroll: Math.abs(scrollLeft) < contentWidth - width
      })
    }
  }

  onContentResize(width) {
    const offset = 3;
    const containerWidth = this.getWidth() - offset;
    let contentWidth;
    let {scrollLeft} = this.state;
    if (containerWidth) {

      if (containerWidth - width >= 3) {
        contentWidth = auto;
        if (this.cursorAtEnd) {
          scrollLeft = offset;
        }
      } else {
        contentWidth = width;
        if (this.cursorAtEnd) {
          scrollLeft = containerWidth - width;
        }
      }

      console.log(`Scrollable.onContentResize container=${containerWidth} contentWidth = ${width}`)
      // const contentOverflow = width - containerWidth;
      // const contentWidth = contentOverflow > 0
      //   ? width + 1
      //   : auto;

      // can we check that cursor is at end ?

      if (contentWidth !== this.state.contentWidth) {
        // assuming cursor ar end ...
        this.setState({
          scrollLeft,
          contentWidth,
          animateScroll: false
        });
      }
    }
  };

  handleScroll = () => {
    this.el.current.scrollLeft = 0;
  }

  render() {
    const { children, className } = this.props;
    const { contentWidth: width, scrollLeft: left, animateScroll } = this.state;
    const components = Array.isArray(children)
      ? children : [children];
    console.log(`Scrollable render scrollable width = ${width}px left ${left}`)
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
