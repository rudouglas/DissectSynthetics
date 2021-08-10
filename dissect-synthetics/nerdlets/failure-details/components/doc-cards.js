import React from "react";
import { Card, CardBody, CardHeader } from "nr1";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";

hljs.registerLanguage("javascript", javascript);
export default class DocCards extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      failure: null,
    };
  }
  componentDidMount() {
    this.highlight();
  }

  componentDidUpdate() {
    this.highlight();
  }
  highlight = () => {
    document.querySelectorAll("code").forEach((block) => {
      hljs.highlightBlock(block);
    });
  };
  render() {
    const styleObj = {};
    const { problem, cause, solution } = this.props.failure;
    let editedSolution = solution.replaceAll("/p><p", "/p><br /><p");
    editedSolution = editedSolution.replaceAll(
      "<code>",
      "<Highlight innerHTML={true}><code>"
    );
    editedSolution = editedSolution.replaceAll(
      "</code>",
      "</code></Highlight>"
    );
    let editedProblem = problem.replaceAll("/p><p", "/p><br /><p");
    let editedCause = cause.replaceAll("/p><p", "/p><br /><p");
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
    );
  }
}
