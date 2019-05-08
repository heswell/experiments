import React from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames';
import Row from './row';
import css from '../style/grid';

const GROUP_LEVEL = 1;

const contains = (arr, val) => arr.indexOf(val) !== -1;

const byKey = ([key1],[key2]) => key1 - key2;

export default class Canvas extends React.Component {

    static defaultProps = {
        left: 0
    };

    constructor(props){
      super(props);

      this.contentEl = React.createRef();

    }

    render() {

        const {
          rowHeight,
          firstVisibleRow,
          left,
          width,
          height,
          rows,
          // keyMap,
          gridModel,
          selectedRows,
          selectedCells,
          columnGroup,
          cellRenderer
        } = this.props;

        const focusCellRow = selectedCells ? selectedCells.rowIdx : -1;
        const focusCell = selectedCells ? selectedCells.idx : -1;
        const focusCellActive = focusCell !== -1 && selectedCells.active;

        // console.log(`Canvas render for rows ${rows.map(r => [r[0]])}`);

        const {RENDER_IDX} = gridModel.meta;
        this.rowPositions = rows.map((row, idx) => {
          const absIdx = firstVisibleRow + idx
          // return [keyMap[absIdx], rowHeight*absIdx, row, absIdx]
          return [row[RENDER_IDX], rowHeight*absIdx, row, absIdx]
        })
        .filter(([key]) => key !== undefined)
        .sort(byKey)

        const gridRows = this.rowPositions
        .map(([key, ,row, abs_idx]) => {

        // with multiple canvases, this all has to be repeated for each canvas
            const isFocused = this.props.focusedRow === abs_idx;
            const isSelected = contains(selectedRows,abs_idx);
            const isCellFocused = focusCellRow === abs_idx;
            const isCellEdited = isCellFocused && focusCellActive;
            const isLastSelected = isSelected && (abs_idx === rows.length-1 || !contains(selectedRows, abs_idx+1));

            //onsole.log(`${pad(row[4],50)}  ${abs_idx} key:${keyMap[abs_idx]}`);

            return this.renderRow({
                key,
                myKey: key,
                idx: abs_idx,
                row: row,
                isFocused,
                isSelected,
                isLastSelected,
                isCellEdited,
                isCellFocused,
                focusCellIdx: focusCell,
                //somehow we need to merge meta into columns
                meta: gridModel.meta,
                columns: columnGroup.columns,
                rowClass: this.props.rowClass,
                cellClass: this.props.cellClass,
                cellRenderer,
                onCellClick: this.props.onCellClick,
                onDoubleClick: this.props.onDoubleClick,
                onSelect: this.props.onSelect,
                onToggle: this.props.onToggleGroup,
                onContextMenu: this.handleContextMenuFromRow
            });
        });

        // console.log(`%c[Canvas] rowsRendered = ${gridRows.length}`,'color: red; font-weight: bold;')

        const className = cx('Canvas', this.props.className);

        return (
            <div style={{...css.Canvas,left,width,height}} className={className} 
                onContextMenu={this.handleContextMenuFromCanvas}
                onScroll={this.props.onScroll}
                onKeyDown={this.props.onKeyDown} >
                <div ref={this.contentEl} 
                    style={{...css.CanvasContent, width: Math.max(columnGroup.width,width), height}}>
                    {gridRows}
                </div>
            </div>
        );
    }

  renderRow(props) {

    const {rowRenderer, groupRowRenderer} = this.props;
    const groupLevel = props.row[GROUP_LEVEL];    
    let rowElement;

    if (groupLevel !== 0){
      if (React.isValidElement(groupRowRenderer)){
        return React.cloneElement(groupRowRenderer, props);
      } else if (groupRowRenderer && (rowElement = groupRowRenderer(props))){
        return rowElement;
      }
    }

    if (React.isValidElement(rowRenderer)) {
      return React.cloneElement(rowRenderer, props);
    } else if (rowRenderer && (rowElement = rowRenderer(props))){
      return rowElement;
    }

    return <Row {...props} />;
  }

  componentDidUpdate(){
    if (this.props.scroll){
      this.setScroll(this.props.scroll.scrollTop, this.props.scroll.scrollLeft);
    }

    const container = this.contentEl.current;
    const {rowPositions} = this;
    if (container){
      const {children, childElementCount} = container;
      for (let i=0;i<childElementCount;i++){
        const child = children[i];
        const [,offset] = rowPositions[i];
        // console.log(`row key=${child.getAttribute('data_key')} css=${child.style.cssText} expect it to be key ${key} pos ${offset}`)
        child.style.transform = `translate3d(0px, ${offset}px, 0px)`
      }

    }
  }

  getScroll() {
    // we never want to read the vertical scroll position here - that now belongs
    // on the container.
    const {scrollTop, scrollLeft} = ReactDOM.findDOMNode(this);
    return {scrollTop, scrollLeft};
  }

  setScroll(scrollTop, scrollLeft){
    const el = ReactDOM.findDOMNode(this);

    if (typeof scrollTop === 'number'){
      el.scrollTop = scrollTop;
    }

    if (typeof scrollLeft === 'number'){
      el.scrollLeft = scrollLeft;
    }

  }

  // called by viewserver
  setScrollLeft(scrollLeft){
    if (this.contentEl.current){
      this.contentEl.current.style.left = -scrollLeft + 'px';
    }
  }

  handleContextMenuFromCanvas = (e) => {
    this.props.onContextMenu(e, 'canvas');
  }

  handleContextMenuFromRow = (e, options) => {
    this.props.onContextMenu(e, 'row', options);
  }

}
