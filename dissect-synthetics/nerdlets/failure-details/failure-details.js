import React from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Grid,
    GridItem,
    NerdGraphQuery,
    BillboardChart
  } from 'nr1';
// https://docs.newrelic.com/docs/new-relic-programmable-platform-introduction

export default class FailureCore extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          latestSuccess: null
        }
        this.getFailingSince = this.getFailingSince.bind(this)
      }
    componentDidMount() {
        console.log("PROPS ", this.props)
        this.getFailingSince()
    }

    
    async getFailingSince(){
      const _self = this
      const {accountId,monitorId} = this.props
      const {timestamp} = this.props.failure
            
      // console.log("using guid", guid)
      const gql = `
      {
        actor {
          account(id: 1970369) {
            nrql(query: "SELECT latest(timestamp) FROM SyntheticCheck WHERE monitorId = '${monitorId}' AND result = 'SUCCESS' SINCE 2 weeks ago UNTIL ${timestamp}") {
              results
              nrql
            }
          }
        }
      }
      `;
      const result = await NerdGraphQuery.query({ query: gql }).then((res) => {
        console.log('Result', res.data.actor.account.nrql.results[0]['latest.timestamp']);
        if (res.data.errors) {
          throw new Error(res.data.errors);
        }
        const latestSuccess = res.data.actor.account.nrql.results[0]['latest.timestamp'];
        if (latestSuccess){
          _self.setState({latestSuccess})
        }
        return data;
      });
      return result;
  
    }
    
    render() {
      const timestampDiff = this.props.failure.timestamp - this.state.latestSuccess;
      // const timestampDiff = 10000000
      
      // const failedFor = (() => {
      //   switch(Math.floor(timestampDiff/(1000 * 60 * 60))){
      //     case 0:
      //       return "Mins"
      //     default:
      //       return [Math.floor(timestampDiff / (1000 * 60)), "Hrs"]
      //   }
      // })()

      const data = [
        {
          metadata: {
            id: 'failed-for',
            name: 'Failed for',
            viz: 'main',
            units_data: {
              y: "MS",
            },
          },
          data: [
            { y: timestampDiff }, // Current value.
          ],
        }]
      // console.log(`Failed For: ${failedFor}`);
      return (
        <>
        <h1>{this.props.accountId}</h1>
        <Grid>
          <GridItem columnSpan={2}>
            <BillboardChart
              data={data}
            />
          </GridItem>
          <GridItem columnSpan={2}>
            <BillboardChart
              accountId={this.props.accountId}
              query={`SELECT count(*) AS 'Failures' FROM SyntheticCheck WHERE monitorId = '${this.props.monitorId}' AND result = 'FAILED' SINCE ${this.state.latestSuccess}`}
            />
          </GridItem>
        </Grid>
        
        </>
      )
         
    }
}
