import { classes } from 'common/react';
import { Fragment, Component, createRef } from 'inferno';
import { useBackend, useSharedState, useLocalState, backendSetSharedState } from '../backend';
import { Button, Section, Box, Flex, Icon } from '../components';
import { Window } from '../layouts';
import { createLogger, logger } from '../logging';

// all these magic numbers have to coordinate to
// properly scale the 3270 font
// eslint-disable max-len
const magic = {
  cxFactor: 9.65625,
  cyFactor: 21,
  nominalFontSize: 18,
  paddingBottom: 8,
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 8,
};


const Color = {
  NEUTRAL: 0x00,
  BLUE: 0xF1,
  RED: 0xF2,
  PINK: 0xF3,
  GREEN: 0xF4,
  TURQUOISE: 0xF5,
  YELLOW: 0xF6,
  WHITE: 0xF7,
};

const Command = {
  EAU: 0x6F,
  EW: 0xF5,
  EWA: 0x7E,
  W: 0xF1,
  WSF: 0xF3,
};

const Highlight = {
  BLINK: 0xF1,
  REVERSE: 0xF2,
  UNDERSCORE: 0xF4,
};

const Op = {
  Q: 0x02,
  QL: 0x03,
  RB: 0xF2,
  RM: 0xF6,
  RMA: 0x6E,
  UNKNOWN: 0xFF,
};

const Order = {
  SF: 0x1D,
  SFE: 0x29,
  SBA: 0x11,
  SA: 0x28,
  MF: 0x2C,
  IC: 0x13,
  PT: 0x05,
  RA: 0x3C,
  EUA: 0x12,
  GE: 0x08,
};

const QCode = {
  ALPHANUMERIC_PARTITIONS: 0x84,
  CHARACTER_SETS: 0x85,
  COLOR: 0x86,
  DDM: 0x95,
  HIGHLIGHTING: 0x87,
  IMPLICIT_PARTITION: 0xA6,
  REPLY_MODES: 0x88,
  RPQ_NAMES: 0xA1,
  SUMMARY: 0x80,
  USABLE_AREA: 0x81,
};

const TypeCode = {
  BASIC: 0xC0,
  HIGHLIGHT: 0x41,
  COLOR: 0x42,
};

const SFID = {
  QUERY_REPLY: 0x81,
  READ_PARTITION: 0x01,
};

const host_create = {
  'color': 'var(--lu3270-color)',
  'display': 'block',
  'font-family': '3270 Font',
  'font-size': '18px',
  'overflow': 'auto',
  'opacity': 1.0,
};


const DefaultTerminalStatus = {
  alarm: false,
  connected: false,
  cursorAt: 0,
  error: false,
  focused: false,
  keyboardLocked: false,
  message: '',
  waiting: false,
};

const UpdateTerminalPerfs = (term_index=null) => {
  const term_settings = [
    {
      model: 'IBM-3278-1-E',
      numCols: 80,
      numRows: 12,
    },
    {
      model: 'IBM-3278-1-E',
      numCols: 80,
      numRows: 24,
    },
    {
      model: 'IBM-3278-2-E',
      numCols: 80,
      numRows: 32,
    },
    {
      model: 'IBM-3278-4-E',
      numCols: 80,
      numRows: 43,
    },
    {
      model: 'IBM-3278-5-E',
      numCols: 132,
      numRows: 27,
    },
  ];
  const index = parseInt(term_index, 10);
  return term_settings[index];
};

const DefaultTerminalPerfs = {
  model: 'IBM-3278-4-E',
  numCols: 80,
  numRows: 43,
  color: 'green',
};

const mat_blue_400 = "#42a5f5";
const mat_blue_300 = "#64b5f6";
const mat_red_500 = "#f44336";
const mat_red_400 = "#ef5350";
const mat_pink_400 = "#ec407a";
const mat_pink_300 = "#f06292";
const mat_green_400 = "#66bb6a";
const mat_green_300 = "#81c784";
const mat_cyan_400 = "#26c6da";
const mat_cyan_300 = "#4dd0e1";
const mat_yellow_400= "#ffee58";
const mat_yellow_300= "#fff176";
const mat_grey_100 = "#f5f5f5";
const mat_grey_900 = "#212121";

const lu3270_color= "#f06292";
const lu3270_background = 'black';
const lu3270_highlight_color= "#66bb6a";

