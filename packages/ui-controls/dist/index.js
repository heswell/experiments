import React__default, { Component, createElement, cloneElement } from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames';

let _dialogOpen = false;
const _popups = [];

function specialKeyHandler(e) {
  if (e.keyCode === 27
  /* ESC */
  ) {
      if (_popups.length) {
        closeAllPopups();
        console.log('unmount the open popup(s)');
      } else if (_dialogOpen) {
        console.log('unmount the open dialog');
        ReactDOM.unmountComponentAtNode(document.body.querySelector('.react-dialog'));
      }
    }
}

function outsideClickHandler(e) {
  if (_popups.length) {
    // onsole.log(`Popup.outsideClickHandler`);
    const popupContainers = document.body.querySelectorAll('.react-popup');

    for (let i = 0; i < popupContainers.length; i++) {
      if (popupContainers[i].contains(e.target)) {
        return;
      }
    }

    console.log(`close all popups`);
    closeAllPopups();
  }
}

function closeAllPopups() {
  if (_popups.length) {
    // onsole.log(`closeAllPopups`);
    const popupContainers = document.body.querySelectorAll('.react-popup');

    for (let i = 0; i < popupContainers.length; i++) {
      console.log(`unmountComponentAtNode`);
      ReactDOM.unmountComponentAtNode(popupContainers[i]);
    }

    popupClosed('*');
  }
}

function dialogOpened() {
  if (_dialogOpen === false) {
    console.log('PopupService, dialog opened');
    _dialogOpen = true;
    window.addEventListener('keydown', specialKeyHandler, true);
  }
}

function dialogClosed() {
  if (_dialogOpen) {
    console.log('PopupService, dialog closed');
    _dialogOpen = false;
    window.removeEventListener('keydown', specialKeyHandler, true);
  }
}

function popupOpened(name
/*, group*/
) {
  if (_popups.indexOf(name) === -1) {
    _popups.push(name); //onsole.log('PopupService, popup opened ' + name + '  popups : ' + _popups);


    if (_dialogOpen === false) {
      window.addEventListener('keydown', specialKeyHandler, true);
      window.addEventListener('click', outsideClickHandler, true);
    }
  }
}

function popupClosed(name
/*, group=null*/
) {
  if (_popups.length) {
    if (name === '*') {
      _popups.length = 0;
    } else {
      const pos = _popups.indexOf(name);

      if (pos !== -1) {
        _popups.splice(pos, 1);
      }
    } //onsole.log('PopupService, popup closed ' + name + '  popups : ' + _popups);


    if (_popups.length === 0 && _dialogOpen === false) {
      window.removeEventListener('keydown', specialKeyHandler, true);
      window.removeEventListener('click', outsideClickHandler, true);
    }
  }
}

class PopupService {
  static showPopup({
    name = 'anon',
    group = 'all'
    /*, depth=0*/
    ,
    position = '',
    left = 0,
    top = 0,
    width = 'auto',
    component
  }) {
    // onsole.log(`PopupService.showPopup ${name} in ${group} ${left} ${top} ${width} depth ${depth}`);
    popupOpened(name);
    let el = document.body.querySelector('.react-popup.' + group);

    if (el === null) {
      el = document.createElement('div');
      el.className = 'react-popup ' + group;
      document.body.appendChild(el);
    }

    const className = cx('popup-container', position);
    ReactDOM.render(React__default.createElement("div", {
      className: className,
      style: {
        position: 'absolute',
        left,
        top,
        width
      }
    }, component, " "), el, () => {
      PopupService.keepWithinThePage(el);
    });
  }

  static hidePopup(name = 'anon', group = 'all') {
    //onsole.log('PopupService.hidePopup name=' + name + ', group=' + group)
    if (_popups.indexOf(name) !== -1) {
      popupClosed(name);
      ReactDOM.unmountComponentAtNode(document.body.querySelector(`.react-popup.${group}`));
    }
  }

  static movePopup(x, y, name = 'anon', group = 'all') {
    const container = document.querySelector(`.react-popup.${group} .popup-container`);
    container.style.top = parseInt(container.style.top, 10) + y + 'px';
    container.style.left = parseInt(container.style.left, 10) + x + 'px';
  }

  static keepWithinThePage(el) {
    //onsole.log(`PopupService.keepWithinThePage`);
    const container = el.querySelector('.popup-container');
    const {
      top,
      left,
      width,
      height
    } = container.firstChild.getBoundingClientRect();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const overflowH = h - (top + height);

    if (overflowH < 0) {
      container.style.top = parseInt(container.style.top, 10) + overflowH + 'px';
    }

    const overflowW = w - (left + width);

    if (overflowW < 0) {
      container.style.left = parseInt(container.style.left, 10) + overflowW + 'px';
    }
  }

}
class DialogService {
  static showDialog(dialog) {
    const containerEl = '.react-dialog';
    const onClose = dialog.props.onClose;
    dialogOpened();
    ReactDOM.render(React__default.cloneElement(dialog, {
      container: containerEl,
      onClose: () => {
        DialogService.closeDialog();

        if (onClose) {
          onClose();
        }
      }
    }), document.body.querySelector(containerEl));
  }

  static closeDialog() {
    dialogClosed();
    ReactDOM.unmountComponentAtNode(document.body.querySelector('.react-dialog'));
  }

}
class Popup extends React__default.Component {
  constructor(props) {
    super(props);
    this.pendingTask = null;
  }

  render() {
    return React__default.createElement("div", {
      className: "popup-proxy"
    }, " ");
  }

