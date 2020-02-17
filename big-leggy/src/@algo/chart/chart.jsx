import React, {useRef, useEffect} from 'react';
import * as echarts from 'echarts';
import {option} from './chart-config';
import './chart.css';

console.log(Object.keys(echarts))

export default function({
  style
}){

  const el = useRef(null);

  useEffect(() => {
    var myChart = echarts.init(el.current);
    
    // draw chart
    myChart.setOption(option, true);
  }, [])


  return (
    <div ref={el} className="Chart" style={style}/>
  )
} 
