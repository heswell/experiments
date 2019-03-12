import React from 'react'

import './index.css'

export default class LargeScrollingList extends React.Component {

    constructor(props){
      super(props)
        
      const {height, rowHeight, rowCount} = props;
      
      this.viewportHeight = height;                   
      this.rowHeight = rowHeight;                    
      this.virtualContentHeight = rowHeight * rowCount;
      this.actualContentHeight =  1000000;
      this.pageHeight = this.actualContentHeight / 100;
      this.pageCount = Math.ceil(this.virtualContentHeight / this.pageHeight);
      // the coefficient of 'jumpiness'
      this.cj = (this.virtualContentHeight - this.actualContentHeight) / (this.pageCount - 1);
     
      this.pageIdx = 0;
      this.pageOffset=0;
      this.prevScrollTop = 0;
      this.rows = {};
    }
  
    render(){
      return [
        <div key='viewport' className='viewport' ref={el => this.viewport = el} style={{height: this.viewportHeight}}>
          <div className='content' ref={el => this.content = el} style={{height: this.actualContentHeight}}></div>
        </div>,
        <div key='debug' className='debug' ref={el => this.debug = el}></div>
      ]
    }
  
    shouldComponentUpdate(){
      return false;
    }
  
    componentDidMount(){
      if (this.viewport){
        this.viewport.addEventListener('scroll', this.onScroll);
        this.onScroll();
      }
    }
  
    onScroll = () =>{
      var scrollTop = this.viewport.scrollTop;
      
      if (Math.abs(scrollTop-this.prevScrollTop) > this.viewportHeight) 
          this.onJump();
      else
          this.onNearScroll();
      
      this.renderViewport();
      
      this.logDebugInfo();
  
    }
  
  
    onNearScroll = () =>{
      var scrollTop = this.viewport.scrollTop;
      
      // next pageIdx
      if (scrollTop + this.pageOffset > (this.pageIdx+1)*this.pageHeight) {
          this.pageIdx++;
          this.pageOffset = Math.round(this.pageIdx * this.cj);
          this.viewport.scrollTop = this.prevScrollTop = scrollTop - this.cj;
          this.removeAllRows();
      }
      // prev pageIdx
      else if (scrollTop + this.pageOffset < this.pageIdx*this.pageHeight) {
          this.pageIdx--;
          this.pageOffset = Math.round(this.pageIdx * this.cj);
          this.viewport.scrollTop = this.prevScrollTop = scrollTop + this.cj;
          this.removeAllRows();
      }
      else
          this.prevScrollTop = scrollTop;
      
    }
  
    onJump = () =>{
      var scrollTop = this.viewport.scrollTop;
      this.pageIdx = Math.floor(scrollTop * ((this.virtualContentHeight-this.viewportHeight) / (this.actualContentHeight-this.viewportHeight)) * (1/this.pageHeight));
      this.pageOffset = Math.round(this.pageIdx * this.cj);
      this.prevScrollTop = scrollTop;
      
      this.removeAllRows();
    }
  
    removeAllRows = () => {
      for (var i in this.rows) {
        this.content.removeChild(this.rows[i]);
        delete this.rows[i];
    }
  }
  
    renderViewport = () =>{
      // calculate the viewport + buffer
      var y = this.viewport.scrollTop + this.pageOffset,
          buffer = this.viewportHeight,
          top = Math.floor((y-buffer)/this.rowHeight),
          bottom = Math.ceil((y+this.viewportHeight+buffer)/this.rowHeight);
      
      top = Math.max(0,top);
      bottom = Math.min(this.virtualContentHeight/this.rowHeight,bottom);
      
      // remove rows no longer in the viewport
      for (var i in this.rows) {
          if (i < top || i > bottom) {
              this.content.removeChild(this.rows[i]);
              delete this.rows[i];
          }
      }
      
      // add new rows
      for (var i=top; i<=bottom; i++) {
          if (!this.rows[i])
              this.rows[i] = this.renderRow(i);
      }
    }
  
    logDebugInfo = () =>{
      this.debug.innerHTML = `
        pageCount = ${this.pageCount} (no of pages)<br>
        pageHeight = ${this.pageHeight} (pageIdx height)<br>
        cj = ${this.cj} <br>
        <hr>
        pageIdx = ${this.pageIdx} <br>
        pageOffset = ${this.pageOffset} <br>
        virtual y = ${this.prevScrollTop + this.pageOffset}<br>
        real y = ${this.prevScrollTop} <br>
        rows in the DOM = ${this.content.childElementCount} <br>
      `;
    }
  
    renderRow = (row) => {
      const div = document.createElement('div');
      div.className = 'row';
      div.style.cssText = `top:${row*this.rowHeight-this.pageOffset}px;height:${this.rowHeight}px`;
      div.innerText = `row ${row+1}`;
      this.content.appendChild(div);
      return div;
    }
  
  }
  