  componentDidMount() {
    const domNode = ReactDOM.findDOMNode(this);

    if (domNode) {
      const el = domNode.parentElement;
      const boundingClientRect = el.getBoundingClientRect(); //onsole.log(`%cPopup.componentDidMount about to call show`,'color:green');

      this.show(this.props, boundingClientRect);
    }
  }

  componentWillUnmount() {
    PopupService.hidePopup(this.props.name, this.props.group);
  }

  componentWillReceiveProps(nextProps) {
    const domNode = ReactDOM.findDOMNode(this);

    if (domNode) {
      const el = domNode.parentElement;
      const boundingClientRect = el.getBoundingClientRect(); //onsole.log(`%cPopup.componentWillReceiveProps about to call show`,'color:green');

      this.show(nextProps, boundingClientRect);
    }
  }

  show(props, boundingClientRect) {
    const {
      name,
      group,
      depth,
      width
    } = props;
    let left, top;

    if (this.pendingTask) {
      clearTimeout(this.pendingTask);
      this.pendingTask = null;
    }

    if (props.close === true) {
      console.log('Popup.show hide popup name=' + name + ', group=' + group + ',depth=' + depth);
      PopupService.hidePopup(name, group);
    } else {
      const {
        position,
        children: component
      } = props;
      const {
        left: targetLeft,
        top: targetTop,
        width: clientWidth,
        bottom: targetBottom
      } = boundingClientRect;

      if (position === 'below') {
        left = targetLeft;
        top = targetBottom;
      } else if (position === 'above') {
        left = targetLeft;
        top = targetTop;
      }

      console.log('%cPopup.show about to setTimeout', 'color:red;font-weight:bold');
      this.pendingTask = setTimeout(() => {
        console.log(`%c...timeout fires`, 'color:red;font-weight:bold');
        PopupService.showPopup({
          name,
          group,
          depth,
          position,
          left,
          top,
          width: width || clientWidth,
          component
        });
      }, 10);
    }
  }

}

let subMenuTimeout = null;
class MenuItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasChildMenuItems: props.children && props.children.length > 0
    };
  }

  render() {
    const nestedMenu = this.props.submenuShowing ? createElement(ContextMenu, {
      doAction: this.props.doAction
    }, this.props.children) : null;
    const className = cx('menu-item', {
      disabled: this.props.disabled,
      root: this.state.hasChildMenuItems,
      showing: this.props.submenuShowing
    });
    return createElement("li", {
      className: className
    }, createElement("button", {
      tabIndex: -1,
      onClick: e => this.handleClick(e),
      onMouseOver: () => this.handleMouseOver()
    }, createElement("span", {
      className: "menu-label"
    }, this.props.label), createElement("i", {
      className: "material-icons"
    }, this.state.hasChildMenuItems ? 'arrow_right' : '')), nestedMenu);
  }

  handleClick(e) {
    e.preventDefault();

    if (this.props.disabled !== true) {
      this.props.doAction(this.props.action, this.props.data);
    }
  }

  handleMouseOver() {
    this.props.onMouseOver(this.props.idx, this.state.hasChildMenuItems, this.props.submenuShowing);
  }

}
const Separator = () => createElement("li", {
  className: "divider"
});
class ContextMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      left: props.left,
      top: props.top,
      bottom: props.bottom,
      submenuShowing: false,
      submenuIdx: null
    };
  }

  render() {
    const {
      top,
      left,
      bottom
    } = this.state;
    const children = this.props.children;
    const style = {
      position: 'absolute',
      top,
      left,
      bottom
    };
    const submenuIdx = this.state.submenuShowing ? this.state.submenuIdx : -1;
    const menuItems = children ? children.map((menuItem, idx) => cloneElement(menuItem, {
      key: String(idx),
      idx,
      action: menuItem.props.action,
      doAction: (key, data) => this.handleMenuAction(key, data),
      onMouseOver: (idx, hasChildMenuItems) => this.handleMenuItemMouseOver(idx, hasChildMenuItems),
      submenuShowing: submenuIdx === idx
    })) : null;
    return createElement("ul", {
      className: "popup-menu",
      style: style
    }, menuItems);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.left !== '100%' && nextProps.top !== 0) {
      if (nextProps.left !== this.state.left || nextProps.top !== this.state.top) {
        this.setState({
          left: nextProps.left,
          top: nextProps.top,
          submenuShowing: false,
          submenuIdx: null
        });
      }
    }
  }

  handleMenuAction(key, data) {
    if (this.props.doAction) {
      this.props.doAction(key, data);
    } else if (this.props.onAction) {
      this.props.onAction(key, data);
    }

    this.close();
  }

  handleMenuItemMouseOver(idx, hasChildMenuItems) {
    if (subMenuTimeout) {
      clearTimeout(subMenuTimeout);
      subMenuTimeout = null;
    }

    if (hasChildMenuItems) {
      if (this.state.submenuShowing !== true) {
        subMenuTimeout = setTimeout(() => this.showSubmenu(), 400);
      }

      this.setState({
        submenuIdx: idx
      });
    } else if (this.state.submenuIdx !== null) {
      this.setState({
        submenuIdx: null,
        submenuShowing: false
      });
    }
  }

  showSubmenu() {
    subMenuTimeout = null;
    this.setState({
      submenuShowing: true
    });
  }

  close() {
    PopupService.hidePopup();
  }

}
ContextMenu.defaultProps = {
  left: '100%',
  top: 0,
  bottom: 'auto'
};

export { ContextMenu, DialogService, MenuItem, Popup, PopupService, Separator };
//# sourceMappingURL=index.js.map
