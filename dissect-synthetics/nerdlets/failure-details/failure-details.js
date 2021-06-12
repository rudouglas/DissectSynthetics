import React from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Grid,
    GridItem,
    NerdGraphQuery,
    BillboardChart,
    Tooltip,
    BarChart,
    TableChart,
    Link,
    List,
    ListItem,
    Icon,
    Stack,
    StackItem
  } from 'nr1';
import DocCards from './components/doc-cards'
import { css, jsx } from '@emotion/react'

// https://docs.newrelic.com/docs/new-relic-programmable-platform-introduction

export default class FailureCore extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          latestSuccess: null,
          resources: null,
        }
        this.getFailingSince = this.getFailingSince.bind(this);
        this.getResources = this.getResources.bind(this);
      }
    componentWillMount() {
        console.log("PROPS ", this.props)
        this.getFailingSince()
        console.log(`Failure ${JSON.stringify(this.props.failure.locationLabel)}`)
        this.getResources()
        console.log(this.props.relationships)
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
        return latestSuccess;
      });
      return result;
  
    }
    
    async getResources(){
      const _self = this
      const gql = `
        {
          actor {
            account(id: 1970369) {
              nrql(query: "SELECT URL,responseCode FROM SyntheticRequest WHERE checkId = '${this.props.failure.id}'") {
                results
              }
            }
          }
        }
      `;
      const result = await NerdGraphQuery.query({ query: gql }).then((res) => {
        console.log('Resources', res.data.actor.account.nrql.results);
        if (res.data.errors) {
          throw new Error(res.data.errors);
        }
        const resources = res.data.actor.account.nrql.results;
        if(resources){
          _self.setState({resources})
        }
        return resources;
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
      const resourceData = [
        {
          metadata: {
            id: 'resource-table',
            name: 'Resources', 
            color: '#008c99',
            viz: 'main',
            columns: ['URL', 'responseCode'],

          },
          data: this.state.resources,
        }
      ]
      // console.log(`Failed For: ${failedFor}`);
      const additionalInfoLink = {
        label: 'Check location Status',
        to: 'https://one.nr/0xVwgVD28QJ',
      };
      console.log(`SELECT count(*) FROM SyntheticCheck WHERE monitorId = '${this.props.monitorId}' AND result = 'FAILED' AND locationLabel != '${this.props.failure.locationLabel} SINCE ${this.state.latestSuccess} FACET locationLabel`)
      return (
        <>
        <h1>{this.props.failure.error}</h1>
        <Stack 
          directionType={Stack.DIRECTION_TYPE.HORIZONTAL}
          className="mainStack"
        >
          <StackItem 
            css={css`
              width: 200px;
            `}
            className="docsSection stackItem"
          >
            <h3>Documentation</h3>
            <DocCards 
              failureDict={this.props.failureDict} 
              error={this.props.failure.error}
              className="docCards"
            />
          </StackItem>
          <StackItem>
            <Grid>
              <GridItem columnSpan={4}>
                <Stack directionType={Stack.DIRECTION_TYPE.VERTICAL}>
                  <StackItem className="stackItem">
                    <Tooltip
                      text="A short amount of time indicates the issue may be temporary. A longer time may point to more consistent issues!"
                      placementType={Tooltip.PLACEMENT_TYPE.BOTTOM}
                    >
                      <h3>Failing for <Icon type={Icon.TYPE.INTERFACE__INFO__HELP} /></h3>
                    </Tooltip>
                    <BillboardChart
                      data={data}
                      fullwidth
                    />
                  </StackItem>
                  <StackItem className="stackItem">
                    <Tooltip
                      text="A low number indicates the failures may be temporary. A high number may point to more consistent issues!"
                      placementType={Tooltip.PLACEMENT_TYPE.BOTTOM}
                    >
                      <h3>Number of Failures <Icon type={Icon.TYPE.INTERFACE__INFO__HELP} /></h3>
                    </Tooltip>
                    <BillboardChart
                      accountId={this.props.accountId}
                      query={`SELECT count(*) AS 'Failures' FROM SyntheticCheck WHERE monitorId = '${this.props.monitorId}' AND result = 'FAILED' SINCE ${this.state.latestSuccess}`}
                    />
                  </StackItem>
                </Stack>
                
              </GridItem>
              <GridItem columnSpan={4}>
                <Stack 
                  directionType={Stack.DIRECTION_TYPE.VERTICAL}
                >
                  <StackItem className="stackItem">
                    <Tooltip
                      text="If the rate is low there may be an issue with this location!"
                      placementType={Tooltip.PLACEMENT_TYPE.BOTTOM}
                      additionalInfoLink={additionalInfoLink}
                    >
                      <h3>Location Success Rate <Icon type={Icon.TYPE.INTERFACE__INFO__HELP} /></h3>
                    </Tooltip>
                    <BillboardChart
                      accountId={this.props.accountId}
                      query={`SELECT percentage(count(*), WHERE result = 'SUCCESS') AS 'Location Success Rate' FROM SyntheticCheck WHERE locationLabel = '${this.props.failure.locationLabel}'`}
                    />
                  </StackItem>
                  <StackItem className="stackItem">
                    <Tooltip
                      text="If other locations are also failing with a similar error it would point to an issue for users site side."
                      placementType={Tooltip.PLACEMENT_TYPE.BOTTOM}
                    >
                      <h3>Other Locations Failing <Icon type={Icon.TYPE.INTERFACE__INFO__HELP} /></h3>
                    </Tooltip>
                    <BarChart
                      accountId={this.props.accountId}
                      query={`SELECT count(*) FROM SyntheticCheck WHERE monitorId = '${this.props.monitorId}' AND result = 'FAILED' AND locationLabel != '${this.props.failure.locationLabel}' SINCE ${this.state.latestSuccess} FACET locationLabel`}
                    />
                  </StackItem>
                </Stack>
              </GridItem>
              <GridItem columnSpan={4}>
                <StackItem className="stackItem">
                  <Tooltip
                    text="If other monitors are failing with the same error there may be wider issues with your site!"
                    placementType={Tooltip.PLACEMENT_TYPE.BOTTOM}
                  >
                    <h3>Other Monitors Failing <Icon type={Icon.TYPE.INTERFACE__INFO__HELP} /></h3>
                  </Tooltip>
                  <BarChart
                    accountId={this.props.accountId}
                    query={`SELECT count(*) FROM SyntheticCheck WHERE result = 'FAILED' SINCE ${this.state.latestSuccess} FACET monitorName` || null}
                  />
                </StackItem>
                <StackItem className="stackItem relationshipSection">
                  {this.props.relationships 
                      &&
                      (<>
                      <Tooltip
                        text="If other monitors are failing with the same error there may be wider issues with your site!"
                        placementType={Tooltip.PLACEMENT_TYPE.BOTTOM}
                      >
                        <h3>Relationships <Icon type={Icon.TYPE.INTERFACE__INFO__HELP} /></h3>
                      </Tooltip>
                      <List className="relationships">
                      {this.props.relationships.map((relat, index) => (
                        <ListItem><Link to={relat.source.entity.permalink}>{relat.source.entity.name + ' (' + relat.source.entity.type + ')'}</Link></ListItem>
                        ))}
                      </List></>)
                    }
                </StackItem>  
              </GridItem>
            </Grid>
            <Grid>
              <GridItem columnSpan={12} className="stackItem resourcesSection">
                <h3>Resources</h3>
                <TableChart
                  accountId={this.props.accountId}
                  query={`SELECT URL,responseCode FROM SyntheticRequest WHERE checkId = '${this.props.failure.id}'`}
                  fullWidth
                />
              </GridItem>
            </Grid>
          </StackItem>
        </Stack>
        
        
        
       
        </>
      )
         
    }
}
