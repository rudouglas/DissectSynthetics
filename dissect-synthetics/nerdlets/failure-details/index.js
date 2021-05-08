import React from 'react';
import {
    nerdlet,
    NerdletStateContext
  } from 'nr1';
import FailureDetails from './failure-details.js';
// https://docs.newrelic.com/docs/new-relic-programmable-platform-introduction

export default class FailureDetailsNerdlet extends React.Component {
    constructor(props) {
        super(props);
      }
    render() {
        return (<NerdletStateContext.Consumer>
            {(nerdletState) => {
                console.log("Test",nerdletState)
                return <FailureDetails 
                    guid={nerdletState.guid} 
                    failure={nerdletState.failure} 
                    accountId={nerdletState.accountId}
                    monitorId={nerdletState.monitorId}
                    failureDict={nerdletState.failureDict}>
                </FailureDetails>
            }}
        </NerdletStateContext.Consumer>)
         
    }
}
