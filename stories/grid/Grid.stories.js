import React, { useMemo, useState } from "react";

import { Grid } from "@heswell/grid";
import { LocalDataSource } from "@heswell/data-source";

import "../layout/material-design.css";

import "@heswell/grid/dist/index.css";

export default {
  title: "Grid/Default",
  component: Grid,
};

const schema = {
  columns: [
    { name: "Symbol", width: 120 },
    { name: "Name", width: 200 },
    {
      name: "Price",
      type: {
        name: "number",
        renderer: { name: "background", flashStyle: "arrow-bg" },
        formatting: { decimals: 2, zeroPad: true },
      },
      aggregate: "avg",
    },
    { name: "MarketCap", type: "number", aggregate: "sum" },
    { name: "IPO" },
    { name: "Sector" },
    { name: "Industry" },
  ],
};
const dataConfig = { dataUrl: "/data/instruments.js", schema };

export const EmptyGrid = () => <Grid />;

export const BasicGrid = () => {
  const dataSource = useMemo(() => new LocalDataSource(dataConfig), []);

  return <Grid dataSource={dataSource} columns={schema.columns} height={600} />;
};
