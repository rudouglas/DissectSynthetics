import React from 'react';
import DissectSyntheticsFailures from './dissect';
import { NerdletStateContext, PlatformStateContext } from 'nr1';
// https://docs.newrelic.com/docs/new-relic-programmable-platform-introduction

const getTimeRange = (timeRange) => {
  if (timeRange.duration) {
    const now = new Date().getTime();
    return (`SINCE ${now - timeRange.duration}`)
  } else {
    return (`SINCE ${timeRange.begin_time} UNTIL ${timeRange.end_time}`)
  }
}

export default class DissectContainer extends React.Component {
  render() {
    return (
      <PlatformStateContext.Consumer>
        {(platformState) => {
          const { timeRange } = platformState;
          const since = getTimeRange(timeRange)
          console.log(`timerange ${since}`);
          return (<NerdletStateContext.Consumer>
            {(nerdletState) => {
              return (<DissectSyntheticsFailures nerdletState={nerdletState} since={since} />)
            }}
          </NerdletStateContext.Consumer>)
        }}
      </PlatformStateContext.Consumer>
    );
  }
}
