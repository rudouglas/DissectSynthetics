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

export default class DocCards extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
      }
    componentDidMount() {
    }

    
   
    
    render() {
      
      return (
          <>
            <Card>
              <CardHeader title="Problem" />
              <CardBody>
                <div dangerouslySetInnerHTML={{ __html: this.props.failureDict[0].problem }} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Cause" />
              <CardBody>
                <div dangerouslySetInnerHTML={{ __html: this.props.failureDict[0].cause }} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Solution" />
              <CardBody>
                <div dangerouslySetInnerHTML={{ __html: this.props.failureDict[0].solution }} />
              </CardBody>
            </Card>
        
        </>
      )
         
    }
}
