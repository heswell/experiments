import React, {useContext, useRef} from 'react';
import styled from '@emotion/styled';

let controlId = 0;

const StateButtonContext = React.createContext(null);

const StateButtonRoot = styled.div`
  background-color: red;
  display: inline-flex;
  align-items: center;
`;

const useStateButton = (props) => {
  const context = useContext(StateButtonContext);
  if (context){
    return [context.name, context.onChange, context.value === props.value]
  } else {
    return [props.name, props.onChange, props.selected];
  }
}

const StateButtonGroup = ({children, name, onChange, value}) => {
  const changeHandler = e => onChange(name, e.target.value);
  
  return (
    <StateButtonRoot>
      <StateButtonContext.Provider value={{name, onChange: changeHandler, value}}>
      {children}
      </StateButtonContext.Provider>
    </StateButtonRoot>
  )
}

const StateButton = (props) => {
  const id = useRef(++controlId)
  const [name, onChange, checked] = useStateButton(props)
  const {label, value} = props;
  return (
    <>
      <label htmlFor={id.current}>{label}</label>
      <input
        type="radio"
        id={id.current}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange} />
    </>

  )
}

StateButton.Group = StateButtonGroup;

export default StateButton;