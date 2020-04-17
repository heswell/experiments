import React from 'react';
import MUITabs from '@material-ui/core/Tabs';
import MUITab from '@material-ui/core/Tab';
import { makeStyles } from '@material-ui/core/styles'

const useTabsStyles = makeStyles({
  root: {
    minHeight: 26
  }
})

const Tabstrip = (props) => {
  const classes = useTabsStyles();
  return (
    <MUITabs {...props} className="Tabstrip" classes={classes}/>
  )
}

const useTabStyles = makeStyles(theme => ({
  root: {
    minHeight: 26,
    fontSize: '11px',
    [theme.breakpoints.up('sm')]: {
      minWidth: 100
    }
  }
}))

const Tab = props => {
  const classes = useTabStyles();
  return <MUITab {...props} className="Tab" classes={classes}/>
}


/** @type {ComponentRegistryList} */
const components = [
  ['Tabstrip',  Tabstrip],
  ['Tab', Tab]
]

export default components;