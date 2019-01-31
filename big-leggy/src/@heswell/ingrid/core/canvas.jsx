import React from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames';
import Row from './row';
import css from '../style/grid';

const GROUP_LEVEL = 1;

const contains = (arr, val) => arr.indexOf(val) !== -1;

export default class Canvas extends React.Component {

    static defaultProps = {
        left: 0
    };

    contentEl;

    render() {

        const {rowHeight, firstVisibleRow, left, width, height, rows,
            keyMap, selectedRows, selectionDefault, selectedCells, columnGroup, cellRenderer} = this.props;

        const focusCellRow = selectedCells ? selectedCells.rowIdx : -1;
        const focusCell = selectedCells ? selectedCells.idx : -1;
        const focusCellActive = focusCell !== -1 && selectedCells.active;

        // console.log(`Canvas render for rows ${rows.map(r => [r[0]])}`);

        // const SPACES = '                                                ';
        // function pad(str,len){
        //     return (str+SPACES).slice(0,len);
        // }

        const gridRows = rows.map((row, idx, data) => {

        // with multiple canvases, this all has to be repeated for each canvas
            const abs_idx = firstVisibleRow + idx;
            const isFocused = this.props.focusedRow === abs_idx;
            const isSelected = selectionDefault !== true
                ? contains(selectedRows,abs_idx)
                : !contains(selectedRows,abs_idx);

            const isCellFocused = focusCellRow === abs_idx;
            const isCellEdited = isCellFocused && focusCellActive;
            const isLastSelected = isSelected && (abs_idx === data.length-1 || !contains(selectedRows, abs_idx+1));

            //onsole.log(`${pad(row[4],50)}  ${abs_idx} key:${keyMap[abs_idx]}`);

            return this.renderRow({
                key: keyMap[abs_idx],
                myKey: keyMap[abs_idx],
                idx: abs_idx,
                row: row,
                style: {transform: `translate3d(0px,${rowHeight*abs_idx}px,0)`,height: rowHeight},
                isFocused,
                isSelected,
                isCellEdited,
                isCellFocused,
                focusCellIdx: focusCell,
                isLastSelected,
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

        const className = cx('Canvas', this.props.className);

        return (
            <div style={{...css.Canvas,left,width,height}} className={className} 
                onContextMenu={this.handleContextMenuFromCanvas}
                onScroll={this.props.onScroll}
                onKeyDown={this.props.onKeyDown} >
                <div ref={component => this.contentEl = ReactDOM.findDOMNode(component)} 
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

  handleContextMenuFromCanvas = (e) => {
    this.props.onContextMenu(e, 'canvas');
  }

  handleContextMenuFromRow = (e, options) => {
    this.props.onContextMenu(e, 'row', options);
  }

}
