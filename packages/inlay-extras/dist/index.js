import React from 'react';
import { normalizeLayoutStyles, breadcrumb } from '@heswell/finlay';
import cx from 'classnames';

const DIMENSIONS = {
  margin: {
    top: 'marginTop',
    right: 'marginRight',
    bottom: 'marginBottom',
    left: 'marginLeft'
  },
  border: {
    top: 'borderTopWidth',
    right: 'borderRightWidth',
    bottom: 'borderBottomWidth',
    left: 'borderLeftWidth'
  },
  padding: {
    top: 'paddingTop',
    right: 'paddingRight',
    bottom: 'paddingBottom',
    left: 'paddingLeft'
  }
};

const LayoutBox = ({
  feature,
  children,
  style,
  onChange
}) => {
  return React.createElement("div", {
    className: `LayoutBox layout-${feature} layout-outer`
  }, React.createElement("div", {
    className: `layout-top`
  }, React.createElement("span", {
    className: "layout-title"
  }, feature), React.createElement("input", {
    className: "layout-input",
    value: style.top,
    onChange: e => onChange(feature, 'top', parseInt(e.target.value, 10))
  })), React.createElement("div", {
    className: `layout-inner`
  }, React.createElement("div", {
    className: `layout-left`
  }, React.createElement("input", {
    className: "layout-input",
    value: style.left,
    onChange: e => onChange(feature, 'left', e.target.value)
  })), children, React.createElement("div", {
    className: `layout-right`
  }, React.createElement("input", {
    className: "layout-input",
    value: style.right,
    onChange: e => onChange(feature, 'right', e.target.value)
  }))), React.createElement("div", {
    className: `layout-bottom`
  }, React.createElement("input", {
    className: "layout-input",
    value: style.bottom,
    onChange: e => onChange(feature, 'bottom', e.target.value)
  })));
};

class LayoutConfigurator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      layoutStyle: normalizeLayoutStyles(props.layoutStyle)
    };
    this.handleChange = this.handleChange.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.layoutStyle !== this.props.layoutStyle) {
      this.setState({
        layoutStyle: normalizeLayoutStyles(nextProps.layoutStyle)
      });
    }
  }

  handleChange(feature, dimension, strValue) {
    const value = parseInt(strValue || '0', 10);
    const {
      layoutStyle
    } = this.state;
    const property = DIMENSIONS[feature][dimension];
    this.setState({
      layoutStyle: { ...layoutStyle,
        [property]: value
      }
    }, () => {
      this.props.onChange(feature, dimension, value, this.state.layoutStyle);
    });
  }

  render() {
    const {
      width,
      height,
      style
    } = this.props;
    const {
      marginTop: mt = 0,
      marginRight: mr = 0,
      marginBottom: mb = 0,
      marginLeft: ml = 0
    } = this.state.layoutStyle;
    const {
      borderTopWidth: bt = 0,
      borderRightWidth: br = 0,
      borderBottomWidth: bb = 0,
      borderLeftWidth: bl = 0
    } = this.state.layoutStyle;
    const {
      paddingTop: pt = 0,
      paddingRight: pr = 0,
      paddingBottom: pb = 0,
      paddingLeft: pl = 0
    } = this.state.layoutStyle;
    return React.createElement("div", {
      className: "LayoutConfigurator",
      style: {
        width,
        height,
        ...style
      }
    }, React.createElement(LayoutBox, {
      feature: "margin",
      style: {
        top: mt,
        right: mr,
        bottom: mb,
        left: ml
      },
      onChange: this.handleChange
    }, React.createElement(LayoutBox, {
      feature: "border",
      style: {
        top: bt,
        right: br,
        bottom: bb,
        left: bl
      },
      onChange: this.handleChange
    }, React.createElement(LayoutBox, {
      feature: "padding",
      style: {
        top: pt,
        right: pr,
        bottom: pb,
        left: pl
      },
      onChange: this.handleChange
    }, React.createElement("div", {
      className: "layout-content"
    })))));
  }

}

const Slide = ({
  firstNode,
  onClick
}) => firstNode ? React.createElement("div", {
  className: "node-slide"
}) : React.createElement("div", {
  className: "node-slide active"
}, `<`);

