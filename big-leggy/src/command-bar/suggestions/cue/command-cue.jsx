import React from 'react';
import { CommandStatus } from '../../utils/command-utils';

const styles = {
  commandCue: 'command-cue'
}

export default class CommandCue extends React.Component {

  getDisplayText(tokenDescriptor, isComplete) {

    if (isComplete) {
      // only show this if the final token has been validated or is complete
      return 'Hit Enter to submit command';
    } else if (tokenDescriptor !== null) {
      const { name, cueText = '', searchId = '', formatHelp = '' } = tokenDescriptor;
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

  getOptionalTokens() {
    return this.props.tokenDescriptors.filter(token => token.required === false);
  }

  getTokenDescriptor() {
    const { commandState, tokenDescriptors } = this.props;
    const { commandTermIdx = 0 } = commandState;
    return tokenDescriptors[commandTermIdx];
  }


  render() {
    const { commandState } = this.props;
    const tokenDescriptor = this.getTokenDescriptor();
    const isComplete = commandState.commandStatus === CommandStatus.CommandComplete;

    return (
        <div className={styles.commandCue}>
          <span>{this.getDisplayText(tokenDescriptor, isComplete)}</span>
        </div>
    );
  }
}