const CELL_NORMAL      = 0 ;
const CELL_BLINK      = (1 << 0);
const CELL_HIDDEN     = (1 << 1);
const CELL_HIGHLIGHT  = (1 << 2);
const CELL_UNDERLINE  = (1 << 3);
const CELL_REVERSE    = (1 << 4);
const CELL_NEUTRAL    = (0 << 5);
const CELL_BLUE       = (1 << 5);
const CELL_RED        = (2 << 5);
const CELL_PINK       = (3 << 5);
const CELL_GREEN      = (4 << 5);
const CELL_TURQUOISE  = (5 << 5);
const CELL_YELLOW     = (6 << 5);
const CELL_WHITE      = (7 << 5);
const CELL_COLOR_MASK = (7 << 5);


const createStyleFromByte = (attribute, cursorAt, focused) => {
  const style = { color: lu3270_color, 'background-color': lu3270_background , 'filter':'Alpha(opacity=0)'  };
  if (cursorAt) {
    if (attribute & CELL_HIDDEN) {
      style['background-color']  = lu3270_color;
      style.color = lu3270_color;
    }
    else if (focused) {
      style['background-color']  = lu3270_color;
      style.color = lu3270_background;
    }
    style.outline = '1px solid '+ lu3270_color;
    return style;
  }
  else if(attribute) {
    const highlight  = attribute & CELL_HIGHLIGHT;
    if (highlight)  { style.fontWeight = '900'; }
    if (attribute & CELL_BLINK)  { style.animation = 'blink 1s linear infinite'; }
    if (attribute & CELL_UNDERLINE)  { style.textDecoration = 'underline'; }
    switch (attribute & CELL_COLOR_MASK) {
      case CELL_BLUE:
        style.color = highlight? mat_blue_400 : mat_blue_300;
        break;
      case CELL_RED:
        // NOTE: subjective compensation for relative low-intensity
        style.color = highlight? mat_red_500 : mat_red_400;
        break;
      case CELL_PINK:
        style.color = highlight? mat_pink_400 : mat_pink_300;
        break;
      case CELL_GREEN:
        style.color = highlight? mat_green_400 : mat_green_300;
        break;
      case CELL_TURQUOISE:
        style.color = highlight? mat_cyan_400 :mat_cyan_300;
        break;
      case CELL_YELLOW:
        style.color = highlight? mat_yellow_400: mat_yellow_300;
        break;
      case CELL_WHITE:
        style.color = highlight? 'white' : mat_grey_100;
        break;
      default:
        if (highlight)
        { style.color = lu3270_highlight_color; }
    }
    if(attribute & CELL_REVERSE) {
      const temp = style.color;
      style.color = style.backgroundColor;
      style.backgroundColor = temp;
    }
  }
  style["text-color"] = style.color;
  return style;
};
class Cell {
  constructor(value, attribute) {
    this.value = '\u00a0';
    this.attribute = 0;
    this.style = { flex: 'none', color: lu3270_color, backgroundColor: lu3270_background};
    this.modified = false;
    this.protect = false;
    this.numeric = false;
  }
  set_value(value) {
      if(value == " ")
        value = '\u00a0';
      if(this.value != value) {
        this.value = value || '\u00a0';
      }
  }
  set_attribute(attribute) {
    if(this.attribute != attribute) {
      this.attribute = attribute;
    }
  }
};




const Constants = {

  fontSizeThrottle: 250,
  setBoundsThrottle: 250,

  portMax: 65535,
  portMin: 23,

  // all these magic numbers have to coordinate to
  // properly scale the 3270 font

  magic: {
    cxFactor: 9.65625,
    cyFactor: 21,
    nominalFontSize: 18,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
  },

};

// / silly hack polyfill..stupid ie
if (!Math.trunc) {
  Math.trunc = function (v) {
    return v < 0 ? Math.ceil(v) : Math.floor(v);
  };
}
const Fill = (props, context) => {
  const {
    pos, // starting position, used for selecting
    length,
    attribute,
    ...rest
  } = props;

  const [
    cursorAt,
    setCursorAt
  ] = useSharedState(context,"status", { cursorAt: -1 });

  const text = "\xA0".fill(length);
  const style = createStyleFromByte(attribute, cursorAt===pos, false);
  return <span {...rest}>{text}</span>
}
const Label = (props, context) => {
  const {
    pos, // starting position, used for selecting
    value,
    attribute,
    ...rest
  } = props;

  const [
    cursorAt,
    setCursorAt
  ] = useSharedState(context,"status", { cursorAt: -1 });

  const style = createStyleFromByte(attribute, cursorAt===pos, false);
  return <span {...rest}>{value || "\xA0"}</span>
};
const Field = (props, context) => {
  const {
    name,
    value,
    length,
    ...rest
  } = props;
  const [
    fields,
    setFields
  ] = useSharedState(context, "field_cache", { });
  // kind of hacky, but these magic numbers DO work

  const style = createStyleFromByte(attribute, cursorAt===pos, false);
  return <input stype={style} onchange={ e=> setFields({ name: e.target.value })} {...rest}>{fields[name]}</input>
};

