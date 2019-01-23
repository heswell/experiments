import React from 'react';
import cx from 'classnames';
import * as styles from './scrollable.styles';  

export default class extends React.Component {
  constructor(props){
    super(props);
    this.width = 0;
    this.el = React.createRef();
    this.scrollingElement = React.createRef();

    this.onContentResize = this.onContentResize.bind(this);
  }

  getWidth(){
    if (this.el.current){
      const {width} = this.el.current.getBoundingClientRect();
      return Math.round(width);
    }
  }

  onContentResize(width){
    const containerWidth = this.getWidth();
    console.log(`%cScrollable onContentResize ${width} (/${containerWidth})`,'color: blue;font-size: bold;')
  }

  render() {
    const {children, className} = this.props;
    const components = Array.isArray(children)
      ? children: [children];

    return (
      <div ref={this.el} className={cx(styles.scrollable, className)}>
        <div ref={this.scrollingElement} className={styles.speedbarScrollingContainer}>
          {
            components.map((component,i) =>
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
