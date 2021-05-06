import React from 'react';
import PropTypes from 'prop-types';
import {
  Icon,
  Button,
  Card,
  CardBody,
  Modal,
  BlockText,
  navigation,
  List,
  ListItem,
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
    this._onClose = this._onClose.bind(this);
  
    this.onUploadFileButtonClick = this.onUploadFileButtonClick.bind(this);
    this.state = {
      loading: false,
      inLauncher: false,
      noPolicies: false,
      guid:null,
      failures:null,
      hidden: true,
    };
  }

  componentDidMount() {
    const _self = this;
    const guid = this.props.nerdletState.entityGuid;

    this.getMonitorName(guid)
    console.log(`GUID ${guid}"`)

    if (guid) {
      console.log(guid);
      _self.setState({guid})
    } else {
      _self.setState({ inLauncher: true });
    }
  }

  async getMonitorName(guid) {
    const _self = this
    // console.log("using guid", guid)
    const gql = `
                  {
                    actor {
                      entity(guid: "${guid}") {
                        domain
                        type
                        ... on SyntheticMonitorEntity {
                          guid
                          name
                          monitorId
                          monitorSummary {
                            locationsFailing
                            locationsRunning
                            status
                            successRate
                          }
                          monitorType
                          monitoredUrl
                          period
                          recentAlertViolations(count: 10) {
                            alertSeverity
                            closedAt
                            label
                            level
                            openedAt
                            violationId
                            violationUrl
                          }
                        }
                        nrdbQuery(nrql: "SELECT * FROM SyntheticCheck WHERE result='FAILED'") {
                          results
                        }
                      }
                    }
                  }
            `;
    const monitor = await NerdGraphQuery.query({ query: gql }).then((res) => {
      console.log('Getting Name', res);
      if (res.data.errors) {
        throw new Error(res.data.errors);
      }
      const monitorObj = res.data.actor.entity;
      const failures = monitorObj.nrdbQuery.results
      console.log('NerdG MonitorName', monitorObj.nrdbQuery.results);
      if (monitorObj) {
        _self.setState({failures})
        console.log("We got em")
      } else {
        console.log('No Monitor Found');
      }

      return monitorObj;
    });
    return monitor;
  }

  _onClose() {
    this.setState({ hidden: true });
  }

  onUploadFileButtonClick = e => {
    e.preventDefault()
    const { guid } = this.state;
    // const guid = this.state.guid;
    // console.log("GUID", guid)
    navigation.openStackedNerdlet({
      id: 'failure-details',
      urlState: {
        guid: guid
      }
    })
  }

  render() {
    return <PlatformStateContext.Consumer>
              {(platformUrlState) => {
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
                {
                  this.state.failures ? 
                  this.state.failures.map((v,i) => {
                    return <Grid spacingType={[Grid.SPACING_TYPE.LARGE]}>
                      <GridItem columnSpan={6}>
                        <Button
                          type={Button.TYPE.PRIMARY}
                          onClick={this.onUploadFileButtonClick}
                        >
                          {v.error}
                        </Button>
                        </GridItem>
                      <GridItem columnSpan={3}>{v.locationLabel}</GridItem>
                      <GridItem columnSpan={3}>{new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'long' }).format(v.timestamp)}</GridItem>
                      </Grid>
                  })
                  :
                  null
                  
                }
                    
                    <Modal hidden={this.state.hidden} onClose={this._onClose}>
                      <HeadingText type={HeadingText.TYPE.HEADING_1}>Modal</HeadingText>

                      <BlockText type={BlockText.TYPE.PARAGRAPH}>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                        eiusmod tempor incididunt ut labore et dolore magna aliqua. Dictumst
                        quisque sagittis purus sit amet.
                      </BlockText>

                      <Button onClick={this._onClose}>Close</Button>
                    </Modal>
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
