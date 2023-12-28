import { useBackend } from '../backend';
import { NoticeBox, Section } from '../components';
import { Window } from '../layouts';

import { Component, createRef, RefObject } from 'inferno';
import { createLogger } from '../logging';
//  import { Dialog, UnsavedChangesDialog } from '../components/Dialog';

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
  [12, "?u"], // Numpad 5 ESC ? u
  [33, "?l"], // Numpad + ESC ? l
  [33, "?y"], // Numpad 9 ESC ? y What about dups?
  [34, "?s"], // Numpad 3 ESC ? s
  [35, "?q"], // Numpad 1 ESC ? q
  [36, "?w"], // Numpad 7 ESC ? w
  [37, "?t"], // Numpad 4 ESC ? t
  [37, "D"], // Left arrow  ESC D
  [38, "?x"], // Numpad 8 ESC ? x
  [38, "A"], // Up arrow  ESC A
  [39, "?v"], // Numpad 6 ESC ? v
  [39, "C"], // Right arrow ESC C
  [40, "?r"], // Numpad 2 ESC ? r
  [40, "B"], // Down arrow  ESC B
  [45, "?p"], // Numpad 0 ESC ? p
  [96, "?p"], // Numpad 0 ESC ? p
  [97, "?q"], // Numpad 1 ESC ? q
  [98, "?r"], // Numpad 2 ESC ? r
  [99, "?s"], // Numpad 3 ESC ? s
  [100, "?t"], // Numpad 4    ESC ? t
  [101, "?u"], // Numpad 5    ESC ? u
  [102, "?v"], // Numpad 6    ESC ? v
  [103, "?w"], // Numpad 7    ESC ? w
  [104, "?x"], // Numpad 8    ESC ? x
  [105, "?y"], // Numpad 9    ESC ? y
  [106, "R"], // Numpad * (PF3)  ESC R
  [107, "?l"], // Numpad +    ESC ? l
  [111, "Q"], // Numpad / (PF2)  ESC Q
  [111, "S"], // Numpad - (PF4)  ESC S
  [144, "P"], // Num Lock (PF1)  ESC P
];

interface CpuDevice {
  sendByte(ch: number) : boolean;
  recvByte() : { valid : boolean, ch: number };
  recvData() : Array<number>;
  sendData(data: Array<number>);
}

interface V52Props  {
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

class VT52Console extends Component<V52Props> {
  innerRef: RefObject<HTMLTextAreaElement>;

  constructor(props:V52Props) {
    super(props);
    this.innerRef = createRef();
    const ss = this.props.stream;
    if(ss) {
      setTimeout(function(ss) {
          const a = ss.recvByte();
          if(a && a.valid) {
              this.putChar(a.ch);
          }
      },5)
    }

  }

