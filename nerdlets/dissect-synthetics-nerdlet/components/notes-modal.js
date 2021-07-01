import React from 'react';
import {
    Modal,
    HeadingText,
    BlockText,
    Button
  } from 'nr1';
// https://docs.newrelic.com/docs/new-relic-programmable-platform-introduction

export default class NotesModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          hideModal: true,
        }
      }
    
   
    
    render() {
      
      return (
          <>
            <Modal hidden={this.props.hidden} onClose={this.props.onClose}>
                <HeadingText type={HeadingText.TYPE.HEADING_1}>Notes</HeadingText>

                <BlockText type={BlockText.TYPE.PARAGRAPH}>
                    Save notes relevnt to this error on this site for future reference. 
                </BlockText>

                <Button onClick={this.props.onClose}>Close</Button>
            </Modal>
        
        </>
      )
         
    }
}
