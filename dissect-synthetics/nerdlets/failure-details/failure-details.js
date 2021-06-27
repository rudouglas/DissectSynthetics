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
    StackItem,
    Button,
    navigation,
    Tile,
    TileGroup
  } from 'nr1';
import DocCards from './components/doc-cards'
import { css, jsx } from '@emotion/react'
import variableErrors from '../static/errorDictionary';

// https://docs.newrelic.com/docs/new-relic-programmable-platform-introduction

export default class FailureCore extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          latestSuccess: null,
          resources: null,
          failure: null,
          rLike: null,
          noDocumentation: false,
        }
        this.getFailingSince = this.getFailingSince.bind(this);
        this.getResources = this.getResources.bind(this);
      }
    componentWillMount() {
      const { failure: {error}, failureDict} = this.props
      console.log("PROPS ", error)
      this.getFailingSince()
      console.log(`Failure ${JSON.stringify(this.props.failure.locationLabel)}`)
      this.getResources()
      console.log(`Error Messge ${this.props.error}`)
      
      let failure = failureDict.filter(fail => fail.message === error)
      
      if (failure.length === 0) {
        
        let match;
        for (const err of variableErrors) {
          
          if (err.rLike.exec(error)) {
            match = err.rLike.exec(error)
            failure = failureDict.filter(fail => fail.message === err.message)
            this.setState({rLike: err.rLike})
            break;
          }
        }
        !match && this.setState({noDocumentation: true})
        console.log("tick",match)
      }
      this.setState({ failure: failure[0] })
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
            account(id: ${this.props.accountId}) {
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

    openQueryNerdlet(chart, nrql){
      const { accountId } = this.props
      let urlState = {
        "initialQueries":[{
          accountId,
          nrql
        }],
      }
      if (chart === 'bar'){
        urlState['initialChartSettings'] = {"chartType":"CHART_BAR"}
      }
      const nerdlet = {
        id: 'wanda-data-exploration.data-explorer',
        urlState,
      };
      
      const location = navigation.openStackedNerdlet(nerdlet);
    }
    renderBarChartQueryButton(nrql) {
      
      return (
        <Button
          onClick={() => this.openQueryNerdlet('bar', nrql)}
          className="chart-button"
          type={Button.TYPE.OUTLINE}
          iconType={Button.ICON_TYPE.DATAVIZ__DATAVIZ__CHART__A_ADD}
          sizeType={Button.SIZE_TYPE.MEDIUM}
        />
      )
    }
    renderChartQueryButton(nrql) {
      
      return (
        <Button
          className="chart-button"
          onClick={() => this.openQueryNerdlet('billboard',nrql)}
          type={Button.TYPE.OUTLINE}
          iconType={Button.ICON_TYPE.DATAVIZ__DATAVIZ__CHART__A_ADD}
          sizeType={Button.SIZE_TYPE.MEDIUM}
        />
      )
    }
    
    render() {
      const { failureDict } = this.props
      const {failure, rLike, latestSuccess, noDocumentation} = this.state
      const currentTimeInMilliseconds = Date.now();
      const timestampDiff = this.props.failure.timestamp - latestSuccess;
      const since = this.props.failure.timestamp - (30 * 60 * 1000);
      let until = this.props.failure.timestamp + (30 * 60 * 1000);
      if (until > currentTimeInMilliseconds) {
        until = currentTimeInMilliseconds;
      }
      console.log(`latest Success ${latestSuccess}`)
      const successfulResponses = '(200,201,202,203,204,205,206,207,208,250,226,300,301,302,303,304,305,306,307,308)'
      const resourceNRQL = `SELECT URL,responseCode FROM SyntheticRequest WHERE checkId = '${this.props.failure.id}' AND responseCode NOT IN ${successfulResponses}`
      const otherMonitorsNRQL = `SELECT count(*) OR 0 FROM SyntheticCheck WHERE result = 'FAILED'  SINCE ${since} UNTIL ${until} FACET monitorName`
      const otherLocationsNRQL = `SELECT count(*) OR 0 FROM SyntheticCheck WHERE monitorId = '${this.props.monitorId}' AND result = 'FAILED' AND locationLabel != '${this.props.failure.locationLabel}'  SINCE ${since} UNTIL ${until} FACET locationLabel`
      const locationSuccessNRQL = `SELECT percentage(count(*), WHERE result = 'SUCCESS') AS 'Location Success Rate' FROM SyntheticCheck WHERE locationLabel = '${this.props.failure.locationLabel}' SINCE ${since} UNTIL ${until}`
      const failureAmountNRQL = `SELECT count(*) OR 0 AS 'Failures' FROM SyntheticCheck WHERE monitorId = '${this.props.monitorId}' AND result = 'FAILED' SINCE ${since} UNTIL ${until}`
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
            {!noDocumentation ? 
              <DocCards 
                failureDict={failureDict} 
                failure={failure}
                className="docCards"
              />
            : 
            <Card>
              <CardBody>
                There is currently no Documentation for this error. Please open up a GitHub issue via the Docs page
                to get this documented.
              </CardBody>
            </Card>
            }
            
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
                    <div className="copy-nrql">
                      <Tooltip
                        text={`A low number indicates the failures may be temporary. A high number may point to more consistent issues!`}
                        placementType={Tooltip.PLACEMENT_TYPE.BOTTOM}
                      >
                        <h3>Number of Failures <Icon type={Icon.TYPE.INTERFACE__INFO__HELP} /></h3>
                      </Tooltip>
                      {this.renderChartQueryButton(failureAmountNRQL)}
                    </div>
                    
                    <BillboardChart
                      accountId={this.props.accountId}
                      query={failureAmountNRQL}
                    />
                  </StackItem>
                </Stack>
                
              </GridItem>
              <GridItem columnSpan={4}>
                <Stack 
                  directionType={Stack.DIRECTION_TYPE.VERTICAL}
                >
                  <StackItem className="stackItem">
                    <div className="copy-nrql">
                      <Tooltip
                        text={`If the rate is low there may be an issue with this location!`}
                        placementType={Tooltip.PLACEMENT_TYPE.BOTTOM}
                        additionalInfoLink={additionalInfoLink}
                      >
                        <h3>Location Success Rate <Icon type={Icon.TYPE.INTERFACE__INFO__HELP} /></h3>
                      </Tooltip>
                      {this.renderChartQueryButton(locationSuccessNRQL)}
                    </div>
                    <BillboardChart
                      accountId={this.props.accountId}
                      query={locationSuccessNRQL}
                    />
                  </StackItem>
                  <StackItem className="stackItem">
                    <div className="copy-nrql">
                      <Tooltip
                        text={`If other locations are also failing with a similar error it would point to an issue for users site side.`}
                        placementType={Tooltip.PLACEMENT_TYPE.BOTTOM}
                      >
                        <h3>Other Locations Failing <Icon type={Icon.TYPE.INTERFACE__INFO__HELP} /></h3>
                      </Tooltip>
                      {this.renderBarChartQueryButton(otherLocationsNRQL)}
                    </div>
                    <BarChart
                      accountId={this.props.accountId}
                      query={otherLocationsNRQL}
                    />
                  </StackItem>
                </Stack>
              </GridItem>
              <GridItem columnSpan={4}>
                <StackItem className="stackItem">
                    <div className="copy-nrql">
                      <Tooltip
                        text={`If other monitors are failing with the same error there may be wider issues with your site!`}
                        placementType={Tooltip.PLACEMENT_TYPE.BOTTOM}
                      >
                        <h3>Other Monitors Failing <Icon type={Icon.TYPE.INTERFACE__INFO__HELP} /></h3>
                      </Tooltip>
                      {this.renderBarChartQueryButton(otherMonitorsNRQL)}
                    </div>
                  <BarChart
                    accountId={this.props.accountId}
                    query={otherMonitorsNRQL}
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
                <div className="copy-nrql">
                  <h3>Resources</h3>
                  {this.renderChartQueryButton(resourceNRQL)}
                </div>
                <TableChart
                  accountId={this.props.accountId}
                  query={resourceNRQL}
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
