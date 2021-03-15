import React from 'react';
import {Button} from "@adobe/react-spectrum";
import Add from "@spectrum-icons/workflow/Add";
import Close from "@spectrum-icons/workflow/Close";
import Minimize from "@spectrum-icons/workflow/Minimize";
import Maximize from "@spectrum-icons/workflow/Maximize";
import MoreSmallListVert from "@spectrum-icons/workflow/MoreSmallListVert";
import ChevronDoubleLeft from "@spectrum-icons/workflow/ChevronDoubleLeft";
import ChevronDoubleRight from "@spectrum-icons/workflow/ChevronDoubleRight";

import "./action-buttons.css";

export const AddButton = ({onClick, ...rest}) => 
  <Button UNSAFE_className="hwActionButton" variant="secondary" aria-label="Add" onClick={onClick} {...rest}>
    <Add />
  </Button>

export const CloseButton = ({onClick, ...rest}) => 
  <Button UNSAFE_className="hwActionButton" variant="secondary" aria-label="Close" onClick={onClick} {...rest}>
    <Close />
  </Button>


export const MaximizeButton = () => 
  <Button UNSAFE_className="hwActionButton" variant="secondary" aria-label="Maximize">
    <Maximize />
  </Button>


export const MinimizeButton = () => 
  <Button UNSAFE_className="hwActionButton" variant="secondary" aria-label="Minimize">
    <Minimize />
  </Button>

export const MoreSmallListVertButton = ({onClick, ...rest}) => 
  <Button UNSAFE_className="hwActionButton" variant="secondary" aria-label="Close" onClick={onClick} {...rest}>
    <MoreSmallListVert />
  </Button>

export const ChevronDoubleLeftButton = ({onClick, ...rest}) => 
  <Button UNSAFE_className="hwActionButton" variant="secondary" aria-label="Close" onClick={onClick} {...rest}>
    <ChevronDoubleLeft />
  </Button>

export const ChevronDoubleRightButton = ({onClick, ...rest}) => 
  <Button UNSAFE_className="hwActionButton" variant="secondary" aria-label="Close" onClick={onClick} {...rest}>
    <ChevronDoubleRight />
  </Button>
