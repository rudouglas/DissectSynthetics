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
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';

hljs.registerLanguage('javascript', javascript);
import Highlight from 'react-highlight'
export default class DocCards extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        failure: null,
      }
    }
    componentDidMount() {
      this.highlight();
    }

    componentDidUpdate() {
      this.highlight();
    }
    highlight = () => {
      document.querySelectorAll("code").forEach(block => {
        hljs.highlightBlock(block);
      });
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
      const styleObj = {
      }
      const { problem, cause, solution } = this.props.failure;
      let editedSolution = solution.replaceAll('/p><p', '/p><br /><p')
      editedSolution = editedSolution.replaceAll('<code>', '<Highlight innerHTML={true}><code>')
      editedSolution = editedSolution.replaceAll('</code>', '</code></Highlight>')
      let editedProblem = problem.replaceAll('/p><p', '/p><br /><p')
      let editedCause = cause.replaceAll('/p><p', '/p><br /><p')
      console.log(this.props.failure.cause)
      console.log(this.props.failure.solution)
      return (
          <>
            <Card>
              <CardHeader title="Problem" />
              <CardBody>
                <div 
                  dangerouslySetInnerHTML={{ __html: editedProblem }} 
                  style={styleObj}
                />
              </CardBody>
            </Card>
            <Card className="causeCard">
              <CardHeader title="Cause" />
              <CardBody>
                <div 
                  dangerouslySetInnerHTML={{ __html: editedCause }} 
                  style={styleObj}
                />
              </CardBody>
            </Card>
            <Card className="solutionCard">
              <CardHeader title="Solution" />
              <CardBody>
                <div 
                  dangerouslySetInnerHTML={{ __html: editedSolution }} 
                  style={styleObj}
                />
              </CardBody>
            </Card>
        
        </>
      )
         
    }
}
