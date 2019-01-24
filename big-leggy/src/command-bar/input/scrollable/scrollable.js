import React from 'react';
import cx from 'classnames';
import * as styles from './scrollable.styles';

export default class Scrollable extends React.Component {
  constructor(props) {
    super(props);
    this.width = 0;
    this.el = React.createRef();
    this.scrollingElement = React.createRef();
    this.state = {
      contentWidth: 'auto',
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
    return this.state.contentWidth !== 'auto';
  }

  scroll(direction) {
    if (this.canScroll()) {
      let {scrollRight} = this.state;
      if (direction === 'start') {
        const { contentWidth } = this.state;
        const width = this.getWidth();
        scrollRight = width - contentWidth;
      } else {
        scrollRight = 0;
      }

      if (scrollRight !== this.state.scrollRight){
        this.setState({
          scrollRight 
        })
      }
    }
  }

  scrollIntoView({ left, width }) {
    const {contentWidth, scrollRight} = this.state;
    const containerWidth = this.getWidth();

    const visibleLeft = contentWidth - containerWidth + scrollRight;
    const visibleRight = visibleLeft + contentWidth;
    console.log(`scrollIntoView [${left}, ${left+width}] visibleRange = ${visibleLeft} -${visibleRight}`)
    if (left < visibleLeft){
      const right = -(Math.abs(scrollRight) + visibleLeft - left);
      this.setState({
        scrollRight: right
      })
    }


  }

  onContentResize(width) {
    const containerWidth = this.getWidth();
    console.log(`%cScrollable onContentResize ${width} (/${containerWidth})`, 'color: blue;font-size: bold;')
    if (width > containerWidth) {
      this.setState({
        contentWidth: width
      })
    } else if (this.state.contentWidth !== 'auto') {
      this.setState({
        contentWidth: 'auto'
      })
    }
  }

  render() {
    const { children, className } = this.props;
    const {contentWidth: width, scrollRight: right} = this.state;
    const components = Array.isArray(children)
      ? children : [children];

    return (
      <div ref={this.el} className={cx(styles.scrollable, className)}>
        <div ref={this.scrollingElement}
          style={{ width, right }}
          className={styles.scrollingContainer}>
          {
            components.map((component, i) =>
              component &&
              React.cloneElement(component, {
                key: i,
                // how can we avoid doing this if it is a react built-in element ?
                onContentResize: this.onContentResize
              })
            )
          }
        </div>
      </div>
    )
  }
}
