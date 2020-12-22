import { useContext, useLayoutEffect } from "react";
// import { useFormControl } from "@material-ui/core";

import FormFieldContext from "./FormFieldContext";

function useFormFieldProps({ focusVisible } = {}) {
  // const formControlProps = useFormControl();
  const { setFocusVisible, ...formFieldProps } =
    useContext(FormFieldContext) || {};

  // useLayoutEffect(() => {
  //   if (focusVisible !== undefined && setFocusVisible) {
  //     setFocusVisible(focusVisible);
  //   }
  // }, [focusVisible, setFocusVisible]);

  return {
    // inFormField: formControlProps !== undefined,
    // setFocusVisible,
    // ...formControlProps,
    // ...formFieldProps,
  };
}

export default useFormFieldProps;
