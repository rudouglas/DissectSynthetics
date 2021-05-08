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
    this.getTroubleshootingDocs = this.getTroubleshootingDocs.bind(this)

    this.state = {
      loading: false,
      inLauncher: false,
      noPolicies: false,
      guid:null,
      failures:null,
      hidden: true,
      monitorObj: null,
      failureDict: null
    };
  }

  componentDidMount() {
    const _self = this;
    const guid = this.props.nerdletState.entityGuid;

    this.getMonitorName(guid)
    this.getTroubleshootingDocs()
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
                          account{
                            id
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
      // console.log('Getting Name', res);
      if (res.data.errors) {
        throw new Error(res.data.errors);
      }
      const monitorObj = res.data.actor.entity;
      const failures = monitorObj.nrdbQuery.results
      console.log('NerdG MonitorName', monitorObj.nrdbQuery.results);
      if (monitorObj) {
        _self.setState({failures, monitorObj})
        // console.log("We got em")
      } else {
        console.log('No Monitor Found');
      }

      return monitorObj;
    });
    return monitor;
  }

  async getTroubleshootingDocs() {
    // Scripted
    const response = await fetch("https://docs.newrelic.com/docs/synthetics/synthetic-monitoring/troubleshooting/simple-scripted-or-scripted-api-non-ping-errors.json");
    const jsonData = await response.json();
    let failureDict = []
    let regex1 = /(?<=\<h3 id\=\"simple\-browser\-errors\"\>)(.*)(?=\<h3 id\=\"scripted\-api\-browser\-errors\"\>)/
    let regex2 = /(?<=\<div\ class\=\"collapser\"\ )(.*?)(?=\<div class\=\"collapser)/g
    let regex3 = /(?<=\<h3 id\=\"scripted\-api\-browser\-errors\"\>)(.*)/

    let simpleDoc = jsonData.body.replaceAll("\n", "")
    simpleDoc = regex1.exec(simpleDoc)
    simpleDoc = simpleDoc[0] + '<div class="collapser'
    simpleDoc = simpleDoc.match(regex2)
    let apiDoc = jsonData.body.replaceAll("\n", "");
    apiDoc = regex3.exec(apiDoc)
    apiDoc = apiDoc[0] + '<div class="collapser'
    apiDoc = apiDoc.match(regex2)

    // Non-scripted
    const nonResponse = await fetch("https://docs.newrelic.com/docs/synthetics/synthetic-monitoring/troubleshooting/non-scripted-monitor-errors.json")
    const nonData = await nonResponse.json();

    let regex4 = /(?<=\<div class\=\"collapser\-group\"\>)(.*)(?=\<\/div\>)/
    let nonDoc = nonData.body.replaceAll("\n", "")
    nonDoc = regex4.exec(nonDoc)
    nonDoc = nonDoc[0] + '<div class="collapser'
    nonDoc = nonDoc.match(regex2)
    console.log(nonDoc)

    let combinedDoc = [...simpleDoc,...apiDoc,...nonDoc]
    for (let i of combinedDoc){
      let result = {}
      let title = /title\=\"(.*?)\"/.exec(i)
      let problem = /(?<=\<h3\>Problem\<\/h3\>)(.*?)(?=\<h3)/.exec(i)
      let cause = /(?<=\<h3\>Cause\<\/h3\>)(.*?)(?=\<\/div)/.exec(i)
      let solution = /(?<=\<h3\>Solution\<\/h3\>)(.*?)(?=\<h3)/.exec(i)
      // console.log(i)
      let found = failureDict.find(fai => fai.message == title[1])
      if (!found){
        result["message"] = title[1]
        result["problem"] = problem[1]
        result["cause"] = cause[1]
        result["solution"] = solution[1]

        if(title[1].match(/(\<LOCATOR\>|\(HOST\)|\(ERROR\)|XXX|\(URL\))/i)){
          console.log("VARIABLE");
          result["variable"] = true
        } else {
          result["variable"] = false
        }
        if(title[1].match(/(network|page load|65 seconds|ssl|blockedrequest|http)/i)){
          result["type"] = "Network"
        } else if (title[1].match(/(script|element|syntax|undefined|jobtimeout)/i)){
          result["type"] = "Script"
        }else if (title[1].match(/(responsevalidation)/i)){
          result["type"] = "Resource"
        }
        failureDict.push(result)
      }
      
      // result.title
    }
    console.log(failureDict)
    this.setState({failureDict})
  };

  _onClose() {
    this.setState({ hidden: true });
  }

  onUploadFileButtonClick(v) {
    console.log(`INDEX: ${JSON.stringify(v)}`)
    console.log(`FailureDict ${JSON.stringify(this.state.failureDict[0])}`);
    const { guid,monitorObj,failureDict } = this.state;
    // const guid = this.state.guid;
    // console.log("GUID", guid)
    navigation.openStackedNerdlet({
      id: 'failure-details',
      urlState: {
        guid:guid,
        failure: v,
        accountId: monitorObj.account.id,
        monitorId: monitorObj.monitorId,
        failureDict: failureDict
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
                    return <Grid spacingType={[Grid.SPACING_TYPE.LARGE]} index={i}>
                      <GridItem columnSpan={6}>
                        <Button
                          type={Button.TYPE.PRIMARY}
                          onClick={() => this.onUploadFileButtonClick(v)}
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
