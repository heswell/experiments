import React from "react";
import { List, ThemeProvider, theme } from "@heswell/toolkit-1.0";

const listExampleData = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];
export default {
  title: "Toolkit 1.0/List",
  component: List,
};

export const DefaultList = () => {
  const handleChange = (_, selectedItem) => {
    console.log("selection changed", selectedItem);
  };
  return (
    <ThemeProvider theme={theme}>
      <List maxWidth={292} onChange={handleChange} source={listExampleData} />
    </ThemeProvider>
  );
};
