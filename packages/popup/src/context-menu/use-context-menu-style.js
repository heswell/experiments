import { createUseStyles } from 'react-jss';

export default createUseStyles(theme => ({
  ContextMenu: {
    backgroundColor: 'white',
    borderRadius: 4,
    border: 'solid 1px rgba(0,0,0,0.15)',
    boxShadow: '0 6px 12px rgba(0,0,0,0.175)',
    backgroundClip: 'padding-box',
    listStyle: 'none',
    padding: '5px 3px',
    margin: '2px 0 0',
    fontFamily: 'menu',
    fontSize: '12px'
  },

  MenuItem: {
    display: 'list-item',
    textAlign: '-webkit-match-parent',
    boxSizing: 'border-box',
    '& > button': {
      backgroundColor: 'inherit',
      display: 'flex',
      alignItems: 'center',
      padding: '3px 3px 3px 20px',
      clear: 'both',
      lineHeight: 1.5,
      color: "rgb(0, 0, 0)",
      whiteSpace: "nowrap",
      textDecoration: "none",
      cursor: "pointer",
      border: "none",
      width: "100%",
      textAlign: "left",

      '&:hover': {
        backgroundColor: 'rgb(220, 220, 220)',
        outline: 0
      },
      '&:active': {
        outline: 0
      },

      '& .material-icons': {
        width: 18,
        marginLeft: 'auto',
        lineHeight: '18px',
        fontSize: '24px'
     
      }
    }
  
  },

  MenuLabel: {
    flex: '1 1 auto',
    lineHeight: '18px'
  },

  disabled : {

  },

  root: {
    position: 'relative'
  }, 

  showing: {

  }
}))