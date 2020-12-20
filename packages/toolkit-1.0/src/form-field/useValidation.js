import React, { useEffect } from "react";

function createValidationCallback(validationRules) {
  return (value) =>
    validationRules.reduce(
      (currentExceptions, { validate, type, getMessage, ...rest }) => {
        const didPrevRuleBreakOnException =
          currentExceptions.length &&
          currentExceptions[currentExceptions.length - 1].breakOnException;
        if (
          !didPrevRuleBreakOnException &&
          !validate(value, currentExceptions)
        ) {
          return currentExceptions.concat({
            ...rest,
            type,
            message: getMessage(value)
          });
        }
        return currentExceptions;
      },
      []
    );
}

export default function useValidation(validationRules) {
  const [fieldStates, setFieldStates] = React.useState([]);
  const validationCallbackRef = React.useRef();
  const validationCallback = React.useCallback((value) => {
    setFieldStates(validationCallbackRef.current(value));
  }, []);
  useEffect(() => {
    validationCallbackRef.current = createValidationCallback(validationRules);
  }, [validationRules]);

  return [fieldStates, validationCallback];
}
