import { useBackend } from '../backend';
import { NoticeBox, Section, XTerm } from '../components';

import { Window } from '../layouts';
// mport { useRef, useState } from 'react';
// import { XTerm } from '../components';
import { createLogger } from '../logging';
//  import { Dialog, UnsavedChangesDialog } from '../components/Dialog';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  ITerminalAddon,
  ITerminalInitOnlyOptions,
  ITerminalOptions,
  // Terminal,
} from 'xterm';

type Data = {
  uppertext: string;
  messages: { key: string }[];
  tguitheme: string;
};

const logger = createLogger('ConsoleLog');

const TEXTAREA_UPDATE_TRIGGERS = [
  'click',
  'input',
  'paste',
  'cut',
  'mousemove',
  'select',
  'selectstart',
  'keydown',
];

const vt52KeyMap = [
  [12, '?u'], // Numpad 5 ESC ? u
  [33, '?l'], // Numpad + ESC ? l
  [33, '?y'], // Numpad 9 ESC ? y What about dups?
  [34, '?s'], // Numpad 3 ESC ? s
  [35, '?q'], // Numpad 1 ESC ? q
  [36, '?w'], // Numpad 7 ESC ? w
  [37, '?t'], // Numpad 4 ESC ? t
  [37, 'D'], // Left arrow  ESC D
  [38, '?x'], // Numpad 8 ESC ? x
  [38, 'A'], // Up arrow  ESC A
  [39, '?v'], // Numpad 6 ESC ? v
  [39, 'C'], // Right arrow ESC C
  [40, '?r'], // Numpad 2 ESC ? r
  [40, 'B'], // Down arrow  ESC B
  [45, '?p'], // Numpad 0 ESC ? p
  [96, '?p'], // Numpad 0 ESC ? p
  [97, '?q'], // Numpad 1 ESC ? q
  [98, '?r'], // Numpad 2 ESC ? r
  [99, '?s'], // Numpad 3 ESC ? s
  [100, '?t'], // Numpad 4    ESC ? t
  [101, '?u'], // Numpad 5    ESC ? u
  [102, '?v'], // Numpad 6    ESC ? v
  [103, '?w'], // Numpad 7    ESC ? w
  [104, '?x'], // Numpad 8    ESC ? x
  [105, '?y'], // Numpad 9    ESC ? y
  [106, 'R'], // Numpad * (PF3)  ESC R
  [107, '?l'], // Numpad +    ESC ? l
  [111, 'Q'], // Numpad / (PF2)  ESC Q
  [111, 'S'], // Numpad - (PF4)  ESC S
  [144, 'P'], // Num Lock (PF1)  ESC P
];

interface CpuDevice {
  sendByte(ch: number): boolean;
  recvByte(): { valid: boolean; ch: number };
  recvData(): Array<number>;
  sendData(data: Array<number>);
}

interface V52Props {
  cols: number;
  rows: number;
  graphics: number;
  escape: number;
  keypad: number;
  mode: number;
  col: number;
  row: number;
  typeAhead: string;
  readRoutine: Function;
  screen: Array<string>;
  maintainFocus: boolean;
  stream: CpuDevice;
}

type ConsoleData = {
  note: string;
};
type RetryActionType = (retrying?: boolean) => void;

//const CpuConsole = (props) => {
//const { act, data, config } = useBackend<ConsoleData>();

//console.log(note);
//const [text, setText] = useLocalState<string>('text', note);

export const Terminal = () => {
  const xtermRef = useRef<XTerm>(null);
  //const xtermRef = createRef<typeof XTermTerminal>();
  const [input, setInput] = useState('');
  //const webgladdon = useRef(new WebglAddon());

  //webgladdon.current.onContextLoss(e => {
  //	webgladdon.current.dispose();
  //});

  return (
    <XTerm
      ref={xtermRef}
      //addons={[webgladdon.current]}
      options={{ cursorBlink: true, rows: 24, cols: 80 }}
      onData={(data: string) => {
        const code = data.charCodeAt(0);
        // If the user hits empty and there is something typed echo it.
        if (code === 13 && input.length > 0) {
          if (xtermRef?.current)
            xtermRef.current.write(/"\r\nYou typed: '" + input + "'\r\n"/);
          if (xtermRef?.current) xtermRef.current.write('echo> ');
          setInput('');
        } else if (code < 32 || code === 127) {
          // Disable control Keys such as arrow keys
          return;
        } else {
          // Add general key press characters to the terminal
          if (xtermRef?.current) xtermRef.current.write(data);
          setInput(input + data);
        }
      }}
    />
  );
};
