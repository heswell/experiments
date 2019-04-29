import React from 'react';
import Canvas from './canvas';
import css from '../style/grid';
import KeyMap from '../utils/keyMap';
import SelectionModel from '../model/selectionModel';
import * as Action from '../model/actions';
import { groupHelpers } from '../../data';

export default class Viewport extends React.Component {

    static defaultProps = {
        rowHeight: 30
    };

    verticalScrollContainer;
    scrollableContainerEl;
    scrollTop = 0;
    viewState;

    constructor(props){

        super(props);

        this.scrollingCanvas = React.createRef();

        this.verticalScrollTimer = null;

        const selectionState = SelectionModel.getInitialState(props);

        //TODO selectionModel needs to be configured with selectionMode and probably 
        // passed down from grid or created here
        this.state = {
            ...selectionState
        };

        this.viewState = this.getState(props, props);

    }

    handleToggleGroup = groupRow => {
        console.log(`handleToggleGroup this === ${typeof this}`)
        const {dispatch, gridModel: model} = this.props;
        console.log(`handleToggleGroup model === ${typeof model.columnMap}`)
        const groupState = groupHelpers.toggleGroupState(groupRow, model);
        dispatch({ type: Action.TOGGLE, groupState });      
    }

    setRange(lo, hi){
        this.props.dispatch({type: Action.RANGE, lo, hi});
    }

    render() {

        //TODO rowHeight is on the gridModel
        const { gridModel: model, style,
            /*onSetRange, onVerticalScroll, onHorizontalScroll, onSelectionChange,*/
            ...props} = this.props;
        const {height, width, rows} = props;
        const { keyMap, firstVisibleRow } = this.viewState;
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
        // onsole.log('Viewport.render KeyMap ' + JSON.stringify(keyMap,null,2));

        return (
            <div className='Viewport' style={{...css.Viewport, ...style}}>

                { horizontalScrollingRequired &&
                    model._groups.filter(colGroup => !colGroup.locked).map((colGroup, idx) =>
                        <div className='CanvasScroller horizontal scrollable-content'
                            ref={el => this.scrollableContainerEl = el}
                            key={idx} style={{left: colGroup.renderLeft, width: colGroup.renderWidth}}
                            onScroll={this.handleHorizontalScroll}>

                            <div className='CanvasScroller-content' style={{width: colGroup.width, height: 15}} />
                        </div>
                    )
                }

                <div className='ViewportContent scrollable-content'
                    ref={el => this.verticalScrollContainer= el}
                    style={{...css.ViewportContent, bottom: horizontalScrollingRequired ? 15 : 0, overflow}}
                    onScroll={this.onVerticalScroll} >

                    <div className='scrolling-canvas-container'
                        style={{width: model.displayWidth, height: contentHeight}}>

                        {/* this.renderGutters(model, commonSpec)*/}

                        {
                            // ideally, we want to give each Canvas a 'view' of the gridModel
                            // that only allows it to see its own group - like a lens
                            
                            model._groups.map((columnGroup, idx) =>
                                <Canvas
                                    key={idx}
                                    keyMap={keyMap}
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
                                    onSelect={this.selectionHandler}/>
                            )}
                    </div>
                </div>
            </div>
        );
    }

    // should this be handled here or at the grid level ?
    selectionHandler = (idx, selectedItem, rangeSelect, incrementalSelection) => {
        const {selectionModel} = this.props.gridModel;
        const {selected, lastTouchIdx} = SelectionModel.handleItemClick(selectionModel, this.state, idx, selectedItem, rangeSelect, incrementalSelection);
        // we must also allow selected to be injected via props
        this.setState({idx, selected, lastTouchIdx},() => {
            if (this.props.onSelectionChange) {
                this.props.onSelectionChange(selected, idx, selectedItem);
            }
        });
    }

    componentWillMount(){

        const {firstVisibleRow, numberOfRowsInViewport} = this.viewState;
        this.setRange(firstVisibleRow,firstVisibleRow+numberOfRowsInViewport, true);

    }

