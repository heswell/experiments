import React from 'react';
import Selector from '../selector';
import {searcher} from '../list';

import './select.css';

export default class Select extends React.Component {
  constructor(props){
    super(props);
    this.selector = React.createRef();

    this.onItemSelectedBySearch = this.onItemSelectedBySearch.bind(this);
    this.searchKeyHandler = searcher(props.availableValues, this.onItemSelectedBySearch);

    this.state = {
      hilitedIdx: null
    }
  }

  render(){
    return (
      <Selector ref={this.selector}
        {...this.props}
        typeaheadListNavigation
        hilitedIdx={this.state.hilitedIdx}
        onKeyDown={this.searchKeyHandler}>
        {child =>
          child === Selector.input && (
            <div tabIndex={0} className="control-text select-input">
              {this.props.value}
            </div>
          )
        }
      </Selector>
    )
  }

  onItemSelectedBySearch(hilitedIdx){
    if (hilitedIdx !== this.state.hilitedIdx){
      this.setState({
        hilitedIdx
      })
    }
  }

  focus(){
    if (this.selector.current){
      this.selector.current.focus(false)
    }
  }

}

Select.defaultProps = {
  selectedIdx: null,
  availableValues : [
    "Alabama",
    "Arizona",
    "California",
    "Colorado",
    "Florida",
    "Georgia",
    "Idaho",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Montana",
    "Missouri",
    "Mississippi",
    "Nevada",
    "New England",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Dakota",
    "Ohio",
    "Philadelphia",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Virginia"
  ]
}