class LayoutTabs extends React.Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  render() {
    const {
      trail,
      selectedNode
    } = this.props;
    const last = trail.length - 1;
    return React.createElement("div", {
      className: "LayoutTabs"
    }, trail.map((node, i) => React.createElement("div", {
      key: node.$path,
      className: cx('node', {
        selected: node === selectedNode
      })
    }, React.createElement(Slide, {
      firstNode: i === 0
    }), React.createElement("div", {
      className: "node-path",
      onClick: () => this.onClick(node, i === last)
    }, node.$path), React.createElement("div", {
      className: "node-label",
      onClick: () => this.onClick(node, i === last)
    }, node.type))));
  }

  onClick(node, isLast) {
    if (isLast) {
      this.props.onSelect(node);
    } else {
      this.props.onNavigate(node);
    }
  }

}

const LTR = 'ltr';
const RTL = 'rtl';
const NO_STYLE = {};

const Toggle = ({
  leafNode,
  expanded,
  onToggle
}) => leafNode ? React.createElement("div", {
  className: "toggle-node"
}) : React.createElement("div", {
  className: "toggle-node active",
  onClick: () => onToggle(!expanded)
}, expanded ? '-' : '+');

const Slide$1 = ({
  leafNode,
  onClick
}) => leafNode ? React.createElement("div", {
  className: "node-slide"
}) : React.createElement("div", {
  className: "node-slide active",
  onClick: onClick
}, `>`);

const Node = ({
  root,
  model,
  expanded,
  onToggle,
  onSelect,
  onSlide,
  selected
}) => {
  const leafNode = !hasChildren(model);
  return React.createElement("div", {
    className: cx('node', {
      selected
    })
  }, React.createElement(Toggle, {
    leafNode: leafNode,
    expanded: expanded,
    onToggle: onToggle
  }), React.createElement("div", {
    className: "node-label",
    onClick: () => onSelect(model)
  }, `${model.$path} ${model.type}`), React.createElement(Slide$1, {
    leafNode: leafNode,
    onClick: () => onSlide(model)
  }));
};

class TreeNode extends React.Component {
  constructor(props) {
    super(props);
    this.rootEl = null;
    this.state = {
      expanded: props.expanded || false,
      collapsing: false
    };
    this.toggleNode = this.toggleNode.bind(this);
  }

  render() {
    const {
      model,
      root,
      onSelect,
      onSlide,
      showRoot = true,
      selectedNode
    } = this.props;
    const {
      expanded,
      collapsing
    } = this.state;
    return React.createElement("div", {
      className: cx('node-container', {
        root
      }),
      ref: el => this.rootEl = el
    }, showRoot && React.createElement(Node, {
      model: model,
      root: root,
      expanded: expanded,
      selected: selectedNode === model,
      onToggle: this.toggleNode,
      onSelect: onSelect,
      onSlide: onSlide
    }), (expanded || collapsing || !showRoot) && model.children && React.createElement("div", {
      className: cx('node-children', {
        expanded: this.props.expanded
      })
    }, React.createElement("div", {
      className: "node-children-inner-container"
    }, model.children.map((child, i) => React.createElement(TreeNode, {
      key: i,
      root: false,
      model: child,
      selectedNode: selectedNode,
      onSelect: onSelect,
      onSlide: onSlide
    })))));
  }

  componentDidUpdate(prevvProps, prevState) {
    let childContainer;

    function transitionEnd() {
      childContainer.classList.replace('expanding', 'expanded');
      childContainer.style.height = 'auto';
      childContainer.removeEventListener('transitionend', transitionEnd);
    }

    const transitionEnd2 = () => {
      childContainer.classList.remove('collapsing', 'expanded');
      childContainer.removeEventListener('transitionend', transitionEnd2);
      this.setState({
        expanded: false,
        collapsing: false
      });
    };

    if (this.state.expanded && prevState.expanded === false) {
      childContainer = this.rootEl.querySelector('.node-children');
      const {
        clientHeight
      } = childContainer.firstChild;
      childContainer.classList.add('expanding');
      childContainer.style.height = `${clientHeight}px`;
      childContainer.addEventListener('transitionend', transitionEnd);
    } else if (prevState.expanded && this.state.expanded === false) {
      childContainer = this.rootEl.querySelector('.node-children');
      const {
        clientHeight
      } = childContainer.firstChild;
      childContainer.classList.add('collapsing');
      childContainer.style.height = `${clientHeight}px`;
      setTimeout(() => {
        childContainer.style.height = `0px`;
        childContainer.addEventListener('transitionend', transitionEnd2);
      }, 100);
    }
  }