    componentWillReceiveProps(nextProps){

        let rangeSet = false;
        let viewState = this.viewState;

        if (this.props.gridModel.rowHeight !== nextProps.gridModel.rowHeight ||
            this.props.height !== nextProps.height ||
            this.props.gridModel.rowCount !== nextProps.gridModel.rowCount){
            //onsole.log(`Viewport.componentWillReceveProps call getState height:${nextProps.height} length:${nextProps.length}`);
            const newState = this.getState(this.viewState, nextProps);
            const {firstVisibleRow, numberOfRowsInViewport} = newState;
            if (numberOfRowsInViewport !== viewState.numberOfRowsInViewport){
                // This will escalate to Grid, which will reset rows, but viewport is going to re-render before that, potentially with
                // invalid no of rows (i.e. mismatch between rows and keys)
                this.setRange(firstVisibleRow,firstVisibleRow+numberOfRowsInViewport)
                rangeSet = true;
            }
            this.viewState = viewState = newState;
        }

        if (nextProps.gridModel.rowCount !== this.props.gridModel.rowCount && !rangeSet){
            const {firstVisibleRow, numberOfRowsInViewport} = viewState;
            this.setRange(firstVisibleRow,firstVisibleRow+numberOfRowsInViewport)
            if (this.scrollTop !== 0){
                console.log(`rowcount change and we're not at top of viewport, do we need to scroll down ?`)

            }
        }

        if (SelectionModel.selectionDiffers(nextProps.selectedRows, this.state.selected)){
            this.setState(SelectionModel.getInitialState(nextProps));
        }

    }

    onVerticalScroll = (e) => {
        if (e.target === e.currentTarget){

            if (this.verticalScrollTimer){
                console.log(`cancel animation frame`)
                window.cancelAnimationFrame(this.scrollTimer);
            }

            this.scrollTop = e.target.scrollTop;

            this.verticalScrollTimer = requestAnimationFrame(() => {
                this.handleVerticalScroll();
                this.verticalScrollTimer = null;
            });
        } else {
            console.log(`what the hell is this`)
        }
    }

    handleVerticalScroll = () => {

        const scrollTop = this.scrollTop;

        const { scrollLeft, firstVisibleRow: prevFirst } = this.viewState;
        this.viewState = this.getState({ scrollTop, scrollLeft }, this.props);

        if (this.viewState.firstVisibleRow !== prevFirst) {
            const { firstVisibleRow, numberOfRowsInViewport } = this.viewState;
            this.setRange(firstVisibleRow, firstVisibleRow + numberOfRowsInViewport);
        }

        if (this.props.onVerticalScroll) {
            this.props.onVerticalScroll(scrollTop);
        }

    }

    handleHorizontalScroll = e => {

        if (e.target === e.currentTarget){

            const scrollLeft = e.target.scrollLeft;

            this.setScroll(null, scrollLeft);

            if (this.props.onHorizontalScroll) {
                this.props.onHorizontalScroll(scrollLeft);
            }

        }
    }

    scrollTo(scrollLeft){
        this.scrollableContainerEl.scrollLeft = scrollLeft;
    }

    setScroll(scrollTop, scrollLeft) {
        if (typeof scrollTop === 'number'){
            this.verticalScrollContainer.scrollTop = scrollTop;
        }

        if (typeof scrollLeft === 'number' && this.scrollingCanvas.current){
            this.scrollingCanvas.current.setScrollLeft(scrollLeft)
        }
    }
    
    getState({scrollTop=0, scrollLeft=0}, {rows, height, gridModel}){
        const {IDX} = this.props.gridModel.meta;
        const indexOfFirstRow = rows.length ? rows[0][IDX] : -1;
        const {totalColumnWidth, displayWidth} = gridModel;
        const numberOfRowsInViewport = visibleRows(height, gridModel.rowHeight, scrollTop, totalColumnWidth, displayWidth);
        const firstVisibleRow = Math.floor(scrollTop / gridModel.rowHeight);
        const keyMap = (this.viewState && this.viewState.keyMap)
            ? this.viewState.keyMap.moveTo(firstVisibleRow, firstVisibleRow + numberOfRowsInViewport, indexOfFirstRow)
            : new KeyMap(0, numberOfRowsInViewport, indexOfFirstRow);

        return {
            numberOfRowsInViewport,
            firstVisibleRow,
            scrollTop,
            scrollLeft,
            keyMap
        };
    }
}

function visibleRows(height, rowHeight, scrollTop, totalColumnWidth, displayWidth){
    //TODO should not hard code the scrollbar height
    // onsole.log(`visibleRows height=${height} rowHeight=${rowHeight} Math.ceil=${Math.ceil(height / rowHeight)} 
    //     totalColumnWidth=${totalColumnWidth} displayWidth=${displayWidth} scrollTop=${scrollTop}`);

    const offset = scrollTop % rowHeight ? 1 : 0;
    return (totalColumnWidth > displayWidth)

        ? Math.ceil((height-15) / rowHeight) + offset
        : Math.ceil(height / rowHeight) + offset;
}
