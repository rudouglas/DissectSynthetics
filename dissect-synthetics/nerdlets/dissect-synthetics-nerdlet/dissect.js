import React from 'react';
import PropTypes from 'prop-types';
import * as Promise from 'bluebird';
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
  Table,
  TableHeader,
  TableHeaderCell,
  TableRowCell,
  TableRow,
} from 'nr1';
// https://docs.newrelic.com/docs/new-relic-programmable-platform-introduction

export default class DissectSyntheticsFailures extends React.Component {
  static propTypes = {
    nerdletState: PropTypes.object.isRequired,
  };

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
    };
  }

  componentDidMount() {
    const _self = this;
    const guid = this.props.nerdletState.entityGuid;

   

    if (guid) {
      console.log(guid);
      
    } else {
      _self.setState({ inLauncher: true });
    }
  }

  ProgressBar(bgcolor, completed) {
    const containerStyles = {
      height: 20,
      width: '100%',
      backgroundColor: '#e0e0de',
      borderRadius: 50,
      margin: 50,
    };
    const fillerStyles = {
      height: '100%',
      width: `${completed}%`,
      backgroundColor: bgcolor,
      borderRadius: 'inherit',
      textAlign: 'right',
    };
    const labelStyles = {
      padding: 5,
      color: 'white',
      fontWeight: 'bold',
    };
    return (
      <div style={containerStyles}>
        <div style={fillerStyles}>
          <span style={labelStyles}>{`${completed}%`}</span>
        </div>
      </div>
    );
  }

  async getConditionsTest(adminKey, policy) {
    const _self = this;
    const region = _self.state.region === 'EU' ? 'eu.' : '';

    // console.log("9. Getting Single")
    const conditionUrl = `https://api.${region}newrelic.com/v2/alerts_synthetics_conditions.json?policy_id=${policy.id}`;
    const conditionResult = await fetch(conditionUrl, {
      method: 'GET',
      headers: {
        'X-Api-Key': adminKey,
        'Content-Type': 'application/json',
      },
    }).then((response) => {
      let apiResponse;
      // console.log("Data",jsondata)
      // console.log("Daata",response)
      if (response.ok) {
        apiResponse = 200;
      } else if (response.status === 401) {
        apiResponse = 401;
      } else if (response.status === 401) {
        apiResponse = 404;
      } else if (response.status === 500) {
        apiResponse = 500;
      }

      return apiResponse;
    });

    return conditionResult;
  }

  getSynthConditions(adminKey, policy) {
    const accountId = this.state.accountId;
    const _self = this;
    const allConditions = this.state.allConditions;
    const region = _self.state.region === 'EU' ? 'eu.' : '';
    return new Promise(function (resolve, reject) {
      const conditionUrl = `https://api.${region}newrelic.com/v2/alerts_synthetics_conditions.json?policy_id=${policy.id}`;
      fetch(conditionUrl, {
        method: 'GET',
        headers: {
          'X-Api-Key': adminKey,
          'Content-Type': 'application/json',
        },
      })
        .then((response) => {
          if (response.status === 401) {
            throw new Error('Invalid API Key');
          }
          return response.json();
        })
        .then((jsondata) => {
          if (jsondata.synthetics_conditions.length > 0) {
            for (const condition of jsondata.synthetics_conditions) {
              condition.policy = policy;
              condition.type = 'Single';
              condition.entities = [];
              condition.entities.push(condition.monitor_id);
              const encoded = btoa(
                `{"nerdletId":"alerting-ui-classic.policies","nav":"Policies","selectedField":"thresholds","policyId":"${condition.policy.id}","conditionId":"${condition.id}"}`
              );
              condition.permalink = `https://one${region}.newrelic.com/launcher/nrai.launcher?pane=${encoded}&sidebars[0]=eyJuZXJkbGV0SWQiOiJucmFpLm5hdmlnYXRpb24tYmFyIiwibmF2IjoiUG9saWNpZXMifQ&platform[accountId]=${accountId}`;

              allConditions.push(condition);
              // console.log("Individual condition", condition)
            }

            _self.setState({
              allConditions,
              filteredConditions: allConditions,
            });
          }
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  getMultiConditions(adminKey, policy) {
    const accountId = this.state.accountId;
    const _self = this;
    const region = _self.state.region === 'EU' ? 'eu.' : '';
    return new Promise(function (resolve, reject) {
      const conditionUrl = `https://api.${region}newrelic.com/v2/alerts_location_failure_conditions/policies/${policy.id}.json`;
      fetch(conditionUrl, {
        method: 'GET',
        headers: {
          'X-Api-Key': adminKey,
          'Content-Type': 'application/json',
        },
      })
        .then((response) => {
          if (response.status === 401) {
            throw new Error('Invalid API Key');
          }
          if (response.status === 500) {
            throw new Error('Internal Server Error');
          }
          if (response.status === 404) {
            _self.setState({ noConditions: true });
            throw new Error('No Conditions Targetting this monitor');
          }
          return response.json();
        })
        .then((jsondata) => {
          // console.log("Alll Condition", jsondata)
          if (jsondata.location_failure_conditions.length > 0) {
            const allConditions = _self.state.allConditions;
            for (const condition of jsondata.location_failure_conditions) {
              condition.policy = policy;
              condition.type = 'Multi';
              const encoded = btoa(
                `{"nerdletId":"alerting-ui-classic.policies","nav":"Policies","selectedField":"thresholds","policyId":"${condition.policy.id}","conditionId":"${condition.id}"}`
              );
              condition.permalink = `https://one${region}.newrelic.com/launcher/nrai.launcher?pane=${encoded}&sidebars[0]=eyJuZXJkbGV0SWQiOiJucmFpLm5hdmlnYXRpb24tYmFyIiwibmF2IjoiUG9saWNpZXMifQ&platform[accountId]=${accountId}`;

              allConditions.push(condition);
              // console.log("Individual condition", condition)
            }

            _self.setState({
              allConditions,
              filteredConditions: allConditions,
            });
          }

          _self.setState({ completed: _self.state.completed + 1 });
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  async getPromises(adminKey, policies) {
    const promises = [];
    const _self = this;

    const firstPolicy = policies[0];
    const keyTest = await _self.getConditionsTest(adminKey, firstPolicy);
    if (keyTest === 401) {
      return 401;
    } else if (keyTest === 200) {
      for (const policy of policies) {
        promises.push(_self.getSynthConditions(adminKey, policy));
        promises.push(_self.getMultiConditions(adminKey, policy));
      }
      const allApiConditions = await Promise.all(promises)
        .then((values) => {
          Toast.showToast({
            title: 'Success',
            description: `Loaded ${_self.state.allConditions.length} Conditions`,
            type: Toast.TYPE.NORMAL,
          });
          return values;
        })
        .catch((err) => {
          _self.setState({ loading: false });
          Toast.showToast({
            title: 'Error',
            description: err,
            type: Toast.TYPE.CRITICAL,
          });
          promises.forEach((p) => p.cancel());
        });
      return allApiConditions;
    }
  }

  async conditionJobs(adminKey, policies) {
    const _self = this;
    const apiConditions = await _self.getPromises(adminKey, policies);
    if (apiConditions === 401) {
      return 401;
    } else {
      await _self.getNrqls();
      await _self.filterConditions();
      return 200;
    }
  }

  handleAdminKeyChange(adminKey) {
    if (adminKey.length > 0) {
      // UserQuery.query().then(({ data }) => console.log("User",data));
      const _self = this;
      const policies = _self.state.policyIds;
      _self.setState({
        adminKey,
        loadingConditions: true,
        allConditions: [],
        filteredConditions: [],
      });
      this.conditionJobs(adminKey, policies)
        .then((result) => {
          if (result === 200) {
            _self.setState({
              loadingConditions: false,
              conditionsLoaded: true,
            });
          } else if (result === 401) {
            Toast.showToast({
              title: 'Error',
              description: 'API Key is Unauthorized, please check',
              type: Toast.TYPE.CRITICAL,
            });
            _self.setState({ loadingConditions: false });
          }
        })
        .catch((err) => {
          _self.setState({ loadingConditions: false });
          Toast.showToast({
            title: 'Error',
            description: err,
            type: Toast.TYPE.CRITICAL,
          });
        });
    } else {
      Toast.showToast({
        title: 'Error',
        description: 'Admin Key is Empty',
        type: Toast.TYPE.CRITICAL,
      });
    }

    // UserQuery.query().then(({ data }) => console.log("User",data));
  }

  async getNrqlName(monitorName) {
    // console.log("Getting NRQL Name")
    const _self = this;
    const accountId = _self.state.accountId;

    const gql = `
        {
            actor {
            account(id: ${accountId}) {
                alerts {
                
                nrqlConditionsSearch(searchCriteria: {queryLike: "'${monitorName}'"}) {
                    nextCursor
                    nrqlConditions {
                    enabled
                    id
                    name
                    nrql {
                        query
                    }
                    policyId
                    }
                }
                
                }
            }
            }
        }
        `;
    const nameQuery = await NerdGraphQuery.query({ query: gql }).then((res) => {
      if (res.data.errors) {
        throw new Error(res.data.errors);
      }
      const nrql =
        res.data.actor.account.alerts.nrqlConditionsSearch.nrqlConditions;
      // console.log("NerdG NrqlName",nrql)
      if (nrql[0]) {
        const filteredConditions = _self.state.filteredConditions;
        for (const condition of nrql) {
          const region = _self.state.region === 'EU' ? '.eu' : '';
          condition.type = 'NRQL';
          condition.entities = [];
          const encoded = btoa(
            `{"nerdletId":"alerting-ui-classic.policies","nav":"Policies","selectedField":"thresholds","policyId":"${condition.policyId}","conditionId":"${condition.id}"}`
          );
          condition.permalink = `https://one${region}.newrelic.com/launcher/nrai.launcher?pane=${encoded}&sidebars[0]=eyJuZXJkbGV0SWQiOiJucmFpLm5hdmlnYXRpb24tYmFyIiwibmF2IjoiUG9saWNpZXMifQ&platform[accountId]=${accountId}`;

          filteredConditions.push(condition);
          // console.log("Individual condition", condition)
        }
        _self.setState({ filteredConditions });
        return filteredConditions;
      } else {
        return null;
      }
    });

    return nameQuery;
  }

  async getNrqlId(monitorId, resolve, reject) {
    // console.log("Getting NRQL Id")
    const _self = this;

    const accountId = _self.state.accountId;

    const gql = `
        {
            actor {
            account(id: ${accountId}) {
                alerts {
                
                nrqlConditionsSearch(searchCriteria: {queryLike: "'${monitorId}'"}) {
                    nextCursor
                    nrqlConditions {
                    enabled
                    id
                    name
                    nrql {
                        query
                    }
                    policyId
                    }
                }
                
                }
            }
            }
        }
        `;
    const idQuery = await NerdGraphQuery.query({ query: gql }).then((res) => {
      if (res.data.errors) {
        reject(res.data.errors);
      }
      const nrql =
        res.data.actor.account.alerts.nrqlConditionsSearch.nrqlConditions;
      // console.log("NerdG NrqlId",nrql)
      if (nrql[0]) {
        const filteredConditions = _self.state.filteredConditions;
        for (const condition of nrql) {
          const region = _self.state.region === 'EU' ? '.eu' : '';
          condition.type = 'NRQL';
          condition.entities = [];
          const encoded = btoa(
            `{"nerdletId":"alerting-ui-classic.policies","nav":"Policies","selectedField":"thresholds","policyId":"${condition.policyId}","conditionId":"${condition.id}"}`
          );
          condition.permalink = `https://one${region}.newrelic.com/launcher/nrai.launcher?pane=${encoded}&sidebars[0]=eyJuZXJkbGV0SWQiOiJucmFpLm5hdmlnYXRpb24tYmFyIiwibmF2IjoiUG9saWNpZXMifQ&platform[accountId]=${accountId}`;

          filteredConditions.push(condition);
          // console.log("Individual condition", condition)
        }
        _self.setState({ filteredConditions });
        return filteredConditions;
      } else {
        return null;
      }
    });
    return idQuery;
  }

  async getNrqlFacetName() {
    // console.log("Getting NRQL Facet")
    const _self = this;
    const accountId = _self.state.accountId;

    const gql = `
        {
            actor {
            account(id: ${accountId}) {
                alerts {
                
                nrqlConditionsSearch(searchCriteria: {queryLike: "FACET monitorName"}) {
                    nextCursor
                    nrqlConditions {
                    enabled
                    id
                    name
                    nrql {
                        query
                    }
                    policyId
                    }
                }
                
                }
            }
            }
        }
        `;
    const facetQuery = await NerdGraphQuery.query({ query: gql }).then(
      (res) => {
        if (res.data.errors) {
          throw new Error(res.data.errors);
        }
        const nrql =
          res.data.actor.account.alerts.nrqlConditionsSearch.nrqlConditions;
        // console.log("NerdG NrqlFacet",res.data.actor.account.alerts)
        if (nrql[0]) {
          const filteredConditions = _self.state.filteredConditions;
          for (const condition of nrql) {
            const region = _self.state.region === 'EU' ? '.eu' : '';
            condition.type = 'NRQL Facet';
            condition.facet = true;
            condition.entities = [];
            const encoded = btoa(
              `{"nerdletId":"alerting-ui-classic.policies","nav":"Policies","selectedField":"thresholds","policyId":"${condition.policyId}","conditionId":"${condition.id}"}`
            );
            condition.permalink = `https://one${region}.newrelic.com/launcher/nrai.launcher?pane=${encoded}&sidebars[0]=eyJuZXJkbGV0SWQiOiJucmFpLm5hdmlnYXRpb24tYmFyIiwibmF2IjoiUG9saWNpZXMifQ&platform[accountId]=${accountId}`;
            filteredConditions.push(condition);
            // console.log("Individual condition", condition)
          }

          _self.setState({ filteredConditions });
          return filteredConditions;
        } else {
          return null;
        }
      }
    );

    return facetQuery;
  }

  async getNrqlFacetId() {
    // console.log("Getting NRQL Facet")
    const _self = this;
    const accountId = _self.state.accountId;

    const gql = `
        {
            actor {
            account(id: ${accountId}) {
                alerts {
                
                nrqlConditionsSearch(searchCriteria: {queryLike: "FACET monitorId"}) {
                    nextCursor
                    nrqlConditions {
                    enabled
                    id
                    name
                    nrql {
                        query
                    }
                    policyId
                    }
                }
                
                }
            }
            }
        }
        `;
    const facetQuery = await NerdGraphQuery.query({ query: gql }).then(
      (res) => {
        if (res.data.errors) {
          throw new Error(res.data.errors);
        }
        const nrql =
          res.data.actor.account.alerts.nrqlConditionsSearch.nrqlConditions;
        // console.log("NerdG NrqlFacet",nrql)
        if (nrql[0]) {
          const filteredConditions = _self.state.filteredConditions;
          for (const condition of nrql) {
            const region = _self.state.region === 'EU' ? '.eu' : '';
            condition.type = 'NRQL Facet';
            condition.entities = [];
            const encoded = btoa(
              `{"nerdletId":"alerting-ui-classic.policies","nav":"Policies","selectedField":"thresholds","policyId":"${condition.policyId}","conditionId":"${condition.id}"}`
            );
            condition.permalink = `https://one${region}.newrelic.com/launcher/nrai.launcher?pane=${encoded}&sidebars[0]=eyJuZXJkbGV0SWQiOiJucmFpLm5hdmlnYXRpb24tYmFyIiwibmF2IjoiUG9saWNpZXMifQ&platform[accountId]=${accountId}`;
            filteredConditions.push(condition);
            // console.log("Individual condition", condition)
          }

          _self.setState({ filteredConditions });
          return filteredConditions;
        } else {
          return null;
        }
      }
    );

    return facetQuery;
  }

  getNrqls() {
    const _self = this;
    const monitorId = _self.state.monitorId;
    const monitorName = _self.state.monitorName;
    async function nrqlWork() {
      await _self.getNrqlName(monitorName);
      await _self.getNrqlId(monitorId);
      await _self.getNrqlFacetName();
      const facetIdQuery = await _self.getNrqlFacetId();
      return facetIdQuery;
    }

    nrqlWork()
      .then(() => {})
      .catch((err) => {
        _self.setState({ loading: false });
        Toast.showToast({
          title: 'Error',
          description: err,
          type: Toast.TYPE.CRITICAL,
        });
      });
  }

  async filterConditions() {
    const _self = this;
    let filteredConditions = _self.state.allConditions;
    const monitorId = this.state.monitorId;
    // console.log("Filtered Conditions",filteredConditions)
    filteredConditions = await filteredConditions.filter(function (item) {
      return item.entities.indexOf(monitorId) !== -1;
    });
    this.setState({ filteredConditions });
  }

  async getPolicies(accountId) {
    const gql = `
            {
                actor {
                    account(id: ${accountId}) {
                        alerts {
                            policiesSearch {
                                nextCursor
                                policies {
                                    id
                                    name
                                    incidentPreference
                                }
                                totalCount
                            }
                        }
                    }
                }
            }
        `;
    const policies = await NerdGraphQuery.query({ query: gql }).then((res) => {
      if (res.data.errors) {
        Toast.showToast({
          title: 'Error',
          description: res.data.errors,
          type: Toast.TYPE.CRITICAL,
        });
      }
      const policyIds = res.data.actor.account.alerts.policiesSearch.policies;
      if (policyIds) {
        this.setState({ policyIds });
        // console.log("Got Policies")

        Toast.showToast({
          title: 'Success',
          description: `Loaded ${policyIds.length} Policies`,
          type: Toast.TYPE.NORMAL,
        });
      } else {
        Toast.showToast({
          title: 'Error',
          description: 'No Policies found, try refreshing the page',
          type: Toast.TYPE.CRITICAL,
        });
      }

      return policyIds;
    });

    return policies;
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
      //   console.log('NerdG MonitorName', monitorObj);
      if (monitorObj) {
        const apiKeyUrl = `https://rpm.newrelic.com/accounts/${monitorObj.account.id}/integrations?page=api_keys`;

        this.setState({ accountId: monitorObj.account.id, apiKeyUrl });
        // console.log('Got MonitorName and Id', monitorObj.account.id);
      } else {
        // console.log('No Monitor Name Found');
      }

      return monitorObj;
    });
    return monitor;
  }

  async getMonitorId(name, accountId) {
    const _self = this;
    const gql = `
        {
            actor {
            account(id: ${accountId}) {
                licenseKey
                nrql(query: "SELECT latest(monitorId) FROM SyntheticCheck WHERE monitorName = '${name}' SINCE 13 month ago") {
                results
                }
            }
            }
        }
        `;

    const monitorId = await NerdGraphQuery.query({ query: gql }).then((res) => {
      // console.log("Has this monitor run in last 13 months?",res.data)
      if (res.data.errors) {
        throw new Error(res.data.errors);
      }
      // UPDATES
      const license = res.data.actor.account.licenseKey;
      const region = license.slice(0, 2) === 'eu' ? 'EU' : 'US';
      _self.setState({ region });
      // UPDATES
      const id = res.data.actor.account.nrql.results[0][`latest.monitorId`];
      //   console.log('NerdG MonitorId', id);
      if (!id) {
        this.setState({ noId: true });
      }
      return id;
    });

    return monitorId;
  }

  render() {
    return (
      <>
        {this.state.inLauncher ? (
          <>
            <Card>
              <CardBody>
                This is the Launcher for the Synthetics Condition Search Nerdlet.
                To use this, select a{' '}
                <Link to="https://one.newrelic.com/launcher/synthetics-nerdlets.home?nerdpacks=local&pane=eyJuZXJkbGV0SWQiOiJzeW50aGV0aWNzLW5lcmRsZXRzLm1vbml0b3ItbGlzdCJ9&platform[timeRange][duration]=1800000&platform[$isFallbackTimeRange]=true">
                  Synthetic Monitor Entity
                </Link>{' '}
                and navigate to the application via the left-hand tab
              </CardBody>
            </Card>
            <img src={navigate} alt="Navigate" height="600px" />
          </>
        ) : null}
        {this.state.noPolicies ? (
          <Card>
            <CardBody>
              There are no Alert Policies setup for this Account. To create one,
              go to{' '}
              <Link
                to={`https://one.newrelic.com/launcher/nrai.launcher?pane=eyJuZXJkbGV0SWQiOiJhbGVydGluZy11aS1jbGFzc2ljLnBvbGljaWVzIiwibmF2IjoiUG9saWNpZXMifQ==&sidebars[0]=eyJuZXJkbGV0SWQiOiJucmFpLm5hdmlnYXRpb24tYmFyIiwibmF2IjoiUG9saWNpZXMifQ==&platform[accountId]=${this.state.accountId}`}
              >
                Alerts & AI
              </Link>
            </CardBody>
          </Card>
        ) : null}

        <Grid spacingType={[Grid.SPACING_TYPE.LARGE]}>
          {this.state.showApi && !this.state.noId ? (
            <GridItem columnSpan={4}>
              <TextField
                type={TextField.TYPE.PASSWORD}
                label="REST API Key"
                placeholder="Copy/Paste REST API..."
                onChange={(event) =>
                  this.handleAdminKeyChange(event.target.value)
                }
              />
              <Link to={this.state.apiKeyUrl}>Find your REST API Key</Link>
              {this.state.conditionsLoaded ? (
                <Card>
                  <CardBody>
                    <Icon type={Icon.TYPE.INTERFACE__INFO__INFO} />
                    These NRQL Conditions are general conditions that contain{' '}
                    <code>FACET monitorName</code> or{' '}
                    <code>FACET monitorId</code>
                  </CardBody>
                </Card>
              ) : null}
            </GridItem>
          ) : null}
          {this.state.noConditions ? (
            <pre>No Conditions targetting this monitor</pre>
          ) : null}
          {this.state.noId ? (
            <GridItem columnSpan={8}>
              <pre>
                No Monitor ID found! If this monitor has run within the last 13
                months try refreshing the page
              </pre>
            </GridItem>
          ) : null}

          {this.state.conditionsLoaded &&
          this.state.filteredConditions.length < 1 ? (
            <GridItem columnSpan={8}>
              <pre>
                This monitor {this.state.monitorName} has no Alert Conditions
                targeting it! Set them up now in Alerts & AI
              </pre>
            </GridItem>
          ) : null}
          {this.state.conditionsLoaded &&
          this.state.filteredConditions.length > 0 ? (
            <GridItem columnSpan={8}>
              <Table items={this.state.filteredConditions}>
                <TableHeader>
                  <TableHeaderCell value={({ item }) => item}>
                    Condition
                  </TableHeaderCell>
                  <TableHeaderCell value={({ item }) => item.entities.length}>
                    Entities
                  </TableHeaderCell>
                  <TableHeaderCell value={({ item }) => item.type}>
                    Type
                  </TableHeaderCell>
                  <TableHeaderCell value={({ item }) => item.enabled}>
                    Enabled
                  </TableHeaderCell>
                </TableHeader>

                {({ item }) => (
                  <TableRow>
                    <TableRowCell>
                      {item.type === 'NRQL Facet' ? (
                        <Icon type={Icon.TYPE.INTERFACE__INFO__INFO} />
                      ) : null}{' '}
                      <Link to={item.permalink}>
                        {item.name.length > 25
                          ? `${item.name.substring(0, 25)}...`
                          : item.name}{' '}
                      </Link>
                    </TableRowCell>
                    <TableRowCell>
                      <Tooltip
                        text={item.entities.join('\n')}
                        placementType={Tooltip.PLACEMENT_TYPE.BOTTOM}
                      >
                        {item.entities.length > 0 ? item.entities.length : '-'}
                      </Tooltip>
                    </TableRowCell>
                    <TableRowCell>{item.type}</TableRowCell>
                    <TableRowCell>
                      {item.enabled ? (
                        <Icon type={Icon.TYPE.INTERFACE__SIGN__CHECKMARK} />
                      ) : (
                        <Icon type={Icon.TYPE.INTERFACE__SIGN__TIMES} />
                      )}
                    </TableRowCell>
                  </TableRow>
                )}
              </Table>
            </GridItem>
          ) : null}
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
        {this.state.loadingConditions ? (
          <>
            <HeadingText type={HeadingText.TYPE.HEADING_1}>
              Loading Conditions
            </HeadingText>
            <Grid spacingType={[Grid.SPACING_TYPE.LARGE]}>
              <GridItem columnSpan={4}>
                {this.ProgressBar(
                  '#ef6c00',
                  Math.ceil(
                    (this.state.completed / this.state.policyIds.length) * 100
                  )
                )}
              </GridItem>
            </Grid>
          </>
        ) : null}
      </>
    );
  }
}
