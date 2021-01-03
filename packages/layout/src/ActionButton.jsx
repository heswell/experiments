import React from "react";
import classnames from "classnames";
import { Button, Icon } from "@heswell/toolkit-2.0";

const ActionButton = ({
  actionId,
  accessibleText,
  className,
  iconName,
  onClick,
  ...props
}) => {
  const handleClick = (evt) => {
    onClick(evt, actionId);
  };
  return (
    <Button
      {...props}
      className={classnames("ActionButton", className)}
      onClick={handleClick}
      title="Close View"
      variant="secondary"
    >
      <Icon accessibleText={accessibleText} name={iconName} />
    </Button>
  );
};

export default ActionButton;
