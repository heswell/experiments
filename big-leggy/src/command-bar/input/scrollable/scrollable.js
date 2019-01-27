import React from 'react';
import cx from 'classnames';
import { auto, calculateScrollOffsetRight } from './scroll-utils';
import * as styles from './scrollable.styles';

export default class Scrollable extends React.Component {
  constructor(props) {
    super(props);
    this.el = React.createRef();
    this.scrollingElement = React.createRef();
    this.state = {
      contentWidth: auto,
      scrollRight: 0
    }

    this.onContentResize = this.onContentResize.bind(this);
  }

  getWidth() {
    if (this.el.current) {
      const { width } = this.el.current.getBoundingClientRect();
      return Math.round(width);
    }
  }

  canScroll() {
    return this.state.contentWidth !== auto;
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
          contentWidth
        });
      }
    }
  };

  render() {
    const { children, className } = this.props;
    const { contentWidth: width, scrollRight: right } = this.state;
    const components = Array.isArray(children)
      ? children : [children];

    return (
      <div ref={this.el} className={cx(styles.scrollable, className)}>
        <div ref={this.scrollingElement}
          style={{ width, right }}
          className={styles.scrollingContainer}>
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
