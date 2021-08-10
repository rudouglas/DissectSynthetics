import React from "react";
import {
  Card,
  CardBody,
  Grid,
  GridItem,
  NerdGraphQuery,
  BillboardChart,
  Tooltip,
  BarChart,
  TableChart,
  Link,
  Icon,
  Stack,
  StackItem,
  Button,
  navigation,
  Tile,
  TileGroup,
  Select,
  SelectItem,
} from "nr1";
import DocCards from "./components/doc-cards";
import variableErrors from "../static/errorDictionary";

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
      plusMinus: [30, 60, 120, 240],
      setPlusMinus: 0,
    };
    this.getFailingSince = this.getFailingSince.bind(this);
    this.getResources = this.getResources.bind(this);
  }
  componentWillMount() {
    const {
      failure: { error },
      failureDict,
    } = this.props;
    this.getFailingSince();
    this.getResources();

    const failure = failureDict.filter(fail => fail.message === error);

    if (failure.length === 0) {
      let match;
      for (const err of variableErrors) {
        if (err.message === "AssertionError") {
          this.setState({ rLike: err.rLike });
          break;
        }
        if (err.regex.exec(error)) {
          match = err.regex.exec(error);
          failure = failureDict.filter((fail) => fail.message === err.message);
          this.setState({ rLike: err.rLike });
          break;
        }
      }
      !match && this.setState({ noDocumentation: true });
      console.log("tick", match);
    }
    this.setState({ failure: failure[0] });
  }

  async getFailingSince() {
    const _self = this;
    const { accountId, monitorId } = this.props;
    const { timestamp } = this.props.failure;

    // console.log("using guid", guid)
    const gql = `
      {
        actor {
          account(id: ${accountId}) {
            nrql(query: "SELECT latest(timestamp) FROM SyntheticCheck WHERE monitorId = '${monitorId}' AND result = 'SUCCESS' SINCE ${timestamp}") {
              results
              nrql
            }
          }
        }
      }
      `;
    const result = await NerdGraphQuery.query({ query: gql }).then((res) => {
      console.log(
        "Result",
        res.data.actor.account.nrql.results[0]["latest.timestamp"]
      );
      if (res.data.errors) {
        throw new Error(res.data.errors);
      }
      const latestSuccess =
        res.data.actor.account.nrql.results[0]["latest.timestamp"];
      if (latestSuccess) {
        _self.setState({ latestSuccess });
      }
      return latestSuccess;
    });
    return result;
  }

  async getResources() {
    const _self = this;
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
      console.log("Resources", res.data.actor.account.nrql.results);
      if (res.data.errors) {
        throw new Error(res.data.errors);
      }
      const resources = res.data.actor.account.nrql.results;
      if (resources) {
        _self.setState({ resources });
      }
      return resources;
    });
    return result;
  }

  openQueryNerdlet(chart, nrql) {
    const { accountId } = this.props;
    let urlState = {
      initialQueries: [
        {
          accountId,
          nrql,
        },
      ],
    };
    if (chart === "bar") {
      urlState["initialChartSettings"] = { chartType: "CHART_BAR" };
    }
    const nerdlet = {
      id: "wanda-data-exploration.data-explorer",
      urlState,
    };

    const location = navigation.openStackedNerdlet(nerdlet);
  }
  renderBarChartQueryButton(nrql) {
    return (
      <Button
        onClick={() => this.openQueryNerdlet("bar", nrql)}
        className="chart-button"
        type={Button.TYPE.OUTLINE}
        iconType={Button.ICON_TYPE.DATAVIZ__DATAVIZ__CHART__A_ADD}
        sizeType={Button.SIZE_TYPE.MEDIUM}
      />
    );
  }
  renderChartQueryButton(nrql) {
    return (
      <Button
        className="chart-button"
        onClick={() => this.openQueryNerdlet("billboard", nrql)}
        type={Button.TYPE.OUTLINE}
        iconType={Button.ICON_TYPE.DATAVIZ__DATAVIZ__CHART__A_ADD}
        sizeType={Button.SIZE_TYPE.MEDIUM}
      />
    );
  }
  changeSinceUntil(index) {
    this.setState({ setPlusMinus: index });
  }

  render() {
    const { failureDict, monitorId, accountId, relationships } = this.props;
    const { timestamp, id, locationLabel, error } = this.props.failure;
    const {
      failure,
      rLike,
      latestSuccess,
      noDocumentation,
      plusMinus,
      setPlusMinus,
    } = this.state;

    const currentTimeInMilliseconds = Date.now();
    const timestampDiff = latestSuccess
      ? latestSuccess - timestamp
      : currentTimeInMilliseconds - timestamp;

    const changePlusMinus = plusMinus[setPlusMinus];
    const since = timestamp - changePlusMinus * 60 * 1000;
    let until = timestamp + changePlusMinus * 60 * 1000;
    if (until > currentTimeInMilliseconds) {
      until = currentTimeInMilliseconds;
    }
    const sameError = rLike
      ? `AND error RLIKE r'${rLike}'`
      : `AND error = '${error}'`;
    const notSameMonitor = `AND monitorId != '${monitorId}'`;
    const failingNRQL = `SELECT latest(timestamp) FROM SyntheticCheck WHERE monitorId = '${monitorId}' AND result = 'SUCCESS' SINCE ${timestamp}`;
    const successfulResponses =
      "(200,201,202,203,204,205,206,207,208,250,226,300,301,302,303,304,305,306,307,308)";
    const resourceNRQL = `SELECT URL,responseCode FROM SyntheticRequest WHERE checkId = '${id}' AND responseCode NOT IN ${successfulResponses}`;
    const otherMonitorsNRQL = `SELECT count(*) OR 0 FROM SyntheticCheck WHERE result = 'FAILED' ${sameError} ${notSameMonitor} SINCE ${since} UNTIL ${until} FACET monitorName`;
    const otherLocationsNRQL = `SELECT count(*) OR 0 FROM SyntheticCheck WHERE monitorId = '${monitorId}' AND result = 'FAILED' AND locationLabel != '${locationLabel}'  SINCE ${since} UNTIL ${until} FACET locationLabel`;
    const locationSuccessNRQL = `SELECT percentage(count(*), WHERE result = 'SUCCESS') AS 'Location Success Rate' FROM SyntheticCheck WHERE locationLabel = '${locationLabel}' SINCE ${since} UNTIL ${until}`;
    const failureAmountNRQL = `SELECT count(*) OR 0 AS 'Failures' FROM SyntheticCheck WHERE monitorId = '${monitorId}' AND result = 'FAILED' SINCE ${since} UNTIL ${until}`;
    const failedForData = [
      {
        metadata: {
          id: "failed-for",
          name: "Failed for",
          viz: "main",
          units_data: {
            y: "MS",
          },
        },
        data: [
          { y: timestampDiff }, // Current value.
        ],
      },
    ];
    const resourceData = [
      {
        metadata: {
          id: "resource-table",
          name: "Resources",
          color: "#008c99",
          viz: "main",
          columns: ["URL", "responseCode"],
        },
        data: this.state.resources,
      },
    ];
    // console.log(`Failed For: ${failedFor}`);
    const additionalInfoLink = {
      label: "Check location Status",
      to: "https://one.nr/0xVwgVD28QJ",
    };

    return (
      <>
        <h1>{error}</h1>
        <div className="plus-minus-container">
          <Select
            className="plus-minus-select"
            description="Change the SINCE/UNTIL values of queries"
            onChange={(evt, value) => this.changeSinceUntil(value)}
            value={setPlusMinus}
          >
            {plusMinus.map((value, index) => (
              <SelectItem value={index}>{`+/- ${value} mins`}</SelectItem>
            ))}
          </Select>
        </div>
        <Stack
          directionType={Stack.DIRECTION_TYPE.HORIZONTAL}
          className="mainStack"
        >
          <StackItem className="docsSection stackItem">
            <h3>Documentation</h3>
            {!noDocumentation ? (
              <DocCards
                failureDict={failureDict}
                failure={failure}
                className="docCards"
              />
            ) : (
              <Card>
                <CardBody>
                  There is currently no Documentation for this error. Please
                  open up a GitHub issue via the <strong>Create Issue</strong>{" "}
                  button on the relevant Docs page to get this documented:
                  <br />-{" "}
                  <Link to="https://docs.newrelic.com/docs/synthetics/synthetic-monitoring/troubleshooting/simple-scripted-or-scripted-api-non-ping-errors/">
                    Simple, scripted, or scripted API (non-ping) errors
                  </Link>
                  <br />-{" "}
                  <Link to="https://docs.newrelic.com/docs/synthetics/synthetic-monitoring/troubleshooting/non-scripted-monitor-errors/">
                    Non-scripted monitor errors
                  </Link>
                </CardBody>
              </Card>
            )}
          </StackItem>
          <StackItem className="chartSection">
            <Grid>
              <GridItem columnSpan={4}>
                <StackItem className="stackItem">
                  <div className="copy-nrql">
                    <Tooltip
                      text="A short amount of time indicates the issue may be temporary. A longer time may point to more consistent issues!"
                      placementType={Tooltip.PLACEMENT_TYPE.BOTTOM}
                    >
                      <h3>
                        Failing for{" "}
                        <Icon type={Icon.TYPE.INTERFACE__INFO__HELP} />
                      </h3>
                    </Tooltip>
                    {this.renderChartQueryButton(failingNRQL)}
                  </div>
                  <BillboardChart data={failedForData} fullwidth />
                </StackItem>
                <StackItem className="stackItem lowerStack">
                  <div className="copy-nrql">
                    <Tooltip
                      text={`A low number indicates the failures may be temporary. A high number may point to more consistent issues!`}
                      placementType={Tooltip.PLACEMENT_TYPE.BOTTOM}
                    >
                      <h3>
                        Number of Failures{" "}
                        <Icon type={Icon.TYPE.INTERFACE__INFO__HELP} />
                      </h3>
                    </Tooltip>
                    {this.renderChartQueryButton(failureAmountNRQL)}
                  </div>

                  <BillboardChart
                    accountId={accountId}
                    query={failureAmountNRQL}
                  />
                </StackItem>
              </GridItem>
              <GridItem columnSpan={4}>
                <StackItem className="stackItem">
                  <div className="copy-nrql">
                    <Tooltip
                      text={`If the rate is low there may be an issue with this location!`}
                      placementType={Tooltip.PLACEMENT_TYPE.BOTTOM}
                      additionalInfoLink={additionalInfoLink}
                    >
                      <h3>
                        Location Success Rate{" "}
                        <Icon type={Icon.TYPE.INTERFACE__INFO__HELP} />
                      </h3>
                    </Tooltip>
                    {this.renderChartQueryButton(locationSuccessNRQL)}
                  </div>
                  <BillboardChart
                    accountId={accountId}
                    query={locationSuccessNRQL}
                  />
                </StackItem>
                <StackItem className="stackItem lowerStack">
                  <div className="copy-nrql">
                    <Tooltip
                      text={`If other locations are also failing with a similar error it would point to an issue for users site side.`}
                      placementType={Tooltip.PLACEMENT_TYPE.BOTTOM}
                    >
                      <h3>
                        Other Locations Failing{" "}
                        <Icon type={Icon.TYPE.INTERFACE__INFO__HELP} />
                      </h3>
                    </Tooltip>
                    {this.renderBarChartQueryButton(otherLocationsNRQL)}
                  </div>
                  <BarChart className="chart" accountId={accountId} query={otherLocationsNRQL} />
                </StackItem>
              </GridItem>
              <GridItem columnSpan={4}>
                <StackItem className="stackItem">
                  <div className="copy-nrql">
                    <Tooltip
                      text={`If other monitors are failing with the same error there may be wider issues with your site!`}
                      placementType={Tooltip.PLACEMENT_TYPE.BOTTOM}
                    >
                      <h3>
                        Other Monitors Failing{" "}
                        <Icon type={Icon.TYPE.INTERFACE__INFO__HELP} />
                      </h3>
                    </Tooltip>
                    {this.renderBarChartQueryButton(otherMonitorsNRQL)}
                  </div>
                  <BarChart accountId={accountId} query={otherMonitorsNRQL} />
                </StackItem>
                <StackItem className="stackItem relationshipSection">
                  {relationships && (
                    <>
                      <Tooltip
                        text="See what Entities this is monitoring, or what Workloads it is part of!"
                        placementType={Tooltip.PLACEMENT_TYPE.BOTTOM}
                      >
                        <h3>
                          Relationships{" "}
                          <Icon type={Icon.TYPE.INTERFACE__INFO__HELP} />
                        </h3>
                      </Tooltip>
                      <TileGroup className="relationships">
                        {relationships.map((relat, index) => (
                          <Tile
                            sizeType={Tile.SIZE_TYPE.SMALL}
                            to={relat.source.entity.permalink}
                          >
                            {relat.source.entity.name +
                              " (" +
                              relat.source.entity.type +
                              ")"}
                          </Tile>
                        ))}
                      </TileGroup>
                    </>
                  )}
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
                  accountId={accountId}
                  query={resourceNRQL}
                  fullWidth
                />
              </GridItem>
            </Grid>
          </StackItem>
        </Stack>
      </>
    );
  }
}
