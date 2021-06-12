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
          failure: null,
        }
      }
    componentWillMount() {
      console.log(`Error Messge ${this.props.error}`)
      const {error} = this.props
      let failure
      
      if(error.includes('DNS resolution')){
         failure = this.props.failureDict.filter(failure => failure.message.includes('DNS resolution'))
      } else if(error.includes('ResponseValidationError')){
        failure = this.props.failureDict.filter(failure => failure.message.includes('ResponseValidationError'))
      } else if(error.includes('SSLVerificationError')){
        failure = this.props.failureDict.filter(failure => failure.message.includes('SSLVerificationError'))
      } else if(error.includes('connect timed out')){
        failure = this.props.failureDict.filter(failure => failure.message.includes('onnect timed out'))
      } else if(error.includes('no such element')){
        failure = this.props.failureDict.filter(failure => failure.message.includes('no such element'))
      }
      console.log(failure)
      this.setState({failure: failure[0]})
    }

    
   
    
    render() {
      
      return (
          <>
            <Card>
              <CardHeader title="Problem" />
              <CardBody>
                <div dangerouslySetInnerHTML={{ __html: this.state.failure.problem }} />
              </CardBody>
            </Card>
            <Card className="causeCard">
              <CardHeader title="Cause" />
              <CardBody>
                <div dangerouslySetInnerHTML={{ __html: this.state.failure.cause }} />
              </CardBody>
            </Card>
            <Card className="solutionCard">
              <CardHeader title="Solution" />
              <CardBody>
                <div dangerouslySetInnerHTML={{ __html: this.state.failure.solution }} />
              </CardBody>
            </Card>
        
        </>
      )
         
    }
}