  putChar(ch: number) {
    const textarea = this.innerRef.current as HTMLTextAreaElement;
    let vt52 = this.props;

    switch (vt52.escape) {
        case 0: // No escape sequence in progress
            switch (vt52.mode) {
                case 0: // Hardcopy Mode - Normal scolling (don't care about VT52 things)
                    switch (ch) {
                        case 8: // 010 BS
                        textarea.value = textarea.value.substring(0, textarea.value.length - 1);
                            break;
                        case 9: // 011 TAB
                        textarea.value += '\t';
                            break;
                        case 10: // 012 LF
                        textarea.value += '\n';
                        textarea.scrollTop = textarea.scrollHeight;
                            break;
                        case 13: // 015 CR
                            if (textarea.value.length > 19000) {
                              textarea.value = textarea.value.substring(textarea.value.length - 16000);
                            }
                            break;
                        case 27: // 033 ESC
                            vt52.escape = 1; // Next char will be part of escape sequence
                            break;
                        default:
                            if (ch >= 32 && ch <= 126) { // If printable add it to the canvas
                              textarea.value += String.fromCharCode(ch);
                            }
                    }
                    break;
                case 1: // VT52 Mode - Escape sequence has triggered VT52 processing
                    switch (ch) {
                        case 8: // 010 BS - move left, no erasure
                            if (vt52.col) vt52.col--;
                            this.paintVT52(0, 0);
                            break;
                        case 9: // 011 TAB - move to next TAB stop
                            if (vt52.col < 79) {
                                if (vt52.col < 72) {
                                    vt52.col = (~~(vt52.col / 8) + 1) * 8;
                                } else {
                                    vt52.col++;
                                }
                            }
                            this.paintVT52( 0, 0);
                            break;
                        case 10: // 012 LF - row increases unless at end - then scroll
                            if (vt52.row < 23) {
                                vt52.row++;
                                this.paintVT52( 0, 0);
                            } else {
                              textarea.value += '\n';
                              textarea.scrollTop = textarea.scrollHeight;
                              vt52.mode = 0; // Drop out of VT52 mode if scrolling at bottom line
                            }
                            break;
                        case 13: // 015 CR - move to start of current row
                            vt52.col = 0;
                            this.paintVT52( 0, 0);
                            break;
                        case 27: // 033 ESC
                            vt52.escape = 1; // Next char will be part of escape sequence
                            break;
                        default: // Paint character at current location
                            if (ch >= 32 && ch <= 126) { // If printable put it on the screen
                              this.paintVT52( 0, ch);
                            }
                    }
                    break;
            }
            break;
        case 1: // Escape received - expecting to receive rest of VT52 escape sequence
            vt52.escape = 0; // Nearly all escape sequences end here so assume done
            switch (String.fromCharCode(ch)) {
                case '=': // Enter alternate keypad mode
                    vt52.keypad = 1;
                    break;
                case '>': // Exit alternate keypad mode
                    vt52.keypad = 0;
                    break;
                case 'F': // Use special graphics character set
                    vt52.graphics = 1;
                    break;
                case 'G': // Use normal US/UK character set
                    vt52.graphics = 0;
                    break;
                case 'A': // Move cursor up one line
                    if (vt52.row) vt52.row--;
                    this.paintVT52( 0, 0);
                    break;
                case 'B': // Move cursor down one line
                    if (vt52.row < 23) vt52.row++;
                    this.paintVT52( 0, 0);
                    break;
                case 'C': // Move cursor right one char
                    if (vt52.col < 79) vt52.col++;
                    this.paintVT52( 0, 0);
                    break;
                case 'D': // Move cursor left one char
                    if (vt52.col) vt52.col--;
                    this.paintVT52( 0, 0);
                    break;
                case 'H': // Move cursor to upper left corner
                    vt52.col = 0;
                    vt52.row = 0;
                    this.paintVT52( 0, 0);
                    break;
                case 'I': // Generate a reverse line-feed
                    this.paintVT52( -1, 0);
                    break;
                case 'J': // Erase to end of screen
                    this.paintVT52( 2, 0);
                    break;
                case 'K': // Erase to end of current line
                    this.paintVT52( 1, 0);
                    break;
                case 'Y': // Part I - Move cursor to r,c location
                    vt52.escape = 2; // This sequence has more characters
                    break;
                case 'Z': // Identify what the terminal is: ESC / K (VT52)
                    this.inputVT52( String.fromCharCode(27) + "/K");
                    break;
            }
            break;
        case 2: // Escape + 1 received:- Process character 3 (of Move cursor to r,c location)
            if (ch >= 32 && ch < 32 + 24) {
                vt52.escape = 3;
                vt52.row = ch - 32;
            } else {
                vt52.escape = 0;
            }
            break;
        case 3: // Escape + 2 received:- Process character 4 (of Move cursor to r,c location)
            if (ch >= 32 && ch < 32 + 80) {
                vt52.col = ch - 32;
                this.paintVT52( 0, 0);
            }
            vt52.escape = 0;
            break;
    }
  }

