import React, { useState, useRef, useCallback } from 'react';
import cx from 'classnames';
import { PopupService, ContextMenu, MenuItem } from '@heswell/ui-controls';
import './tabstrip.css';

const OVERFLOW_WIDTH = 24;
const noop = () => {}

export const Tab = ({allowClose=true, idx, label, isSelected, onClick, onClose, onMouseDown}) => {

    // don't use useCallback
    const handleClick = e => {
        e.preventDefault();
        onClick(e, idx);
    };
    
    const handleClose = e => {
        e.stopPropagation();
        onClose(idx);
    };

    return (
        <li className={cx('Tab', {'active': isSelected})}
            onClick={handleClick}
            onMouseDown={onMouseDown}>
            <a href="#" className="tab-caption" data-idx={idx}>{label}</a>
            {allowClose &&
                <i className='material-icons close' onClick={handleClose}>close</i>}
        </li>
    );

}

const TabstripOverflow = ({onClick}) =>
    <div className='TabstripOverflow' onClick={onClick} />;

export default function Tabstrip({
    children,
    className,
    onMouseDown,
    onChange,
    style,
    value=0
}){

    const el = useRef(null);
    const [overflowing, setOverflowing] = useState(false);

    function showOverflow(){

    }

    const tabs = children.map((child, idx) => {
        const isSelected = value === idx;
        return React.cloneElement(child, {
                idx,
                isSelected,
                onClick: isSelected ? noop : onChange
        });
    });

    return (
        <div ref={el}
            className={cx('Tabstrip', className, {overflowing})}
            style={style}
            onMouseDown={onMouseDown}>
            <div className="tabstrip-inner-sleeve">
                <ul className="tabstrip-inner">{tabs}</ul>
            </div>
            {overflowing && <TabstripOverflow onClick={showOverflow} />}
        </div>
    );
}

class XXXTabstrip extends React.Component {

    componentDidMount() {
        this.checkOverflowState();
    }

    componentDidUpdate() {
        this.checkOverflowState();
        // only necesary if selection has changed or tabstrip has resized
        // make sure selected tab is in view 
        this.ensureSelectedTabisVisible();

    }

    checkOverflowState() {
        const freeSpace = this.measureFreeSpace();
        const {overflowing} = this.state;
        if (freeSpace < 0 && overflowing === false) {
            this.setState({ overflowing: true });
        } else if (freeSpace >= 0 && overflowing === true) {
            this.setState({ overflowing: false });
        }
    }

    ensureSelectedTabisVisible() {

        const tabstripInner = this.el.querySelector('.tabstrip-inner');
        const activeTab = tabstripInner.querySelector('.active.Tab');
        if (!activeTab) {
            // eg if dragging;
            return;
        }

        const tsBox = this.el.getBoundingClientRect();
        const tbBox = activeTab.getBoundingClientRect();
        const ulBox = tabstripInner.getBoundingClientRect();

        const tbOffStageRight = Math.floor(tsBox.right - tbBox.right);
        const ulOffStageLeft = Math.floor(ulBox.left - tsBox.left);
        const overflowing = ulBox.right > tbBox.right;
        let translateX;

        if (ulOffStageLeft === 0 && tbOffStageRight < 0) {
            translateX = ulOffStageLeft + tbOffStageRight - OVERFLOW_WIDTH;
            tabstripInner.style.transform = `translate(${translateX}px,0px)`;
        } else if (ulOffStageLeft < 0 && tbOffStageRight === OVERFLOW_WIDTH) {
            // no action necessary
        } else if (ulOffStageLeft < 0 && tbOffStageRight < OVERFLOW_WIDTH) {
            translateX = ulOffStageLeft + tbOffStageRight - OVERFLOW_WIDTH;
            tabstripInner.style.transform = `translate(${translateX}px,0px)`;
        } else if (overflowing && tbOffStageRight < OVERFLOW_WIDTH) {
            translateX = tbOffStageRight - OVERFLOW_WIDTH;
            tabstripInner.style.transform = `translate(${translateX}px,0px)`;
        } else if (ulOffStageLeft < 0) {
            translateX = Math.min(0, ulOffStageLeft + tbOffStageRight - OVERFLOW_WIDTH);
            tabstripInner.style.transform = `translate(${translateX}px,0px)`;
        }
    }

    measureFreeSpace() {
        const tabstripInner = this.el.querySelector('.tabstrip-inner');
        return this.el.clientWidth - tabstripInner.clientWidth;
    }

    showOverflow(){
        const overflow = this.el.querySelector('.TabstripOverflow')
        const { right, bottom } = overflow.getBoundingClientRect();
        const {children: tabs} = this.props;
        const menuItems = tabs.map(({props: {text}}) =>
            <MenuItem key={text} action='setActiveTab' label={text} data={text} />);

        PopupService.showPopup({
            left: right,
            top: bottom,
            position: 'top-bottom-right-right',
            component: (
                <ContextMenu component={this} doAction={(action, data) => this.handleContextMenuAction(action, data)}
                    left='auto' bottom='auto' right={0} top={0}>
                    {menuItems}
                </ContextMenu>
            )
        });
    }

    handleContextMenuAction(action, data){
        if (action === 'setActiveTab'){
            const idx = this.props.children.findIndex(tab => tab.props.text === data);
            if (idx !== -1) {
                this.handleTabClick(idx);
            }
        }
    }
}
