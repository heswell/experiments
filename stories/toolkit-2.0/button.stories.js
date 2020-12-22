import React from "react";
import Center from "../components/Center";
import { Button, Icon, ThemeProvider, theme } from "@heswell/toolkit-2.0";

export default {
  title: "Toolkit 2.0/Button",
  component: Button,
};

export const DefaultButton = () => {
  const handleClick = () => {
    console.log("clicked");
  };
  return (
    <ThemeProvider theme={theme}>
      <Center>
        <Button onClick={handleClick}>Default Button</Button>
      </Center>
    </ThemeProvider>
  );
};

export const Cta = () => {
  const handleClick = () => {
    console.log("clicked");
  };
  return (
    <ThemeProvider theme={theme}>
      <Center>
        <Button onClick={handleClick} variant="cta">
          CTA Button
        </Button>
      </Center>
    </ThemeProvider>
  );
};

export const CtaWithIcon = () => {
  return (
    <ThemeProvider theme={theme}>
      <Center>
        <Button variant="cta">
          <Icon name="search" size={12} />
        </Button>
      </Center>
    </ThemeProvider>
  );
};

export const CtaWithIconAndText = () => {
  return (
    <ThemeProvider theme={theme}>
      <Center>
        <Button variant="cta">
          <Icon name="search" size={12} /> Default Button
        </Button>
      </Center>
    </ThemeProvider>
  );
};

export const Secondary = () => {
  const handleClick = () => {
    console.log("clicked");
  };
  return (
    <ThemeProvider theme={theme}>
      <Center>
        <Button onClick={handleClick} variant="secondary">
          Secondary Button
        </Button>
      </Center>
    </ThemeProvider>
  );
};

export const SecondaryWithIcon = () => {
  return (
    <ThemeProvider theme={theme}>
      <Center>
        <Button variant="secondary">
          <Icon name="search" size={12} />
        </Button>
      </Center>
    </ThemeProvider>
  );
};

export const SecondaryWithIconAndText = () => {
  return (
    <ThemeProvider theme={theme}>
      <Center>
        <Button variant="secondary">
          <Icon name="search" size={12} /> Default Button
        </Button>
      </Center>
    </ThemeProvider>
  );
};
