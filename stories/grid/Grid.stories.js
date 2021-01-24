import React, { useMemo, useRef, useState } from "react";

import { Grid } from "@heswell/grid";
import { LocalDataSource } from "@heswell/data-source";

import "../layout/material-design.css";
import "./Grid.stories.css"


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
  const gridRef = useRef(null)
  const [rowHeight, setRowHeight] = useState(24)
  const dataSource = useMemo(() => new LocalDataSource(dataConfig), []);

  const incrementProp = () => {
    setRowHeight(value => value + 1)    
  }

  const decrementProp = () => {
    setRowHeight(value => value - 1)    
  }

  const incrementCssProperty = () => {
    const rowHeight = parseInt(getComputedStyle(gridRef.current).getPropertyValue("--hw-grid-row-height"));
    gridRef.current.style.setProperty("--grid-row-height",`${rowHeight+1}px`)
  }

  const decrementCssProperty = () => {
    const rowHeight = parseInt(getComputedStyle(gridRef.current).getPropertyValue("--hw-grid-row-height"));
    gridRef.current.style.setProperty("--grid-row-height",`${rowHeight-1}px`)
  }

  const setLowDensity = () => {
    gridRef.current.style.setProperty("--grid-row-height",`32px`)
  }
  const setHighDensity = () => {
    gridRef.current.style.setProperty("--grid-row-height",`20px`)
  }

  return <>
    <Grid className="Steve" dataSource={dataSource} columns={schema.columns} height={600} ref={gridRef}/>
    <br/>
    <button onClick={incrementProp}>Increase row height prop</button>
    <button onClick={decrementProp}>Decrease row height prop</button>
    <button onClick={incrementCssProperty}>Increase row height custom property</button>
    <button onClick={decrementCssProperty}>Decrease row height custom property</button>
    <br/>
    <button onClick={setHighDensity}>High Density</button>
    <button onClick={setLowDensity}>Low Density</button>
  </>;
};