  remapKeysVT52(code: number, event: KeyboardEvent) {
    if(this.props.keypad) {
        for (let i = 0; i < vt52KeyMap.length; i++) {
            if (code == vt52KeyMap[i][0]) {
                this.inputVT52( String.fromCharCode(27) + vt52KeyMap[i][1]);
                return false; // Replace key with our version
            }
            if (code < vt52KeyMap[i][0]) {
                break;
            }
        }
        if (code == 13 && event.location === 3) {
          this.inputVT52( String.fromCharCode(27) + "?M");
            return false; // Replace key with our version
        }
    }
    return true; // Process as typed
  }

  keydownEventVT52(event : KeyboardEvent){
    var code = event.charCode || event.keyCode;
    if (event.ctrlKey && code > 64 && code < 96) {
      this.inputVT52( String.fromCharCode(event.keyCode - 64));
    } else {
        if (event.code == "Escape") {
          this.inputVT52( String.fromCharCode(27));
        } else {
            if (event.code == "Tab") {
              this.inputVT52( String.fromCharCode(9));
            } else {
                if (code == 8 || code == 127) {
                  this.inputVT52( String.fromCharCode(127));
                } else {
                    return  this.remapKeysVT52( code, event);
                }
            }
        }
    }
    return false;
  }

  keypressEventVT52(event : KeyboardEvent){
    // wait if its deprecated what do you use?  is code worked in ie11?
    // looks like they are string represtations
    let code = event.charCode || event.keyCode; // || event.key ;

    this.inputVT52( String.fromCharCode(code));
    return false;
  }

  keypasteEvent(event : ClipboardEvent){
    var cb = event.clipboardData?.getData('text/plain');
    if (cb && cb.length > 0) {
        this.inputVT52(cb);
    }
    return false;
  }

  inputVT52(text: string) {
    const elementId = this.innerRef.current as HTMLTextAreaElement;
    let vt52 = this.props;

      if (text.length > 0) {
          if (text.charCodeAt(0) == 3) {
              vt52.typeAhead = text; // Kill type ahead if user types ^C
          } else {
              vt52.typeAhead += text;
          }
          elementId.focus();
      }
      if (vt52.typeAhead.length > 0) { // Try to give data to read routine
          if (vt52.readRoutine( vt52.typeAhead.charCodeAt(0))) {
              vt52.typeAhead = vt52.typeAhead.substring(1); // Remove character if it was accepted
          }
          if (vt52.typeAhead.length > 0) { // If still data in buffer come back again
              setTimeout(this.inputVT52.bind(this), 5,  "");
          }
      }
  }

  paintVT52(remove: number, ch: number) {
    const textarea = this.innerRef?.current;
    const area = this.innerRef.current as HTMLTextAreaElement;
    const { col, row } = this.props;
    let props = this.props;  // Not sure this works with var?
    let screenUpdates = 0;

    if (!props.mode) { // If not in VT52 mode take existing textarea and format into screen array
      props.screen = area.value.split('\n');
      if (props.screen.length > 24) { // throw away off screen lines
        props.screen.splice(0, props.screen.length - 24);
      }
      for (let i = 0; i < props.screen.length; i++) { // clobber long lines
          if (props.screen[i].length > 80) {
            props.screen[i] = props.screen[i].substr(0, 79);
          }
      }
      for (let i = props.screen.length; i < 24; i++) { // extend short screen
        props.screen[i] = "";
      }
      screenUpdates++;
      props.mode = 1;
    }
    if (remove < 0) { // For reverse line feed scroll the screen down
        for (let i = 23; i >= 1; i--) {
          props.screen[i] = props.screen[i - 1];
        }
        props.screen[0] = "";
        screenUpdates++;
    }
    if (remove > 0) { // Clear rest of line - and optionally rest of screen
      props.screen[row] = props.screen[row].substr(0, col);
        if ((remove & 2) != 0) {
            for (let i = row + 1; i < 24; i++) {
              props.screen[i] = "";
            }
        }
      screenUpdates++;
    }
    if (props.screen[row].length < col) { // Ensure current line is long enough to position cursor
      props.screen[row] += " ".repeat(col - props.screen[row].length);
        screenUpdates++;
    }

    if (ch) { // Put character in current line
        if (props.graphics) {
            if (ch == 97) { // This version subsets ONE graphics character. If this catches on more may be required.
                ch = 182;
            }
        }
        props.screen[row] = props.screen[row].substr(0, col) + String.fromCharCode(ch) + props.screen[row].substr(col + 1);
        if (props.col < 79) props.col++;
        screenUpdates++;
    }
    if (screenUpdates) { // If screen changed then update it
      area.value = props.screen.join('\n');
    }

    let textPosition = props.col; // Determine cursor position
    for (let i = 0; i < props.row; i++) {
        textPosition += props.screen[i].length + 1;
    }
    setTimeout(function() {
      area.setSelectionRange(textPosition, textPosition);
    }, 0);
  }


