import React, { useState } from "react";
import Center from "../components/Center";
import { Input } from "@heswell/toolkit-2.0";

export default {
  title: "Toolkit 2.0/Input",
  component: Input,
};

export const DefaultInput = () => {
  const handleChange = (evt, newValue) => {
    console.log(`onChange ${newValue}`);
  };
  return (
    <Center>
      <Input
        defaultValue="test"
        onChange={handleChange}
        style={{ width: 292 }}
      />
    </Center>
  );
};

export const ControlledInput = () => {
  const [value, setValue] = useState("");
  const handleChange = (evt, newValue) => {
    console.log(`onChange ${newValue}`);
    setValue(newValue);
  };
  return (
    <Center>
      <Input value={value} onChange={handleChange} style={{ width: 292 }} />
    </Center>
  );
};
