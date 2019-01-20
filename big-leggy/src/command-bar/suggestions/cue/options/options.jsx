import React from 'react';

import './options.css';

const styles = {
  options: 'command-options',
  header: 'command-options-header',
  tokens: 'command-options-tokens',
  token: 'command-options-token',
  description: 'command-options-token-description',
  help: 'command-options-token-help'
}

export default class CommandOptions extends React.Component {

  render(){
    const {tokenDescriptors} = this.props;
    return (
      <div className={styles.options}>
        <div className={styles.header}>
          <span>The following optional terms are also available:</span>
        </div>
        <div className={styles.tokens}>
          {tokenDescriptors.map((token,i) => (
            <div key={i} className={styles.token}>
              <span className={styles.help}>{token.formatHelp}</span>
              <span className={styles.description}>{token.description}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

}
