import { useLocalState } from '../backend';
import { NoticeBox } from '../components';
import { Window } from '../layouts';
import { createRef, RefObject } from 'inferno';
//  import { Dialog, UnsavedChangesDialog } from '../components/Dialog';

import XXTerm from 'xterm';
import { ITerminalOptions, ITerminalInitOnlyOptions } from 'xterm';
// import 'xterm/css/xterm.css';
// import { Component, createRef, RefObject } from 'inferno';

const test_props = {
  // }: ITerminalOptions && ITerminalInitOnlyOptions= {
  cols: 80,
  rows: 24,
};
interface IProps {
  className?: string;
  innerRef?: RefObject<HTMLElement>;
  options?: ITerminalOptions & ITerminalInitOnlyOptions;
}

const CXTerm = (props: IProps) => {
  const xtermRef = props.innerRef ?? createRef();
  const [input, setInput] = useLocalState('input', '');
  const [xterm, setXTerm] = useLocalState(
    'xterm',
    new XXTerm.Terminal(props.options)
  );
  console.log('Start');
  if (!xterm.element && xtermRef.current) {
    xterm.open(xtermRef.current);
  }

  return <div className={classes([props.className])} ref={xtermRef} />;
};

export const Terminal = (props) => {
  const [input, setInput] = useLocalState('input', '');
  const [xterm, setTerminal] = useLocalState(
    'xterm',
    new XXTerm.Terminal(test_props)
  );
  const xtermRef = createRef();

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
  const options = {
    cols: 80,
    rows: 24,
  };

  console.log('Start');
  return (
    <Window title="Terminal" width={640} height={640}>
      <Window.Content scrollable>
        <NoticeBox textAlign="left">{'Notice?'}</NoticeBox>
        <CXTerm
          options={options}
          innerRef={xtermRef}
          // onData=
        />
      </Window.Content>
    </Window>
  );
};
