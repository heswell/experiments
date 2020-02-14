
  const data = [
    {name: 'A'},
    {name: 'B'},
    {name: 'C'}
  ]



const Comp  = () => {

  return (
    <ul>
      <li>data[0]</li>
      <li>data[1]</li>
      <li>data[2]</li>
    </ul>
  )

}


const Comp = () => {

  const childItems = () => {
    return data.map(item => 
    <li>{item}</li>
    )
  }

  return (
    <ul>
      {childItems()}
    </ul>
  )



}
