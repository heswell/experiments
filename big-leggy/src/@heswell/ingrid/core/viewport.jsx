import React from 'react';
import Canvas from './canvas';
import css from '../style/grid';
import SelectionModel from '../model/selectionModel';
import * as Action from '../model/actions';
import { groupHelpers } from '../../data';

export default class Viewport extends React.Component {

    constructor(props) {

        super(props);

        this.scrollingCanvas = React.createRef();
        this.verticalScrollContainer = React.createRef();
        this.scrollableContainerEl = React.createRef();

        this.verticalScrollTimer = null;

        const selectionState = SelectionModel.getInitialState(props);

        //TODO selectionModel needs to be configured with selectionMode and probably 
        // passed down from grid or created here
        this.state = {
            ...selectionState
        };

        const { height, gridModel } = props;
        this.numberOfRowsInViewport = Math.ceil(height / gridModel.rowHeight) + 1;

        this.scrollTop = 0;
        this.firstVisibleRow = 0;

    }

    handleToggleGroup = groupRow => {
        const { dispatch, gridModel: model } = this.props;
        const groupState = groupHelpers.toggleGroupState(groupRow, model);
        dispatch({ type: Action.TOGGLE, groupState });
    }

    onVerticalScroll = (e) => {
        if (e.target === e.currentTarget) {
            if (this.verticalScrollTimer) {
                window.cancelAnimationFrame(this.scrollTimer);
            }
            this.scrollTop = e.target.scrollTop;
            this.verticalScrollTimer = requestAnimationFrame(() => {
                this.handleVerticalScroll();
                this.verticalScrollTimer = null;
            });
        }
    }

    handleVerticalScroll = () => {

        const { gridModel: {rowHeight}, dataView, onVerticalScroll } = this.props;
        const firstVisibleRow = Math.floor(this.scrollTop / rowHeight)
        if (firstVisibleRow !== this.firstVisibleRow) {
            dataView.setRange(firstVisibleRow, firstVisibleRow + this.numberOfRowsInViewport);
            this.firstVisibleRow = firstVisibleRow;
        }

        onVerticalScroll && onVerticalScroll(this.scrollTop);

    }

    handleHorizontalScroll = e => {
        if (e.target === e.currentTarget) {
            const scrollLeft = e.target.scrollLeft;
            this.setScroll(null, scrollLeft);
            if (this.props.onHorizontalScroll) {
                this.props.onHorizontalScroll(scrollLeft);
            }
        }
    }


    scrollTo(scrollLeft) {
        this.scrollableContainerEl.current.scrollLeft = scrollLeft;
    }

    setScroll(scrollTop, scrollLeft) {
        if (typeof scrollTop === 'number') {
            this.verticalScrollContainer.current.scrollTop = scrollTop;
        }

        if (typeof scrollLeft === 'number' && this.scrollingCanvas.current) {
            this.scrollingCanvas.current.setScrollLeft(scrollLeft)
        }
    }

    // should this be handled here or at the grid level ?
    selectionHandler = (idx, selectedItem, rangeSelect, incrementalSelection) => {
        const { selectionModel } = this.props.gridModel;
        const { selected, lastTouchIdx } = SelectionModel.handleItemClick(selectionModel, this.state, idx, selectedItem, rangeSelect, incrementalSelection);
        // we must also allow selected to be injected via props
        this.setState({ idx, selected, lastTouchIdx }, () => {
            if (this.props.onSelectionChange) {
                this.props.onSelectionChange(selected, idx, selectedItem);
            }
        });
    }

    componentWillReceiveProps(nextProps) {
        // TODO are we supporting selectedRows ?
        if (SelectionModel.selectionDiffers(nextProps.selectedRows, this.state.selected)) {
            this.setState(SelectionModel.getInitialState(nextProps));
        }
    }

    render() {

        //TODO rowHeight is on the gridModel
        const { gridModel: model, style,
            ...props } = this.props;
        const { height, width, rows } = props;
        const { firstVisibleRow } = this;
        const horizontalScrollingRequired = model.totalColumnWidth > model.displayWidth;
        const maxContentHeight = horizontalScrollingRequired ? height - 15 : height; // we should know the scrollbarHeight
        //TODO move contentHeight to model 
        const contentHeight = Math.max(model.rowHeight * model.rowCount, maxContentHeight);
        const commonSpec = {
            rows,
            rowHeight: model.rowHeight,
            firstVisibleRow,
            height: contentHeight,
            selectedRows: this.state.selected
        };

        // we shouldn't need to change this but chrome does not handle this correctly - vertical scrollbar is still
        // displayed even when not needed, when grid is stretched.
        const overflow = model.displayWidth === width ? 'hidden' : 'auto';

        return (
            <div className='Viewport' style={{ ...css.Viewport, ...style }}>

                {horizontalScrollingRequired &&
                    model._groups.filter(colGroup => !colGroup.locked).map((colGroup, idx) =>
                        <div className='CanvasScroller horizontal scrollable-content'
                            ref={this.scrollableContainerEl}
                            key={idx} style={{ left: colGroup.renderLeft, width: colGroup.renderWidth }}
                            onScroll={this.handleHorizontalScroll}>

                            <div className='CanvasScroller-content' style={{ width: colGroup.width, height: 15 }} />
                        </div>
                    )
                }

                <div className='ViewportContent scrollable-content'
                    ref={this.verticalScrollContainer}
                    style={{ ...css.ViewportContent, bottom: horizontalScrollingRequired ? 15 : 0, overflow }}
                    onScroll={this.onVerticalScroll} >

                    <div className='scrolling-canvas-container'
                        style={{ width: model.displayWidth, height: contentHeight }}>

                        {/* this.renderGutters(model, commonSpec)*/}

                        {
                            // ideally, we want to give each Canvas a 'view' of the gridModel
                            // that only allows it to see its own group - like a lens

                            model._groups.map((columnGroup, idx) =>
                                <Canvas
                                    key={idx}
                                    // keyMap={keyMap}
                                    {...props} /* onSelectionChange,onCellClick */
                                    {...commonSpec}
                                    gridModel={model}
                                    className={columnGroup.locked ? 'fixed' : undefined}
                                    ref={columnGroup.locked ? null : this.scrollingCanvas}
                                    columnGroup={columnGroup}
                                    left={columnGroup.renderLeft}
                                    width={columnGroup.renderWidth}
                                    focusedRow={this.state.focusedIdx}
                                    onToggleGroup={this.handleToggleGroup}
                                    onSelect={this.selectionHandler} />
                            )}
                    </div>
                </div>
            </div>
        );
    }
}