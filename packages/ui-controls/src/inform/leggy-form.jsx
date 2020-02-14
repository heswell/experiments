import React from 'react';
import cx from 'classnames';
import { Machine} from 'xstate';
import {states} from '../state-machinery/machines/main'
import * as StateEvt from '../state-machinery/state-events';
import Field, {getFieldIdx} from './leggy-field.jsx';
import {getKeyboardEvent} from '../utils/key-code';
import './leggy-form.css';

export const DOWN = 'down';
export const UP = 'up';
export const RIGHT = 'right';
export const LEFT = 'left';

function runActions(actions, ctx, evt) {
  actions.forEach(action => action.exec(ctx, evt))
}

const Row = ({className, children}) => (
  <div className={className}>{children}</div>
)

export class LeggyForm extends React.Component {
  constructor(props){
    super(props);
    this.currentField = null;
    this.currentColumn = null;
    this.ignoreFocus = false;
    this.el = React.createRef();
    this.fieldRefs = [];

    const {model} = props;

    this.state = {
      model,
      rowIdx: 0,
      data: this.props.data
    }

    const stateOptions = {
      actions: {
          setField: (model, evt) => {
            const {field, compositeFieldIdx: idx=null} = evt;
            console.log(`%c[action] setField [${idx}]`,'color: brown; font-weight: bold');
            this.setCurrentField(model.setCurrentField(field, idx),idx);
          },
          setNextField: (model, evt) => {
            console.log(`%c[action] setCurrentField`,'color: brown; font-weight: bold');
            this.setCurrentField(model.setNextField(evt, evt.field));
          },
          setNextCompositeField: model => {
            console.log(`setNextCompositeField`)
            model.setNextCompositeFieldType();
            this.setCompositeField();
          },
          resetField: (model) => {
            console.log(`setNextCompositeField`)
            model.currentField = null;
          },
          resetCompositeType: model => model.resetCompositeFieldType(),
          commit: (ctx) => {
              return console.log(`COMMIT changes for  ${ctx.fields[ctx.idx].name}`);
          }
      }
    }
    

    this.stateMachine = new Machine(states, stateOptions, model);
    this.currentState = this.stateMachine.initialState;

    this.handleCommit = this.handleCommit.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleFocusCapture = this.handleFocusCapture.bind(this);
    this.createFieldRef = this.createFieldRef.bind(this);
    this.handleBlurCapture = this.handleBlurCapture.bind(this);
  }

  // componentDidMount(){
  //   this.el.current.addEventListener('focusout', this.handleBlur);
  // }

  createFieldRef(field){
    if (field.props.field){
      this.fieldRefs[field.props.field.tabIdx] = field;
    }
  }

  render(){
    const {model} = this.state;

    // onBlurCapture={this.handleBlurCapture}
    return (
      <div className="leggy-form" ref={this.el}
           onFocusCapture={this.handleFocusCapture}>
        <div className="add-leg-bar"><span>+</span></div>
        {this.buildRows(model)}
      </div>
    )
  }

  buildRows(model){
    return model.rows.map((row,idx) => {
      const className = cx('field-row', {
        'head-row': idx === 0,
        'empty-row': row.isEmpty
      })
      return (
        <Row className={className} key={idx}>
          {!row.isEmpty && 
           <div className="field-label">{row.label}</div>
          }
          {row.fields.map((field, idx) => 
            // maybe handle all these at the top level rather than register handlers on every field ?
            // TODO the ref breaks when form is unmounted
            <Field key={idx}
              ref={this.createFieldRef}
              leg={idx}
              field={field}
              onClickCapture={this.handleClick}
              onKeyDown={this.handleKeyDown}
              onCommit={this.handleCommit}
              onCancel={this.handleCancel}
              model={this.state.data}
              render={this.props.children}
              onFocusControl={this.handleFocus}/>
          )}
        </Row>
      )
    })

  }

  handleFocusCapture(e){
    if (this.currentState.matches('inactive')){
      // register clickAway listener
      const fieldIdx = getFieldIdx(e.target);
      const field = this.state.model.fields[fieldIdx];
      console.log(`>>>>>>> focus in [${fieldIdx}]  ${JSON.stringify(field)}`)

      const stateEvt = {
        ...StateEvt.FOCUS,
        field,
        compositeFieldIdx: 0
      }
      this.stateTransition(stateEvt);

    }
    e.stopPropagation(); // so focus will not fire on control
    // maybe we always stopPropagation to supress focus events ?
  }

