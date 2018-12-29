import React from 'react'

const Control = ({tabIdx,  children}) => (
  <div className="control" tabIndex={tabIdx}>
    {children}
  </div>
)

export default Control;