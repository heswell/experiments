import { createUseStyles } from 'react-jss';

export default createUseStyles(theme => ({
  ComponentHeader: {
    fontSize: '.825rem',
    display: 'flex',
    backgroundColor: '#ccc',
    alignItems: 'center',
    '& > button': {
      flex: '0 0 26px',
      height: '100%',
      marginLeft: 'auto',
      padding: 1,
      border: 'solid 1px rgba(255,255,255,0)',
      borderRadius: 3,
      cursor: 'pointer',
      boxSizing: 'border-box',
      backgroundColor: 'inherit',
    },
    '& > .title': {
      cursor: 'default',
      flex: '1 1 auto',
      marginLeft: 6,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  },
  LayoutItem: {
    backgroundColor: '#fff',
    "&.dragging": {
      border: "solid red 1px",
      zIndex: 2 
    }
  },
  selected: {
    "&:after": {
      content: '" "',
      display: 'block',
      position: 'absolute',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      height:'100%',
      border: 'solid 2px cornflowerblue',
      boxSizing: 'border-box',
      zIndex: 1
    },
    "&> *": {
      zIndex: 1
    }
  }
}));


