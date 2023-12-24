// import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Terminal } from 'xterm';
// import 'xterm/css/xterm.css';
import { Component, createRef } from 'inferno';
import { createLogger } from '../logging';
const logger = createLogger('XTerm');

class XTerm extends Component {
  /**
   * The ref for the containing element.
   */
  terminalRef;
  lastText;
  /**
   * XTerm.js Terminal object.
   */
  terminal; // This is assigned in the setupTerminal() which is called from the constructor

  constructor(props) {
    super(props);

    this.terminalRef = createRef();

    // Bind Methods
    //	this.onData = this.onData.bind(this);
    //  this.onCursorMove = this.onCursorMove.bind(this);
    //  this.onKey = this.onKey.bind(this);
    //  this.onBinary = this.onBinary.bind(this);
    //  this.onLineFeed = this.onLineFeed.bind(this);
    //  this.onScroll = this.onScroll.bind(this);
    //	this.onSelectionChange = this.onSelectionChange.bind(this);
    //	this.onRender = this.onRender.bind(this);
    //	this.onResize = this.onResize.bind(this);
    //	this.onTitleChange = this.onTitleChange.bind(this);

    // Setup the XTerm terminal.
    this.terminal = new Terminal(props.options);

    // Load addons if the prop exists.
    if (props.addons) {
      props.addons.forEach((addon) => {
        this.terminal.loadAddon(addon);
      });
    }

    // Create Listeners
    this.terminal.onBinary(this.onBinary.bind(this));
    this.terminal.onCursorMove(this.onCursorMove.bind(this));
    this.terminal.onData(this.onData.bind(this));
    this.terminal.onKey(this.onKey.bind(this));
    this.terminal.onLineFeed(this.onLineFeed.bind(this));
    this.terminal.onScroll(this.onScroll.bind(this));
    this.terminal.onSelectionChange(this.onSelectionChange.bind(this));
    this.terminal.onRender(this.onRender.bind(this));
    this.terminal.onResize(this.onResize.bind(this));
    this.terminal.onTitleChange(this.onTitleChange.bind(this));

    // Add Custom Key Event Handler
    if (props.customKeyEventHandler) {
      this.terminal.attachCustomKeyEventHandler(props.customKeyEventHandler);
    }

    // this.terminalRef.current.write = (data: string) => { this.terminal.write(data); };

    if (props.text) {
      this.terminal.write(props.text);
    }
  }

  componentDidMount() {
    logger.log('componentDidMount');
    if (this.terminalRef.current) {
      logger.log('Terminal opened');
      // Creates the terminal within the container element.
      this.terminal.open(this.terminalRef.current);
    }
  }

  componentWillUnmount() {
    // When the component unmounts dispose of the terminal and all of its listeners.
    this.terminal.dispose();
  }

  onBinary(data) {
    if (this.props.onBinary) this.props.onBinary(data);
  }

  onCursorMove() {
    if (this.props.onCursorMove) this.props.onCursorMove();
  }

  onData(data) {
    if (this.props.onData) this.props.onData(data);
  }

  onKey(event) {
    if (this.props.onKey) this.props.onKey(event);
  }

  onLineFeed() {
    if (this.props.onLineFeed) this.props.onLineFeed();
  }

  onScroll(newPosition) {
    if (this.props.onScroll) this.props.onScroll(newPosition);
  }

  onSelectionChange() {
    if (this.props.onSelectionChange) this.props.onSelectionChange();
  }

  onRender(event) {
    if (this.props.onRender) this.props.onRender(event);
  }

  onResize(event) {
    if (this.props.onResize) this.props.onResize(event);
  }

  onTitleChange(newTitle) {
    if (this.props.onTitleChange) this.props.onTitleChange(newTitle);
  }

  render() {
    return <div id="xterm323" ref={this.terminalRef} />;
  }
}
