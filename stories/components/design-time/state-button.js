import React, {useContext, useRef} from 'react';
import styled from '@emotion/styled';

let controlId = 0;

const StateButtonContext = React.createContext(null);

const StateButtonGroupRoot = styled.div`
  display: inline-flex;
  align-items: center;
  border: solid 1px #ccc;
  &:not(:first-of-type) {
    margin-left: 6px;
  }
`;

const StateButtonRoot = styled.div`
  color: #2C3E50;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  overflow: hidden;
  & input {
    position: absolute;
    left: -100px;
  }
  & input:checked + label {
    background-color: lightgrey;
  }
  & label {
    align-items: center;
    cursor: pointer;
    display: flex;
    justify-content: center;
    width: 100%;
    height: 100%;
    overflow; hidden;
    & .material-icons {
      font-size: 20px;
    }
  }
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
    <StateButtonGroupRoot>
      <StateButtonContext.Provider value={{name, onChange: changeHandler, value}}>
      {children}
      </StateButtonContext.Provider>
    </StateButtonGroupRoot>
  )
}

const StateButton = (props) => {
  const id = useRef(++controlId)
  const [name, onChange, checked] = useStateButton(props)
  const {icon, label, value} = props;
  return (
    <StateButtonRoot title={label}>
      <input
        type="radio"
        id={id.current}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange} />
      <label htmlFor={id.current}>
        <i className="material-icons">{icon}</i>
      </label>
      
    </StateButtonRoot>

  )
}

StateButton.Group = StateButtonGroup;

export default StateButton;