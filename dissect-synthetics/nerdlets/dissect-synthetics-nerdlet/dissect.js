import React from 'react';
import PropTypes from 'prop-types';
import {
  Icon,
  Card,
  CardBody,
  Toast,
  HeadingText,
  Spinner,
  Tooltip,
  NerdGraphQuery,
  Link,
  Grid,
  GridItem,
  TextField,
  PlatformStateContext
} from 'nr1';
// https://docs.newrelic.com/docs/new-relic-programmable-platform-introduction

export default class DissectSyntheticsFailures extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      accountId: null,
      conditionsLoaded: false,
      apiKeyUrl: null,
      monitorId: null,
      allConditions: null,
      filteredConditions: [],
      policyIds: [],
      completed: 0,
      loading: false,
      loadingConditions: false,
      showApi: false,
      noConditions: false,
      noId: false,
      inLauncher: false,
      noPolicies: false,
      platformUrlState: null
    };
  }

  componentDidMount() {
    const _self = this;
    const guid = this.props.nerdletState.entityGuid;
    this.getMonitorName(guid)
    console.log(`GUID ${guid}"`)

    if (guid) {
      console.log(guid);
      
    } else {
      _self.setState({ inLauncher: true });
    }
  }

  

  

  

  

  

  

  async getMonitorName(guid) {
    // console.log("using guid", guid)
    const gql = `
            {
                actor {
                
                entity(guid: "${guid}") {
                    ... on SyntheticMonitorEntity {
                    guid
                    name
                    }
                    account{
                        id
                    }
                    entityType
                    permalink
                    reporting
                    type
                    domain
                    name
                }
                }
            }
            `;
    const monitor = await NerdGraphQuery.query({ query: gql }).then((res) => {
      //   console.log('Getting Name', res);
      if (res.data.errors) {
        throw new Error(res.data.errors);
      }
      const monitorObj = res.data.actor.entity;
      console.log('NerdG MonitorName', monitorObj);
      if (monitorObj) {

      } else {
        console.log('No Monitor Name Found');
      }

      return monitorObj;
    });
    return monitor;
  }

  

  render() {
    return <PlatformStateContext.Consumer>
              {(platformUrlState) => {
                {
                  console.log(`PlatformState ${JSON.stringify(platformUrlState)}`)
                  this.setState({platformUrlState})
                }
                return <>
                {this.state.inLauncher ? (
                  <>
                    <Card>
                      <CardBody>
                        This is the Launcher for the Dissect Synthetics Nerdlet.
                        To use this, select a{' '}
                        <Link to="https://one.newrelic.com/launcher/synthetics-nerdlets.home?nerdpacks=local&pane=eyJuZXJkbGV0SWQiOiJzeW50aGV0aWNzLW5lcmRsZXRzLm1vbml0b3ItbGlzdCJ9&platform[timeRange][duration]=1800000&platform[$isFallbackTimeRange]=true">
                          Synthetic Monitor Entity
                        </Link>{' '}
                        and navigate to the application via the left-hand tab
                      </CardBody>
                    </Card>
                  </>
                ) : null}
                
        
                <Grid spacingType={[Grid.SPACING_TYPE.LARGE]}>
                    <GridItem columnSpan={4}>
                      
                    </GridItem>
                </Grid>
                {this.state.loading ? (
                  <>
                    <HeadingText type={HeadingText.TYPE.HEADING_1}>Loading</HeadingText>
                    <Spinner
                      type={Spinner.TYPE.DOT}
                      spacingType={[Spinner.SPACING_TYPE.EXTRA_LARGE]}
                      inline
                    />
                  </>
                ) : null}
                
              </>
              }}
          </PlatformStateContext.Consumer>
  }
}
