import React from 'react';
import {ActionButton} from "@adobe/react-spectrum";
import Add from "@spectrum-icons/workflow/Add";
import Close from "@spectrum-icons/workflow/Close";
import Minimize from "@spectrum-icons/workflow/Minimize";
import Maximize from "@spectrum-icons/workflow/Maximize";
import MoreSmallListVert from "@spectrum-icons/workflow/MoreSmallListVert";

console.log({ActionButton, Close, Minimize, Maximize})

export const AddButton = ({onClick, ...rest}) => 
  <ActionButton aria-label="Add" onPress={onClick} {...rest}>
    <Add />
  </ActionButton>

export const CloseButton = ({onClick, ...rest}) => 
  <ActionButton aria-label="Close" onPress={onClick} {...rest}>
    <Close />
  </ActionButton>


export const MaximizeButton = () => 
  <ActionButton aria-label="Maximize">
    <Maximize />
  </ActionButton>


export const MinimizeButton = () => 
  <ActionButton aria-label="Minimize">
    <Minimize />
  </ActionButton>

export const MoreSmallListVertButton = ({onClick, ...rest}) => 
  <ActionButton aria-label="Close" onPress={onClick} {...rest}>
    <MoreSmallListVert />
  </ActionButton>
