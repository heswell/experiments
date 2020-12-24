import React from "react";
import Center from "../components/Center";
import { Button, Icon } from "@heswell/toolkit-2.0";

export default {
  title: "Toolkit 2.0/Button",
  component: Button,
};

export const RegularButton = () => {
  const handleClick = () => {
    console.log("clicked");
  };
  return (
    <Center>
      <Button onClick={handleClick}>Regular Button</Button>
    </Center>
  );
};

export const RegularButtonWithIcon = () => {
  const handleClick = () => {
    console.log("clicked");
  };
  return (
    <Center>
      <Button onClick={handleClick}>
        <Icon name="search" size={12} />
      </Button>
    </Center>
  );
};

export const RegularButtonWithIconAndText = () => {
  const handleClick = () => {
    console.log("clicked");
  };
  return (
    <Center>
      <Button onClick={handleClick}>
        {" "}
        <Icon name="search" size={12} /> Regular Button
      </Button>
    </Center>
  );
};

export const Cta = () => {
  const handleClick = () => {
    console.log("clicked");
  };
  return (
    <Center>
      <Button onClick={handleClick} variant="cta">
        CTA Button
      </Button>
    </Center>
  );
};

export const CtaWithIcon = () => {
  return (
    <Center>
      <Button variant="cta">
        <Icon name="search" size={12} />
      </Button>
    </Center>
  );
};

export const CtaWithIconAndText = () => {
  return (
    <Center>
      <Button variant="cta">
        <Icon name="search" size={12} /> Default Button
      </Button>
    </Center>
  );
};

export const Secondary = () => {
  const handleClick = () => {
    console.log("clicked");
  };
  return (
    <Center>
      <Button onClick={handleClick} variant="secondary">
        Secondary Button
      </Button>
    </Center>
  );
};

export const SecondaryWithIcon = () => {
  return (
    <Center>
      <Button variant="secondary">
        <Icon name="search" size={12} />
      </Button>
    </Center>
  );
};

export const SecondaryWithIconAndText = () => {
  return (
    <Center>
      <Button variant="secondary">
        <Icon name="search" size={12} /> Default Button
      </Button>
    </Center>
  );
};