  handleEvent(event: Event) {
  }

  reset() {
    this.props.escape = 0;
    this.props.mode = 0;
    this.props.typeAhead = '';
  }

  onblur() {
    if (!this.innerRef.current) {
      return;
    }

    if (this.props.maintainFocus) {
      this.innerRef.current.focus();
      return false;
    }

    return true;
  }

  // eslint-disable-next-line react/no-deprecated
  componentDidMount() {
    const textarea = this.innerRef?.current;
    if (!textarea) {
      logger.error(
        'ConoleTextArea.render(): Textarea RefObject should not be null'
      );
      return;
    }
    textarea.cols = this.props.cols;
    textarea.rows = this.props.rows;

    // Javascript – execute when textarea caret is moved
    // https://stackoverflow.com/a/53999418/5613731

    TEXTAREA_UPDATE_TRIGGERS.forEach((trigger) =>
      textarea.addEventListener(trigger, this)
    );

    // Slight hack: Keep selection when textarea loses focus so menubar actions can be used (i.e. cut, delete)
    textarea.onblur = this.onblur.bind(this);
    textarea.onkeydown = this.onblur.bind(this);
    textarea.onkeypress = this.keypressEventVT52.bind(this);
    textarea.onpaste = this.keypasteEvent.bind(this);
  }
  onKey(e: Event, v: string) {

  }
  componentWillUnmount() {
    const textarea = this.innerRef?.current;
    if (!textarea) {
      logger.error(
        'ConoleTextArea.componentWillUnmount(): Textarea RefObject should not be null'
      );
      return;
    }
    TEXTAREA_UPDATE_TRIGGERS.forEach((trigger) =>
      textarea.removeEventListener(trigger, this)
    );
  }

  render() {
    const { screen,  } = this.props;
    const text = screen.join('\n');

    return (
      <TextArea
        innerRef={this.innerRef}
        onInput={(_, value) => sendKey(value)}
        className={'NtosNotepad__textarea'}
        scroll
       // nowrap={!wordWrap}
        value={text}
      />
    );
  }
}

type ConsoleData = {
  note: string;
};
type RetryActionType = (retrying?: boolean) => void;

export const CpuConsole = (props) => {
  const { act, data, config } = useBackend<ConsoleData>();
  const { term } = data;

  //console.log(note);
  const [text, setText] = useLocalState<string>('text', note);

export const CpuConsole = (props) => {
  const { data } = useBackend<Data>();
  const { messages = [], uppertext } = data;

  return (
    <Window theme={data.tguitheme} title="Terminal" width={480} height={520}>
      <Window.Content scrollable>
        <NoticeBox textAlign="left">{uppertext}</NoticeBox>
        <Section fill>
            <VT52Console
              cols=132
              rows=24
              style="font-family:'Courier New',Courier,'Lucida Console',Monaco,monospace;"
              autocomplete="off"
              autocorrect="off"
              text=""
              setText={setText}
            />
        </Section>
      {/*
        {messages.map((message) => {
          return (
            <Box
              key={message.key}
              dangerouslySetInnerHTML={{ __html: message }}
            />
          );

        })}
      */}
      </Window.Content>
    </Window>
  );
};
