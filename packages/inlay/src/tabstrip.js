import React from 'react';
import cx from 'classnames';
import { PopupService, ContextMenu, MenuItem } from '@heswell/ui-controls';
import './tabstrip.css';

const OVERFLOW_WIDTH = 24;

function handleClick(e,idx, onClick){
    e.preventDefault();
    onClick(idx);
}

export const Tab = ({idx, text, isSelected, onClick, onMouseDown}) =>
    <li className={cx('Tab', {'active': isSelected})}
        onClick={e => handleClick(e, idx, onClick)}
        onMouseDown={onMouseDown}>
        <a href="#" className="tab-caption" data-idx={idx}>{text}</a>
    </li>

const TabstripOverflow = ({onClick}) =>
    <div className='TabstripOverflow' onClick={onClick} />;

export default class Tabstrip extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            overflowing: false
        };
        this.el = null;
    }


    render() {

        const { style, children, onMouseDown, selected=0 } = this.props;
        const {overflowing} = this.state;
        const className = cx('Tabstrip', this.props.className, {overflowing});

        const tabs = children.map((child, idx) => {
            return (
                React.cloneElement(child, {
                    idx,
                    isSelected: selected === idx,
                    onClick: i => this.handleTabClick(i)
                }));
        });

        return (
            <div className={className} style={style} onMouseDown={onMouseDown} ref={el => this.el = el}>
                <div className="tabstrip-inner-sleeve">
                    <ul className="tabstrip-inner">{tabs}</ul>
                </div>
                {overflowing && <TabstripOverflow onClick={() => this.showOverflow()} />}
            </div>
        );
    }

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

     handleTabClick(selectedIdx){
        if (selectedIdx !== this.props.selected) {
            this.props.onSelectionChange(this.props.selected, selectedIdx);
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
