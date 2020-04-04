// @ts-nocheck
import React from 'react';
import cx from 'classnames';
import css from '../style/grid';

class GroupHeader extends React.Component {

    render(){

        //TODO allow the groupHeader to be custom configured
        const {width, group, groupHeader} = this.props;

        const symbol = group.collapsed ? ' + ' : ' - ';

        return (
            <div className='GroupHeader' style={{position:'absolute',top:0,left:0,height:'100%',width:25,lineHeight:'23px'}}>
              <span onClick={this.toggleDisplay.bind(this)} style={{display:'inline-block',width:25,textAlign:'center',cursor:'pointer'}}>{symbol}</span>
              {groupHeader ? <div style={{position:'absolute',top:0,left:25,width:width-25,height:'100%'}}>  
                <span style={{padding:'0 6px 0 6px'}}>{group.fieldName.toUpperCase()}:</span>
                <span style={{padding:'0 6px 0 6px'}}>{group.fieldValue}</span>
              </div> : null}
            </div>
        );
    }

    toggleDisplay(){
        this.props.onToggle(this.props.group);
    }
}

export default class Gutter extends React.Component<any, any>{

  render() {

    const {left, width, height, depth, rowHeight, displayStart, gridDisplayWidth, onToggle} = this.props;
    const cells = this.props.rows.map((row, idx, data) => {
            
        // with multiple canvases, this all has to be repeated for each canvas
        const abs_idx = displayStart + idx;
        const style = {position:'absolute',top:rowHeight*abs_idx, height: rowHeight, width:'100%', backgroundColor:'yellow'};
        const isGroup = false /*(row instanceof Group) && row.depth === depth*/;

        return (
          <div key={idx} style={style as any}>
            {isGroup ? <GroupHeader width={gridDisplayWidth-(width*depth)} group={row} onToggle={onToggle}/> : null}
          </div>
        );

    });
  
    const className = cx('Gutter', this.props.className);

    return (
      <div style={{...css.Gutter,left,width,height,zIndex:1+(10-depth)} as any} className={className}  >
        {cells}
      </div>
    );
  }

}
