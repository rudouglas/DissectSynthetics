import React from 'react';
import DissectSyntheticsFailures from './dissect';
import { NerdletStateContext } from 'nr1';
// https://docs.newrelic.com/docs/new-relic-programmable-platform-introduction

export default class DissectContainer extends React.Component {
  render() {
    return (
      <NerdletStateContext.Consumer>
        {(nerdletState) => (
          <DissectSyntheticsFailures nerdletState={nerdletState} />
        )}
      </NerdletStateContext.Consumer>
    );
  }
}