const CellDom = (props, context) => {
  const {
    pos,
    value,
    attribute,
    type = "text",
    onClick = e => { logger.log("Clicky " + pos + "color=" + style.color ); setCursorAt(pos); },

    const [
      perfs,
    ] = useSharedState(context,"perfs", { numCols: 80, numRows: 24});

    const [
      cursorAt,
      setCursorAt
    ] = useSharedState(context,"status", { cursorAt: -1 });

    const style = { flex: 'none', width: ((length**Constants.magic.cxFactor) + 'px') };

  return (
    <div id={'cell'+pos } style="{style}" onClick={e=> onClick(e)}>
      {
        value.type === "text" ?
          (<Label pos={pos} value={value.text} attribute={value.attribute} />) :
          value.type == "field" ?
          (<Field pos={pos} name={value.name}  attribute={value.attribute} length={value.length}/>) :
          (<Fill pos={pos} length={length} attribute={0} />)
      }
    </div>
  );
};


// Making a full component.  To many states and want to get somewhat
// better performance
class BlockTerminal extends Component {
  constructor(props, context) {
    super(props, context);

    const config_perfs = UpdateTerminalPerfs(1); // make this configurable some day
    // really not sure about this bit. 1920 refs?  Sure I just
    // need to change some styles but ugh


    // state configures.  Basicity commands used to update the screen
    // we can async a bunch of these if need be

const processCells = (cells, payload_list) => {
  logger.log("thie fuck " + payload_list);

  const propagateUnprotected = () => {
    let attributes = null;
    cells.forEach(cell => {
      if (cell.attribute)
      { attributes = cell.protect ? 0  : cell.attributes; }
      else if (!cell.value && attributes)
      { cell.attributes = attributes; }
    });
  };
  const clearCellValue = payload => {
    const cell = cells[payload.cellAt];
    if (cell.protect) {
      Object.assign(payload.state, { update : false, alarm: true, keyboardLocked: true, error: true, message: "PROT" });
    } else {
      cell.modified = false;
      cell.set_value(null);
      payload.updated = true;
    }
  };
  const eraseUnprotected =  payload => {
    cells.filter(cell => cell && !cell.protect)
      .filter((cell, i) => (i >= payload.from) && (i < payload.to))
      .forEach(cell => {
        cell.modified = false;
        cell.set_value(null);
        payload.updated = true;
      });
  };
  const eraseUnprotectedScreen =  payload => {
    cells
      .filter(cell => cell && !cell.protect)
      .forEach(cell => {
        cell.modified = false;
        cell.set_value(value);
        payload.updated = true;
      });
  };
  const replaceScreen =  payload => {
    payload.cells.forEach((cell, ix) => {
      cells[ix] = cell;
    });
    propagateUnprotected();
    payload.updated = true;
  };
  const resetMDT = payload => {
    cells.forEach(cell => {
      cell.modified = false;
    });
    payload.updated = true;
  };

  const updateCellAttribute =  payload=> {
    const cell = cells[payload.cellAt];
    cell.set_attribute(payload.attribute);
    payload.updated = true;
  };

  const updateCellValue = payload=> {
    const cell = cells[payload.cellAt];
    if (cell.protect) {
      Object.assign(payload.state, { alarm: true, keyboardLocked: true,
        error: true, message: "PROT" });
    } else {
      cell.modified = true;
      cell.set_value(payload.value);
      payload.updated = true;
      Object.assign(payload.state, { cursorAt: payload.cellAt + 1 });
    }
  };
  const updateScreen = payload => {
    payload.cells.forEach((cell, ix) => {
      if (cell)
      { cells[ix] = cell; }
    });
    propagateUnprotected();
    payload.updated = true;
  };
  const processes = {
    'updateScreen' : updateScreen,
    'updateCellValue': updateCellValue,
    'updateCellAttribute:': updateCellAttribute,
    'resetMDT': resetMDT,
    'replaceScreen': replaceScreen,
    'eraseUnprotectedScreen': eraseUnprotectedScreen,
    'eraseUnprotected': eraseUnprotected,
    'clearCellValue':clearCellValue,

  };
  let return_state = { updated: false , state : {} };
  payload_list.forEach(p => {
    switch(p.command) {
      case "text":
        return_state.cellAt= p.cursorAt;
        return_state.attribute = CELL_YELLOW;
        for (var i = 0; i <  p.value.length; i++) {
          return_state.value = p.value[i];
          updateCellValue(return_state);
          updateCellAttribute(return_state);
          return_state.cellAt = return_state.state.cursorAt;
        }
    }
  })
  return_state.cells  = cells;
  return return_state;
}


this.processCells =processCells;
    const generateInitalScreen = (width, height) => {
      let all_cells = [];
      for (let i=0; i < (width*height); i++) {
        let cell = new Cell();
        if (i<config_perfs.numCols)
        { cell.value = "0123456789"[i%10]; }
        else
        { cell.value = i % 10 ? null: "|"; }
        all_cells.push(cell);
      }
      return all_cells;
    };
    this.screen_ref = createRef();
    this.state = {
      fields: [],
      cells: generateInitalScreen(80, 24),
      alarm: false,
      connected: false,
      cursorAt: 0,
      error: false,
      focused: false,
      keyboardLocked: false,
      message: '',
      waiting: false,
      default_color: lu3270_color,
      default_highlight_color: lu3270_highlight_color,
      default_background_color: lu3270_background,
      style_cache: {},
      status: {
        alarm: false,
        connected: false,
        cursorAt: 0,
        error: false,
        focused: false,
        keyboardLocked: false,
        message: '',
        waiting: false,
      },
      perfs: config_perfs,
    };
  }
  /** Position the cursor based on a mouse click */
  cursorAt(cursorAt) {
    setState({ cursorAt: cursorAt });
  }
  createField(cells, address, name, attribute, length) {
    for(let i=address; i < (address+length); i++) {
      cells[i].set_value(null);
      cells[i].set_attribute(attribute);
      cells[i].protect = false;
    }
  }
  clearScreen(cells) {
    cells.forEach(cell => { cell.set_value(null); cell.set_attribute(0); cell.protect = true; })
  }
  componentDidMount() {

    const new_state = this.processCells(this.state.cells,
      [
        { "command": "text", "cursorAt": 80, "value": "Fuck me I am asian!" },
        { "command": "text", "cursorAt": 334, "value": "Fuck me I am asian!" },
        { "command": "text", "cursorAt": 1000, "value": "Fuck me I am asian!" },
      ]);

    if(new_state.updated)
      this.setState( new_state.state);

  }
  cursorTo(cursorAt, cursorOp) {
    // cursorAt: number,
    // cursorOp: 'down' | 'left' | 'right' | 'up'): number {
    const max = this.state.perfs.numCols * this.state.perfs.numRows;
    let cursorTo;
    switch (cursorOp) {
      case 'down':
        cursorTo = cursorAt + this.state.perfs.numCols;
        if (cursorTo >= max)
        { cursorTo = cursorAt % this.state.perfs.numCols; }
        break;
      case 'left':
        cursorTo = cursorAt - 1;
        if (cursorTo < 0)
        { cursorTo = max - 1; }
        break;
      case 'right':
        cursorTo = cursorAt + 1;
        if (cursorTo >= max)
        { cursorTo = 0; }
        break;
      case 'up':
        cursorTo = cursorAt - this.state.perfs.numCols;
        if (cursorTo < 0)
        { cursorTo = (cursorAt % this.state.perfs.numCols)
           + max - this.state.perfs.numCols; }
        break;
    }
    this.setState({ cursorTo: cursorTo });
    return cursorTo;
  }

  /** Reposition cursor, relative to its current position */
  tabTo(cursorAt, cells, tabOp) {
  //  cursorAt: number,
  //  cells: Cell[],
    // tabOp: 'bwd' | 'fwd'): void {
    const max = this.state.perfs.numCols * this.state.perfs.numRows;
    let dir = 1, tabTo = cursorAt;
    // if we're going backwards, and we're at the beginning of a field
    // we'll skip this field
    if (tabOp === 'bwd') {
      dir = -1;
      if ((cursorAt > 0) && cells[cursorAt - 1].attribute)
      { tabTo -= 1; }
    }
    // now look for the first unprotected field
    while (true) {
      tabTo += dir;
      if (tabTo === cursorAt)
      { break; }
      if (tabTo < 0)
      { tabTo = max - 1; }
      if (tabTo >= max)
      { tabTo = 1; }
      const cell = cells[tabTo - 1];
      if (cell && cell.attribute && !cell.attributes.protect)
      { break; }
    }
    if (tabTo !== cursorAt) {
      this.setState({ cursorTo: tabTo });
    }
  }
  onKeyPress(e) {
    logger.log("onKeyPress " + e.key);
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  onKeyUp(e) {
    logger.log("onKeyUp " + e.key);
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  onKeyDown(e) {
    logger.log("onKeyDown " + e.key);
    e.preventDefault();
    e.stopPropagation();
    const { cells, cursorAt } = this.state;
    const key = e.keyCode > 32 ? String.fromCharCode(e.keyCode) : null;
    const cell = cells[cursorAt];
    if(cell.protect) {
      this.setState({ alarm: true, keyboardLocked: true,
        error: true, message: "PROT" });
    } else {
      cell.set_value(key);
      this.setState({ cells: cells, cursorAt: cursorAt +1 });
    }
    return false;
  }
  onLoseFocus(e) {
    this.setState({ focused: false });
  }
  onFocus(e) {
    this.setState({ focused: true });
  }
  render() {
    const { status, cells, perfs } = this.state;
    //        cursor: status.keyboardLocked ? 'not-allowed' : 'default',
    /** Compute colimn from cursor */
    return (
      <Flex direction="column" height="100%" className="lu360_root">
        <Flex.Item grow={1}>
          <div class="lu3270"
          style={{
            width:((perfs.numCols+1)*Constants.magic.cxFactor) + 'px',

          }} >
            <div class="cells"
              onkeypress={this.onKeyPress.bind(this)}
              onkeydown={this.onKeyUp.bind(this)}
              onkeyup={this.onKeyDown.bind(this)}
              onblur={this.onLoseFocus.bind(this)}
              onfocus={this.onFocus.bind(this)}
              >
              {
              cells.map((cell, i) => <CellDom key={"cell_" + i} pos={i} attribute={cell.attribute} value={cell.value} />)
              }
            </div>
          </div>
        </Flex.Item>
        <Flex.Item shrink={0}>
          <TN3270_Status cells={cells} perfs={perfs} cursorAt={this.state.cursorAt} status={status} connected={true}/>
        </Flex.Item>

      </Flex>
    );
  }
}
const TN3270_Status = (props, context) => {
//       rotation={iconRotation}
// spin={iconSpin} />
  const [
    cursorAt,
  ] = useSharedState(context,"status", { cursorAt: -1 });

  const { status, cells, perfs ,connected } = props;
  const current_cell = cells[cursorAt] || null;
  return (
    <Flex width="100%" inline={1} direction="row" className="lu3270-status-bar" >
      <Flex.Item grow={1}>
        <span>
          <Icon name={connected ? "desktop" : "power-off"} />
          {connected && perfs?.model}

        </span>

      </Flex.Item>
      <Flex.Item grow={1} style={{ visibility: status.waiting ? 'visible' : 'hidden' }}>
        <Icon name="spinner" />
        WAIT
      </Flex.Item>
      <Flex.Item grow={1} style={{ color: "var(--error-color)",
        visibility: status.error ? 'visible' : 'hidden' }}>
        <Icon name="times" />
        {status?.message}
      </Flex.Item>
      <Flex.Item grow={1}>&nbsp;</Flex.Item>
      <Flex.Item grow={1} style={{ visibility: (connected && current_cell && current_cell.numeric) ? 'visible' : 'hidden' }}>
        NUM
      </Flex.Item>
      <Flex.Item grow={1} style={{ visibility:
        (connected && current_cell && current_cell.protect) ? 'visible' : 'hidden' }}>
        PROT
      </Flex.Item>
      <Flex.Item grow={1} style={{ visibility: (connected && (status.cursorAt >= 0))? 'visible' : 'hidden' }}>
        {(Math.trunc(cursorAt / perfs.numCols) + 1) +"/" + ((cursorAt % perfs.numCols) + 1)}
      </Flex.Item>
    </Flex>
  );
};

export const TN3270 = (props, context) => {
  const { act, data } = useBackend(context);
  const {
    commands,
  } = data;
  return (
    <Window
      width={800}
      height={700}>
      <Window.Content>
          <BlockTerminal />
      </Window.Content>
    </Window>
  );
};


