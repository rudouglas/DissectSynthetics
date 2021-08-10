import React from "react";
import {
  Icon,
  Button,
  Card,
  CardBody,
  navigation,
  Spinner,
  NerdGraphQuery,
  Link,
  Grid,
  GridItem,
  BlockText,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableRowCell,
  TableHeaderCell,
  Tile,
  TileGroup,
} from "nr1";
import variableErrors from "../static/errorDictionary";
var _ = require("lodash");
// https://docs.newrelic.com/docs/new-relic-programmable-platform-introduction

export default class DissectSyntheticsFailures extends React.Component {
  constructor(props) {
    super(props);
    this._onClose = this._onClose.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.openModal = this.openModal.bind(this);
    this.onDissectButtonClick = this.onDissectButtonClick.bind(this);
    this.getTroubleshootingDocs = this.getTroubleshootingDocs.bind(this);
    this.changeFailureSummary = this.changeFailureSummary.bind(this);
    this.getErrorDetails = this.getErrorDetails.bind(this);

    this.state = {
      loading: false,
      inLauncher: false,
      noPolicies: false,
      guid: null,
      failures: null,
      hidden: true,
      monitorObj: null,
      failureDict: null,
      since: null,
      selectedError: 0,
      hideModal: true,
    };
  }
  componentDidUpdate(prevProps) {
    if (this.props.since !== prevProps.since) {
      const { entityGuid } = this.props.nerdletState;
      this.getMonitorName(entityGuid);
    }
  }
  componentWillMount() {
    const _self = this;
    const { entityGuid } = this.props.nerdletState;

    this.getMonitorName(entityGuid);
    this.getTroubleshootingDocs();
    if (entityGuid) {
      _self.setState({ entityGuid });
    } else {
      _self.setState({ inLauncher: true });
    }
  }

  async getErrorDetails(error, monitorId, accountId) {
    const { since } = this.props;
    let events;
    const gql = `{
      actor {
        account(id: ${accountId}) {
          nrql(query: "SELECT * FROM SyntheticCheck WHERE monitorId = '${monitorId}' AND error = '${error[0].error}' ${since} LIMIT MAX") {
            results
          }
        }
      }
    }`;
    await NerdGraphQuery.query({ query: gql }).then((res) => {
      if (res.data.errors) {
        throw new Error(res.data.errors);
      }
      events = res.data.actor.account.nrql.results;
    });
    return events;
  }

