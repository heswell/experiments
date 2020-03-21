import {useRef, useEffect} from 'react';
import {getCellComponent} from '../registry/datatype-registry.jsx';

export default column => {

  const cellComponent = useRef(getCellComponent(column.type));

  useEffect(() => {
    console.log(`[useCellRenderer] column type has changed column at ${column.key} (${column.name})`, column)
  }, [column.type])

  return cellComponent;

}