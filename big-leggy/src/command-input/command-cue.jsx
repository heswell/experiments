import React from 'react';
import { CommandStatus } from	'./command-utils';

const styles = {
  commandCue: 'command-cue'
}

const OptionalTokens = ({tokenDescriptors}) => (
  <div className="optional-tokens">
    {tokenDescriptors.map((token,i) => (
      <div key={i} className="optional-token">
        <span className="optional-token-description">{token.description}</span>
        <span className="optional-token-help">{token.formatHelp}</span>
      </div>
    ))}
  </div>
)

export default class CommandCue extends React.Component {
  static defaultProps = {
    tokenDescriptor: null
  };
  getDisplayText(isComplete){
  const { commandState, tokenDescriptors } = this.props;
  const { commandTermIdx = 0 } = commandState;
  const tokenDescriptor = tokenDescriptors[commandTermIdx];

  if (isComplete) {
    // only show this if the final token has been validated or is complete
    return 'Hit Enter to submit command';
  } else if (tokenDescriptor !== null) {
    const { name, cueText='', searchId='', formatHelp=''} = tokenDescriptor;
    const displayText = cueText || (searchId ? `Search for ${name}` : `Enter ${name}`);
    if (formatHelp) {
      return (
        <>
          <span>{displayText}</span>
          <span className={styles.commandCueExample}>{`(Example: ${formatHelp})`}</span>
        </>
      );
    } else {
      return displayText;
    }
  } else {
    return '';
  }
}
render() {
  const {commandState, tokenDescriptors} = this.props;
  const isComplete = commandState.commandStatus === CommandStatus.CommandComplete;
  const optionalTokens = tokenDescriptors.filter(token => token.required === false);

  console.log(this.props.commandState)
  return (
    <>
    <div className={styles.commandCue}>
      <span>{this.getDisplayText(isComplete)}</span>
    </div>
    {isComplete  && optionalTokens.length > 0 && (
      <OptionalTokens tokenDescriptors={optionalTokens}/>
    )
    }
    </>
  );
}
}