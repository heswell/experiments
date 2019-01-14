import React from 'react';
import cx from 'classnames';
import TokenList, { TokenType, } from './token-list';

import './token-mirror.css';
const styles = {
  tokenMirror: 'token-mirror',
  invalid: 'invalid'
}

const EmptyTokenList = new TokenList();
const WhitespaceToken = ({ token }) => (
  <span className={'whitespace-wrapper'}>
    <span key="ws" className='whitespace'>
      {token.text}
    </span>
  </span>
)

const TextToken = ({ idx, isComplete, isValid, token, className }) => {
  const wrapperClassName = `token-wrapper${isComplete ? ' complete' : ''}`;
  return (
    <div className={wrapperClassName} data-idx={idx}>
      <div
        key='token'
        className={cx('token', className, {
          [styles.invalid]: !isValid
        })}
      >
        {token.text}
      </div>
    </div >
  );
};

export class TokenMirror extends React.Component {

  constructor(props){
    super(props);
    this.el = React.createRef();
  }

  componentDidMount(){
    if (this.el.current){
      const {width} = this.el.current.getBoundingClientRect();
      console.log(`initial width = ${width}`)
    }

  }

  componentDidUpdate(){
    if (this.el.current){
      const {width} = this.el.current.getBoundingClientRect();
      console.log(`width = ${width}`)
    }
  }

  render() {
    const { tokenList = EmptyTokenList } = this.props;
    const tokens = tokenList ? tokenList.tokens : [];
    let tokenCount = 0;
    const childTokens = tokens.map((token, idx, terms) => {
      let result;
      if (token.type === TokenType.Text) {
        const tokenDescriptor = tokenList.descriptors[tokenCount];
        // an unrecognised token indicates that user has entered a complete command, but kept typing
        const unrecognisedToken = tokenDescriptor === undefined;
        const isComplete = idx < terms.length - 1 || unrecognisedToken;
        const className = tokenDescriptor ? tokenDescriptor.tokenStyle : undefined;
        const isValid = !unrecognisedToken && token.invalid !== true;
        result = (
          <TextToken
            key={`term-${idx}`}
            token={token}
            className={className}
            idx={idx}
            isComplete={isComplete}
            isValid={isValid}
          />
        );
        tokenCount += 1;
      } else {
        result = <WhitespaceToken token={token} key={'ws=' + idx} />;
      }
      return result;
    });
    return <div ref={this.el} className={styles.tokenMirror}>{childTokens}</div>;
  }

}