  handleFocus(field, compositeFieldIdx=0){
    console.log(`[leggy-form] handleFocus [${compositeFieldIdx}] ${field.type} ignoreFocus=${this.ignoreFocus}
      field ${field.id} (current field ${this.state.model.currentField ? this.state.model.currentField.id: null})`)
    
      if (this.ignoreFocus){
      this.ignoreFocus = false;
    } else if (field !== this.state.model.currentField || compositeFieldIdx !== this.state.model.compositeFieldIdx){
        console.log(`\t...StateTransition CLICK`)
        const stateEvt = {
          ...StateEvt.CLICK, // should this be FOCUS ?
          field,
          compositeFieldIdx
        }
        this.stateTransition(stateEvt);
    }
  
  } 

  // prolem - this triggers when we open a popup list which captures focus
  handleBlurCapture(e){
    const focusWithin = this.el.current.contains(e.relatedTarget);
    if (!focusWithin){
      const stateEvt = {
        ...StateEvt.BLUR
      }
      this.stateTransition(stateEvt);
    }
  }

  handleCommit(field){
    const {event} = this.currentState;
    if (event !== StateEvt.TAB){
      console.log(`[leggy-form] handleCommit ${JSON.stringify(field)} ${this.state.model.compositeFieldIdx}`)
      // if commit was triggered by blur, because user used TAB, transition has already happened.
      this.stateTransition({...StateEvt.COMMIT, field});  
    }
  }

  handleCancel(){
    this.stateTransition(StateEvt.ESC);// Should be cancel
    // We may be receiving control back from focussed model, make sure focus
    // returns to same field...
    const {currentField, compositeFieldIdx} = this.state.model;
    this.setCurrentField(currentField, compositeFieldIdx);
  }

  handleClick(field, compositeFieldIdx){

    if (field !== this.state.model.currentField){
      const stateEvt = {
        ...StateEvt.CLICK,
        field,
        compositeFieldIdx
      }
      this.stateTransition(stateEvt);

    }

    // if (field === this.state.model.currentField && this.currentState.matches('focus')){
    //   // we can't rely on focus to handle click events when element clicked already
    //   // had focus - what about composites ? 
    //   const stateEvt = {
    //     ...StateEvt.CLICK,
    //     field,
    //     compositeFieldIdx
    //   }
    //   this.stateTransition(stateEvt);
    // }
  }

  stateTransition(stateEvt){
    // if (stateEvt.type === 'click' && this.currentState.matches('edit')){
    //   debugger;
    // }
    console.group(`%c${stateEvt.type} => from ${JSON.stringify(this.currentState.value)}  target=[${stateEvt.compositeFieldIdx}]`, 'color: blue;font-weight: bold;')
    const s2 = this.currentState = this.stateMachine.transition(this.currentState, stateEvt)
    runActions(s2.actions, s2.context, stateEvt);
    console.log(`%c    => ${JSON.stringify(this.currentState.value)} [${this.currentState.context.compositeFieldIdx}]`, 'color: blue;font-weight: bold;');
    console.groupEnd();
  }

  handleKeyDown(e){
    // console.log(`keyDown ${e.keyCode} ${e.key}`)
    const stateEvt = getKeyboardEvent(e);
    if (stateEvt){
      const startingField = this.currentField;
      const {compositeFieldIdx} = this.state.model;
      this.stateTransition(stateEvt);
      // TODO how can we eliminate this logic - we need a simple indication of whether
      // key has been handled already - a model method ? 
      // Don't swallow tab if the control being edited may need it 
      const tabbed = (StateEvt.isTabNavEvt(stateEvt)) &&
        (this.currentField !== startingField ||
          compositeFieldIdx !== this.state.model.compositeFieldIdx );
      // In what scenario do we need this treatment of ESC ?
      if ((this.currentState.matches('focus') && stateEvt !== StateEvt.ESC) || tabbed){
        console.log(`stop event propagation`)
        e.stopPropagation();
        e.preventDefault();
      }
    }
  }

  setCompositeField(field=this.currentField){
    const idx = this.state.model.compositeFieldIdx;
    const fieldComponent = this.fieldRefs[field.tabIdx];
    if (fieldComponent){
      console.log(`setCompositeField focus on composite field, tabIndex ${field.tabIdx} [${idx}] IGNORE_FOCUS=true`);
      // this.ignoreFocus = true;
      fieldComponent.focus(idx)
    }

  }

  setCurrentField(field, idx=0){
    console.log(`[leggy-form] setCurrentField [${idx}]`)
    const fieldComponent = this.fieldRefs[field.tabIdx];
    if (fieldComponent){
      console.log(`setField focus on field ${field.id} [${idx}] IGNORE_FOCUS=true`);
      // console.log(`focus on field (${field.type}) [${idx}], set ignoreFocue === true`);
      // this.ignoreFocus = true;
      fieldComponent.focus(idx);
    }
    this.currentField = field;
  }

}