  async getMonitorName(guid) {
    const _self = this;
    const { since } = this.props;
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
                        nrdbQuery(nrql: "SELECT count(*) FROM SyntheticCheck WHERE result = 'FAILED' FACET error ${since} LIMIT MAX") {
                          results
                        }
                        relationships {
                          type
                          target {
                            accountId
                            entity {
                              account {
                                id
                                name
                              }
                              domain
                              entityType
                              name
                              permalink
                              reporting
                              type
                            }
                            entityType
                          }
                          source {
                            entity {
                              entityType
                              domain
                              name
                              permalink
                              reporting
                              type
                              account {
                                id
                                name
                              }
                            }
                          }
                        }
                      }
                    }
                  }
            `;
    const monitor = await NerdGraphQuery.query({ query: gql }).then((res) => {
      console.log("Getting Name", res);
      if (res.data.errors) {
        throw new Error(res.data.errors);
      }
      const monitorObj = res.data.actor.entity;
      const failures = monitorObj.nrdbQuery.results;
      const accountId = monitorObj.account.id;
      const { monitorId } = monitorObj;
      if (monitorObj) {
        let groupped = _.groupBy(failures, "error");
        let groupedByError = Object.keys(groupped).map(function (key) {
          return groupped[key];
        });
        const promises = groupedByError.map((error) =>
          this.getErrorDetails(error, monitorId, accountId)
        );
        Promise.all(promises).then((res) =>
          _self.setState({
            failures: res,
            monitorObj,
          })
        );
      } else {
        console.log("No Monitor Found");
      }
      return monitorObj;
    });
    return monitor;
  }

  async getTroubleshootingDocs() {
    // Scripted
    const response = await fetch(
      "https://docs.newrelic.com/docs/synthetics/synthetic-monitoring/troubleshooting/simple-scripted-or-scripted-api-non-ping-errors.json"
    );
    const jsonData = await response.json();
    let failureDict = [];
    let regex1 =
      /(?<=\<h3 id\=\"simple\-browser\-errors\"\>)(.*)(?=\<h3 id\=\"scripted\-api\-browser\-errors\"\>)/s;
    let regex2 =
      /(?<=\<div\ class\=\"collapser\"\ )(.*?)(?=\<div class\=\"collapser)/gs;
    let regex3 = /(?<=\<h3 id\=\"scripted\-api\-browser\-errors\"\>)(.*)/s;

    let simpleDoc = regex1.exec(jsonData.body);
    simpleDoc = simpleDoc[0] + '<div class="collapser';
    simpleDoc = simpleDoc.match(regex2);
    let apiDoc = regex3.exec(jsonData.body);
    apiDoc = apiDoc[0] + '<div class="collapser';
    apiDoc = apiDoc.match(regex2);

    // Non-scripted
    const nonResponse = await fetch(
      "https://docs.newrelic.com/docs/synthetics/synthetic-monitoring/troubleshooting/non-scripted-monitor-errors.json"
    );
    const nonData = await nonResponse.json();

    let regex4 = /(?<=\<div class\=\"collapser\-group\"\>)(.*)(?=\<\/div\>)/s;
    let nonDoc = regex4.exec(nonData.body);
    nonDoc = nonDoc[0] + '<div class="collapser';
    nonDoc = nonDoc.match(regex2);
    console.log(nonDoc);

    let combinedDoc = [...simpleDoc, ...apiDoc, ...nonDoc];
    for (let i of combinedDoc) {
      let result = {};
      let title = /title\=\"(.*?)\"/.exec(i);
      let problem = /(?<=\<h3\>Problem\<\/h3\>)(.*?)(?=\<h3)/s.exec(i);
      let cause = /(?<=\<h3\>Cause\<\/h3\>)(.*?)(?=\<\/div)/s.exec(i);
      let solution = /(?<=\<h3\>Solution\<\/h3\>)(.*?)(?=\<h3)/s.exec(i);
      let found = failureDict.find((fai) => fai.message == title[1]);
      if (!found) {
        result["message"] = title[1];
        result["problem"] = problem[1];
        result["cause"] = cause[1];
        result["solution"] = solution[1];

        if (title[1].match(/(\<LOCATOR\>|\(HOST\)|\(ERROR\)|XXX|\(URL\))/i)) {
          result["variable"] = true;
          const res = variableErrors.filter((err) => err.message === title[1]);
          result["rLike"] = res[0].rLike;
        } else {
          result["variable"] = false;
        }
        if (
          title[1].match(
            /(network|page load|65 seconds|ssl|blockedrequest|http)/i
          )
        ) {
          result["type"] = "Network";
        } else if (
          title[1].match(/(script|element|syntax|undefined|jobtimeout)/i)
        ) {
          result["type"] = "Script";
        } else if (title[1].match(/(responsevalidation)/i)) {
          result["type"] = "Resource";
        }
        failureDict.push(result);
      }
    }
    this.setState({ failureDict });
  }

  onDissectButtonClick(singleFailure) {
    const { guid, monitorObj, failureDict } = this.state;
    navigation.openStackedNerdlet({
      id: "failure-details",
      urlState: {
        guid,
        failure: singleFailure,
        relationships: monitorObj.relationships,
        accountId: monitorObj.account.id,
        monitorId: monitorObj.monitorId,
        failureDict,
      },
    });
  }
  changeFailureSummary(tileValue) {
    this.setState({ selectedError: tileValue });
  }
  renderFailureSummary() {
    const { failures, selectedError } = this.state;
    if (!failures) {
      return (
        <>
          <Spinner
            type={Spinner.TYPE.DOT}
            spacingType={[Spinner.SPACING_TYPE.EXTRA_LARGE]}
            inline
          />
        </>
      );
    }
    return failures.length > 0 ? (
      <GridItem columnSpan={5}>
        <h3>Error Summaries</h3>
        <TileGroup
          value={selectedError}
          onChange={this.changeFailureSummary}
          selectionType={TileGroup.SELECTION_TYPE.SINGLE}
        >
          {failures.map((failure, index) => (
            <Tile className="error-tile" value={index}>
              <BlockText tagType={BlockText.TYPE.DIV}>
                <strong>{failure[0].error}</strong>
              </BlockText>
              <Badge
                type={Badge.TYPE.WARNING}
              >{`${failure.length} Errors`}</Badge>
            </Tile>
          ))}
        </TileGroup>
      </GridItem>
    ) : (
      <h3>No failures here :D</h3>
    );
  }
  renderFailures() {
    const { selectedError, failures } = this.state;
    return failures ? (
      <GridItem columnSpan={7}>
        <Table
          items={failures[selectedError]}
          spacingType={[Table.SPACING_TYPE.EXTRA_LARGE]}
        >
          <TableHeader>
            <TableHeaderCell width="80px">Dissect</TableHeaderCell>
            <TableHeaderCell>Unique</TableHeaderCell>
            <TableHeaderCell width="20%">Location</TableHeaderCell>
            <TableHeaderCell>Timestamp</TableHeaderCell>
          </TableHeader>
          {({ item }) => (
            <TableRow className="tableRow">
              <TableRowCell>
                <Button
                  type={Button.TYPE.OUTLINE}
                  sizeType={Button.SIZE_TYPE.SMALL}
                  className="dissectButton"
                  onClick={() => this.onDissectButtonClick(item)}
                >
                  <Icon
                    type={Icon.TYPE.INTERFACE__OPERATIONS__SEARCH__V_ALTERNATE}
                  />
                </Button>
              </TableRowCell>
              <TableRowCell>{item.error}</TableRowCell>
              <TableRowCell>{item.locationLabel}</TableRowCell>
              <TableRowCell>
                {new Intl.DateTimeFormat("en-GB", {
                  dateStyle: "full",
                  timeStyle: "long",
                }).format(item.timestamp)}
              </TableRowCell>
            </TableRow>
          )}
        </Table>
      </GridItem>
    ) : (
      <h3>No failures here</h3>
    );
  }
  _onClose() {
    this.setState({ hidden: true });
  }
  openModal() {
    this.setState({ hideModal: false });
  }
  closeModal() {
    this.setState({ hideModal: true });
  }
  render() {
    const { hideModal, failures } = this.state;
    return (
      <>
        {this.state.inLauncher && (
          <>
            <Card>
              <CardBody>
                This is the Launcher for the Dissect Synthetics Nerdlet. To use
                this, select a{" "}
                <Link to="https://one.newrelic.com/launcher/synthetics-nerdlets.home?nerdpacks=local&pane=eyJuZXJkbGV0SWQiOiJzeW50aGV0aWNzLW5lcmRsZXRzLm1vbml0b3ItbGlzdCJ9&platform[timeRange][duration]=1800000&platform[$isFallbackTimeRange]=true">
                  Synthetic Monitor Entity
                </Link>{" "}
                and navigate to the application via the left-hand tab
              </CardBody>
            </Card>
          </>
        )}
        <Grid spacingType={[Grid.SPACING_TYPE.LARGE]}>
          {this.renderFailureSummary()}
          {failures && this.renderFailures()}
        </Grid>
      </>
    );
  }
}
