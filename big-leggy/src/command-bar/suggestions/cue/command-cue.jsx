import React from 'react';
import { CommandStatus } from '../../utils/command-utils';
import './command-cue.css';

const styles = {
  commandCue: 'command-cue'
}

const enterPrompt = 'Hit Enter to submit command';
const optionsPrompt = 'or add optional parameters';
const unresolvedSearchPrompt = 'Correct highlighted multiple matches';

export default class CommandCue extends React.Component {

  getDisplayText(tokenDescriptor, isComplete, searchIsUnresolved) {

    if (isComplete) {

      const basePrompt = searchIsUnresolved
        ? unresolvedSearchPrompt
        : enterPrompt;

      // only show this if the final token has been validated or is complete
      return this.showOptionsPrompt()
        ? basePrompt + ' ' + optionsPrompt
        : basePrompt;

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

  showOptionsPrompt(){
    const {tokenDescriptors, commandState: {commandText}} = this.props;
    const finalSpace = commandText.slice(-1) === ' ';
    return finalSpace && tokenDescriptors.some(token => token.required === false);
  }

  getTokenDescriptor() {
    const { commandState, tokenDescriptors } = this.props;
    const { commandTermIdx = 0 } = commandState;
    return tokenDescriptors[commandTermIdx];
  }


  render() {
    const { commandState, searchIsUnresolved } = this.props;
    const tokenDescriptor = this.getTokenDescriptor();
    const isComplete = commandState.commandStatus === CommandStatus.CommandComplete;

    return (
        <div className={styles.commandCue}>
          <span>{this.getDisplayText(tokenDescriptor, isComplete, searchIsUnresolved)}</span>
        </div>
    );
  }
}