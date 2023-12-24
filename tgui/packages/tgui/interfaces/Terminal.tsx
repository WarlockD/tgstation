import { Window } from '../layouts';
import { createLogger } from '../logging';
import { Section } from '../components';
import { createRef, forwardRef } from 'inferno';
import XTTERM from 'xterm';
//  import { Dialog, UnsavedChangesDialog } from '../components/Dialog';
// import 'xterm/css/xterm.css';
// import { Component, createRef, RefObject } from 'inferno';

const test_props = {
  // }: ITerminalOptions && ITerminalInitOnlyOptions= {
  cols: 80,
  rows: 24,
};

import { useLocalState } from '../backend';
type ITerminal = {
  uppertext: string;
  messages: { key: string }[];
  tguitheme: string;
};
type XTermProps = {
  // ui_static_data
  terminal?: XTTERM.Terminal;
};
const logger = createLogger('TXTerm');

const XTermContainer = forwardRef((props, ref) => (
  <div id="xtermdisplay" ref={ref} />
));
const options = {
  cols: 80,
  rows: 24,
};
export const Terminal = (props: ITerminal) => {
  const xtermref = createRef();
  const [terminal123, setTerminal123] = useLocalState(
    'termina123',
    new XTTERM.Terminal(options)
  );

  logger.debug('Terminal updated');
  terminal123.open(document.getElementById('terminal'));
  // const xtermRef = createRef();
  /*
  const onEchoTest = (data: string) => {
    const code = data.charCodeAt(0);
    // If the user hits empty and there is something typed echo it.
    if (code === 13 && input.length > 0) {
      if (xtermRef?.current) {
        xtermRef.current.write("\r\nYou typed: '" + input + "'\r\n");
      }
      if (xtermRef?.current) {
        xtermRef.current.write('echo> ');
      }
      setInput('');
    } else if (code < 32 || code === 127) {
      // Disable control Keys such as arrow keys
      return;
    } else {
      // Add general key press characters to the terminal
      if (xtermRef?.current) {
        xtermRef.current.write(data);
      }
      setInput(input + data);
    }
  };
  */

  //       <XTerm options={options} />
  console.log('Start');
  return (
    <Window title="Terminal" width={640} height={640}>
      <Window.Content scrollable>
        <Section fill />
        <div id="terminal" />
      </Window.Content>
    </Window>
  );
};
