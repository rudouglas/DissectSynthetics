import React from 'react';
import {
    nerdlet,
    NerdletStateContext
  } from 'nr1';
// https://docs.newrelic.com/docs/new-relic-programmable-platform-introduction

export default class FailureCore extends React.Component {
    constructor(props) {
        super(props);
      }
    componentDidMount() {
        console.log("PROPS ", this.props.guid)
    }
    render() {
        return (<h1>Is it working</h1>)
         
    }
}