  toggleNode(expanded) {
    if (expanded === false) {
      this.setState({
        expanded,
        collapsing: true
      });
    } else {
      this.setState({
        expanded,
        collapsing: false
      });
    }
  }

}

class LayoutTreeViewer extends React.Component {
  constructor(props) {
    super(props);
    this.slideContainer = null;
    this.state = {
      rootNode: props.tree,
      currentNode: props.tree,
      trail: breadcrumb(props.tree, '0'),
      zoomNode: null,
      zoomDirection: null,
      selectedNode: null
    };
    this.selectNode = this.selectNode.bind(this);
    this.slideNode = this.slideNode.bind(this);
    this.slideBack = this.slideBack.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const {
      tree
    } = nextProps;

    if (tree !== this.props.tree) {
      this.setState({
        rootNode: tree,
        currentNode: tree,
        trail: breadcrumb(tree, tree.$path),
        zoomNode: null,
        zoomDirection: null,
        selectedNode: null
      });
    }
  }

  render() {
    const {
      currentNode,
      zoomNode,
      zoomDirection,
      trail,
      selectedNode
    } = this.state;
    const {
      width,
      height,
      style = NO_STYLE,
      tree = null
    } = this.props;
    const isRoot = currentNode === tree;

    if (tree === null) {
      return React.createElement("div", {
        className: "LayoutTreeViewer",
        style: { ...style,
          width,
          height
        }
      });
    }

    return React.createElement("div", {
      className: "LayoutTreeViewer",
      style: {
        width,
        height
      }
    }, React.createElement("div", {
      className: "parent-row"
    }, React.createElement(LayoutTabs, {
      trail: trail,
      onNavigate: this.slideBack,
      onSelect: this.selectNode,
      selectedNode: selectedNode
    })), React.createElement("div", {
      className: "slide-container",
      ref: el => this.slideContainer = el
    }, React.createElement("div", {
      className: zoomDirection === RTL ? 'slide slide-1' : 'slide slide-3'
    }, React.createElement(TreeNode, {
      model: currentNode,
      root: isRoot,
      selectedNode: selectedNode,
      showRoot: false,
      expanded: true,
      onSelect: this.selectNode,
      onSlide: this.slideNode
    })), zoomNode && React.createElement("div", {
      className: zoomDirection === RTL ? 'slide slide-2' : 'slide slide-4'
    }, React.createElement(TreeNode, {
      model: zoomNode,
      root: false,
      showRoot: false,
      expanded: true
    }))));
  }

  componentDidUpdate(prevProps, prevState) {
    const animationEnd = () => {
      this.slideContainer.classList.remove('sliding');
      this.setState({
        currentNode: this.state.zoomNode,
        zoomNode: null,
        zoomDirection: null
      });
      this.slideContainer.firstChild.removeEventListener('transitionend', animationEnd);
    };

    if (prevState.zoomNode === null && this.state.zoomNode !== null) {
      setTimeout(() => {
        this.slideContainer.classList.add('sliding');
        this.slideContainer.firstChild.addEventListener('transitionend', animationEnd);
      }, 100);
    }
  }

  selectNode(selectedNode) {
    this.setState({
      selectedNode
    });

    if (this.props.onSelectNode) {
      this.props.onSelectNode(selectedNode);
    }
  }

  slideNode(model) {
    const trail = breadcrumb(this.state.rootNode, model.$path);
    this.setState({
      zoomNode: model,
      zoomDirection: RTL,
      trail
    });
  }

  slideBack(model) {
    const trail = breadcrumb(this.state.rootNode, model.$path);
    this.setState({
      zoomNode: model,
      zoomDirection: LTR,
      trail
    });
  }

}

const hasChildren = model => model.children && model.children.length > 0;

export { LayoutConfigurator, LayoutTreeViewer };
//# sourceMappingURL=index.js.map
