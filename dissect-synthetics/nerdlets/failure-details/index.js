import React from 'react';
import {
    nerdlet,
    NerdletStateContext
  } from 'nr1';
import FailureCore from './components/failure-core.js';
// https://docs.newrelic.com/docs/new-relic-programmable-platform-introduction

export default class FailureDetailsNerdlet extends React.Component {
    constructor(props) {
        super(props);
      }
    render() {
        return (<NerdletStateContext.Consumer>
            {(nerdletState) => {
                console.log("Test",nerdletState)
                return <FailureCore guid={nerdletState.guid}></FailureCore>
            }}
        </NerdletStateContext.Consumer>)
         
    }
}
