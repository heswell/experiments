import React from 'react';

import './values.css';

const styles = {
  values: 'token-values',
  header: 'token-values-header',
  list: 'token-values-list',
  valueRow: 'token-value-row',
  value: 'token-value',
  description: 'token-value-description',
}

export default class TokenValues extends React.Component {

  render(){
    const {valuesHelp} = this.props.tokenDescriptor;
    return (
      <div className={styles.values}>
        <div className={styles.header}>
          <span>Valid values are as follows:</span>
        </div>
        <div className={styles.list}>
          {valuesHelp.map(({value, description},i) => (
            <div key={i} className={styles.valueRow}>
              <span className={styles.value}>{value}</span>
              <span className={styles.description}>{description}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

}
