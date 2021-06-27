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
import variableErrors from '../../static/errorDictionary';

export default class DocCards extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          failure: null,
        }
      }
    // componentWillMount() {
    //   console.log(`Error Messge ${this.props.error}`)
    //   const {error, failureDict} = this.props
    //   let failure = failureDict.filter(failure => failure.message === error)
      
    //   if (failure.length === 0) {
        
    //     let match;
    //     for (const err of variableErrors) {
          
    //       if (err.rLike.exec(error)) {
    //         match = err.rLike.exec(error)
    //         failure = failureDict.filter(failure => failure.message === err.message)
    //         break;
    //       }
    //     }
    //     console.log("tick",match)
    //   }
    //   this.setState({failure: failure[0]})
    // }

    
   
    
    render() {
      
      return (
          <>
            <Card>
              <CardHeader title="Problem" />
              <CardBody>
                <div dangerouslySetInnerHTML={{ __html: this.props.failure.problem }} />
              </CardBody>
            </Card>
            <Card className="causeCard">
              <CardHeader title="Cause" />
              <CardBody>
                <div dangerouslySetInnerHTML={{ __html: this.props.failure.cause }} />
              </CardBody>
            </Card>
            <Card className="solutionCard">
              <CardHeader title="Solution" />
              <CardBody>
                <div dangerouslySetInnerHTML={{ __html: this.props.failure.solution }} />
              </CardBody>
            </Card>
        
        </>
      )
         
    }
}
