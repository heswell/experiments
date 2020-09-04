import { createUseStyles } from 'react-jss';

export default createUseStyles(theme => ({
  ComponentHeader: {
    fontSize: '.825rem',
    display: 'flex',
    backgroundColor: '#ccc',
    alignItems: 'center',
    '& > button': {
      flex : '0 0 26px',
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
      flex : '1 1 auto',
      marginLeft: 6,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
},
  LayoutItem: {
    backgroundColor: '#fff'
  }
}));