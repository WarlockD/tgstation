import { Fragment,Component } from 'inferno';
import { useBackend, useSharedState, useLocalState, backendSetSharedState } from '../backend';
import { Button, Section, Box, Flex } from '../components';
import { Window } from '../layouts';
import { createLogger, logger } from '../logging';

// all these magic numbers have to coordinate to
// properly scale the 3270 font

const magic = {
  cxFactor: 9.65625,
  cyFactor: 21,
  nominalFontSize: 18,
  paddingBottom: 8,
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 8,
};

const config = {

  fontSizeThrottle : 250,
  setBoundsThrottle : 250,

  portMax : 65535,
  portMin : 23,

  // all these magic numbers have to coordinate to
  // properly scale the 3270 font

  magic : {
    cxFactor: 9.65625,
    cyFactor: 21,
    nominalFontSize: 18,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8
  }

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
  'opacity' : 1.0,
};


const DefaultTerminalStatus = {
  alarm: false,
  connected: false,
  cursorAt: 0,
  error: false,
  focused: false,
  keyboardLocked: false,
  message: '',
  waiting: false
};

const UpdateTerminalPerfs = (perfs, term_index=null) => {
  const term_names = ['IBM-3278-1-E','IBM-3278-2-E','IBM-3278-3-E','IBM-3278-4-E','IBM-3278-5-E'];
  const index = parseInt(term_index,10);
  if(index < term_names.length)
    perfs.model = term_names[index];
  switch (payload.model) {
    case 'IBM-3278-1-E':
     perfs.numCols = 80;
     perfs.numRows = 12;
      break;
    case 'IBM-3278-2-E':
      perfs.numCols = 80;
      perfs.numRows = 24;
      break;
    case 'IBM-3278-3-E':
      perfs.numCols = 80;
      perfs.numRows = 32;
      break;
    case 'IBM-3278-4-E':
      perfs.numCols = 80;
      perfs.numRows = 43;
      break;
    case 'IBM-3278-5-E':
      perfs.numCols = 132;
      numRows = 27;
      break;
  }
  return perfs;
};

const DefaultTerminalPerfs = {
  model: 'IBM-3278-4-E',
  numCols: 80,
  numRows: 43,
  color: 'green',
};
const lu3270_color= "#f06292";
const lu3270_background = 'black';
const lu3270_highlight_color= "#66bb6a";
const mat_blue_400  = "#42a5f5";
const mat_blue_300  = "#64b5f6";
const mat_red_500   = "#f44336";
const mat_red_400   = "#ef5350";
const mat_pink_400  = "#ec407a";
const mat_pink_300  = "#f06292";
const mat_green_400 = "#66bb6a";
const mat_green_300 = "#81c784";
const mat_cyan_400  = "#26c6da";
const mat_cyan_300  = "#4dd0e1";
const mat_yellow_400= "#ffee58";
const mat_yellow_300= "#fff176";
const mat_grey_100  = "#f5f5f5";
const mat_grey_900  = "#212121";

// Making a full component.  To many states and want to get somewhat
// better preformance
class BlockTerminal extends Component {
  constructor(props) {
    super(props);
    const {
      screen_width = 800,
      screen_height = 600,
    }  = props;

 // state configures.  Basicity commands used to update the screen
 // we can async a bunch of these if need be

 const propagateUnprotected = cells => {
  let attributes = null;
  cells.forEach(cell => {
    if (cell.attribute)
      attributes = cell.attributes.protect? null : cell.attributes;
    else if (!cell.value && attributes)
      cell.attributes = Attributes.from(attributes);
  });
};
 const clearCellValue = payload => {
    const cells = this.state.cells.spice(0);
    const cell = state.cells[payload.cellAt];
    if (cell.attribute || cell.attributes.protect) {
      this.setState({alarm: true, keyboardLocked: true,  error: true, message: "PROT" });
    } else {
      cell.attributes.modified = false;
      cell.value = null;
      this.setState({ cells: cells });
    }
  };
  this.clearCellValue = clearCellValue;
  const eraseUnprotected = payload => {
    const cells = this.state.cells.spice(0);
    let attributes;
    cells.filter(cell => {
      if(cell.attribute)
        attributes = cell.attributes;
      return true;
    })
    .filter(cell => cell && !(cell.attribute || cell.attributes.protect))
    .filter((cell,i) => (i >= payload.from) && (i < payload.to))
    .forEach(cell=> {
        cell.attributes = Attributes.from(attributes);
        cell.value = null;
    });
    this.setState({ cells: cells });
  };
  this.eraseUnprotected = eraseUnprotected;
  const eraseUnprotectedScreen = payload => {
    const cells = this.state.cells.spice(0);
    cells
    .filter(cell => cell && !(cell.attribute || cell.attributes.protect))
    .forEach(cell =>  {
      cell.attributes.modified = false;
      cell.value = null;
    });
    this.setState({ cells: cells });
  };
  this.eraseUnprotectedScreen = eraseUnprotectedScreen;
  const replaceScreen = payload => {
    const cells = this.state.cells.slice(0);
    payload.cells.forEach((cell, ix) => {
      cells[ix] = cell;
    });
    propagateUnprotected(cells);
    this.setState({ cells: cells });
  };
  this.replaceScreen = replaceScreen;
  const resetMDT = payload => {
    const cells = this.state.cells.slice(0);
    cells.forEach(cell =>  {
      cell.attributes.modified = false;
    });
    this.setState({ cells: cells });
  };
  this.resetMDT = resetMDT;
  const updateCellAttribute = payload => {
    const cells = this.state.cells.slice(0);
    const cell = cells[payload.cellAt];
    cell.attributes.modify(payload.typeCode, payload.attributes);
    this.setState({ cells: cells });
  };
  this.updateCellAttribute = updateCellAttribute;
  const updateCellValue = payload => {
    const cells = this.state.cells.slice(0);
    const cell = cells[payload.cursorAt];
    if (cell.attribute || cell.attributes.protect) {
      this.setState({alarm: true, keyboardLocked: true,  error: true, message: "PROT" });
    } else {
      cell.attributes.modified = true;
      cell.value = payload.value;
      this.setState({ cells: cells, cursorAt:  payload.cursorAt + 1 });
    }
  };
  this.updateCellValue = updateCellValue;
  const updateScreen = payload => {
    const cells = this.state.cells.slice(0);
    payload.cells.forEach((cell, ix) => {
      if (cell)
        cells[ix] = cell;
    });
    propagateUnprotected(cells);
    this.setState({ cells: cells });
  };
  this.updateScreen = updateScreen;
  const update_style = () => {
          // NOTE: these are magic numbers for the 3270 font based on a nominal
      // 18px size and a hack that forces the padding into the stylesheet
      //const cx = (this.state.prefs.numCols * config.magic.cxFactor) + config.magic.paddingLeft + config.magic.paddingRight;
     // const cy = (this.state.numRows * config.magic.cyFactor) + config.magic.paddingTop + config.magic.paddingBottom;
     const cx = (80 * config.magic.cxFactor) + config.magic.paddingLeft + config.magic.paddingRight;
     const cy = (43 * config.magic.cyFactor) + config.magic.paddingTop + config.magic.paddingBottom;
      //const scaleX = this.el.offsetWidth / cx;
     // const scaleY = this.el.offsetHeight / cy;
      const scaleX = screen_width / cx;
      const scaleY = screen_height / cy;
      const fontSize =  (scaleX < scaleY) ? ((config.magic.nominalFontSize * scaleY) + "px") : ((config.magic.nominalFontSize * scaleX) + "px")
      const new_style = {
        padding: config.magic.paddingTop + "px " + config.magic.paddingRight+ "px " + config.magic.paddingBottom + "px " + config.magic.paddingLeft + "px",
        fontSize: fontSize,
        'font-family': '3270 Font',
        'display':'flex',
        'flex-wrap':'wrap',
        width:(fontSize*80 +1)+ "px"
      //  'align-items': 'flex-end',

      };
  }
  this.refreshState = ()=> { this.setState( {style_cache: update_style() }); }
  const generateInitalScreen = (width, height) => {
    let allcells = [];
    for (let i=0; i < (width*height); i++) {
      let cell = new Cell();
      cell.value = "0123456789"[i%10];
      allcells.push(cell);
    }
    return allcells;
  };

  this.state = {
    perfs: {
      model: 'IBM-3278-4-E',
      numCols: 80,
      numRows: 43,
      color: 'green',
    },
    cells : generateInitalScreen(80, 43),
    alarm: false,
    connected: false,
    cursorAt: 0,
    error: false,
    focused: false,
    keyboardLocked: false,
    message: '',
    waiting: false,
    default_color : lu3270_color,
    deffault_hightlight_color: lu3270_highlight_color,
    default_background_color: lu3270_background,
    style_cache: update_style(),
  };
};
/** Position the cursor based on a mouse click */
cursorAt(cursorAt) {
  setState({ cursorAt: cursorAt});
}
/*
  shouldComponentUpdate(nextProps) {
    const {
      params: prevParams = {},
      ...prevRest
    } = this.props;
    const {
      params: nextParams = {},
      ...nextRest
    } = nextProps;
    return shallowDiffers(prevParams, nextParams)
      || shallowDiffers(prevRest, nextRest);
  }

  componentDidMount() {
    // IE8: It probably works, but fuck you anyway.
    if (Byond.IS_LTE_IE10) {
      return;
    }
    window.addEventListener('resize', this.handleResize);
    this.componentDidUpdate();
    this.handleResize();
  }

  componentDidUpdate() {
    // IE8: It probably works, but fuck you anyway.
    if (Byond.IS_LTE_IE10) {
      return;
    }
    const {
      params = {},
    } = this.props;
    const box = getBoundingBox(this.containerRef.current);
    logger.debug('bounding box', box);
    this.byondUiElement.render({
      parent: window.__windowId__,
      ...params,
      pos: box.pos[0] + ',' + box.pos[1],
      size: box.size[0] + 'x' + box.size[1],
    });
  }

  componentWillUnmount() {
    // IE8: It probably works, but fuck you anyway.
    if (Byond.IS_LTE_IE10) {
      return;
    }
    window.removeEventListener('resize', this.handleResize);
    this.byondUiElement.unmount();
  }
*/
  /** Reposition cursor, relative to its current position */
  cursorTo(cursorAt, cursorOp) {
      // cursorAt: number,
      // cursorOp: 'down' | 'left' | 'right' | 'up'): number {
      const max = this.state.perfs.numCols * this.state.perfs.numRows;
      let cursorTo;
      switch (cursorOp) {
        case 'down':
          cursorTo = cursorAt + this.state.perfs.numCols;
          if (cursorTo >= max)
            cursorTo = cursorAt % this.state.perfs.numCols;
        break;
        case 'left':
          cursorTo = cursorAt - 1;
          if (cursorTo < 0)
            cursorTo = max - 1;
        break;
        case 'right':
          cursorTo = cursorAt + 1;
          if (cursorTo >= max)
            cursorTo = 0;
        break;
        case 'up':
          cursorTo = cursorAt - this.state.perfs.numCols;
          if (cursorTo < 0)
            cursorTo = (cursorAt % this.state.perfs.numCols) + max - this.state.perfs.numCols;
        break;
      }
      this.setState({cursorTo:cursorTo });
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
        tabTo -= 1;
    }
    // now look for the first unprotected field
    while (true) {
      tabTo += dir;
      if (tabTo === cursorAt)
        break;
      if (tabTo < 0)
        tabTo = max - 1;
      if (tabTo >= max)
        tabTo = 1;
      const cell = cells[tabTo - 1];
      if (cell && cell.attribute && !cell.attributes.protect)
        break;
    }
    if (tabTo !== cursorAt)
      this.setState({cursorTo:tabTo });
  }

  render() {
    const { params, ...rest } = this.props;
    return (
      <Box class="lu3270" opacity={1.0}>
      <flex direction="rows " wrap style={this.state.style_cache}>
        { this.state.cells.map((cell, i) => (
          <Flex.Item inline key={i} id={'cell'+i} style={cell.toCSS(this.state.cursorAt, this.state.focused)}  onClick={e => {  logger.log("Clicky " + i); }}>
            {cell.value ? cell.value : '\u00a0'}
          </Flex.Item>))
        }
      </flex>
    </Box>
    );
  }
};



class Attributes {
  constructor(protect = false,
    numeric = false,
    highlight = false,
    hidden = false,
    modified = false,
    blink = false,
    reverse = false,
    underscore = false,
    color = Color.WHITE) {
    this.protect = protect;
    this.numeric = numeric;
    this.highlight = highlight;
    this.hidden = hidden;
    this.modified = modified;
    this.blink = blink;
    this.reverse = reverse;
    this.underscore = underscore;
    this.color = color;
  }

  /** Convert to CSS */
  modify(typeCode, another) {
    switch (typeCode) {
      case TypeCode.BASIC:
        this.protect = another.protect;
        this.numeric = another.numeric;
        this.highlight = another.highlight;
        this.hidden = another.hidden;
        this.modified = another.modified;
        break;
      case TypeCode.HIGHLIGHT:
        this.blink = another.blink;
        this.reverse = another.reverse;
        this.underscore = another.underscore;
        break;
      case TypeCode.COLOR:
        this.color = another.color;
        break;
    }
  }

  /** Convert basic attribute back to a byte */
  toByte() {
    let byte = 0b00000000;
    if (this.protect)
    { byte &= 0b00100000; }
    if (this.numeric)
    { byte &= 0b00010000; }
    if (this.highlight)
    { byte &= 0b00001000; }
    if (this.hidden)
    { byte &= 0b00001100; }
    if (this.modified)
    { byte &= 0b00000001; }
    return byte;
  }


  /** Convert to CSS */
  toCSS(cell, cursorAt, focused) {
    const style = { 'align-self': 'flex-start' ,'flex': '1 10px'};

    if (cursorAt) {
      if (this.hidden) {
        style.backgroundColor =lu3270_color;
        style.color = lu3270_color;
      }
      else if (focused) {
        style.backgroundColor = lu3270_color;
        style.color = lu3270_background;
      }
      style.outline = '1px solid '+ lu3270_color;
    }
    else if (this.hidden) {
      style.backgroundColor = lu3270_background;
      style.color = lu3270_background;
    }
    else if (!cell.attribute) {
      if (this.highlight)
      { style.fontWeight = '900'; }
      if (this.blink)
      { style.animation = 'blink 1s linear infinite'; }
      if (this.underscore)
      { style.textDecoration = 'underline'; }
      switch (this.color) {
        case Color.BLUE:
          style.color = style.highlight? mat_blue_400 : mat_blue_300;
          break;
        case Color.RED:
          // NOTE: subjective compensation for relative low-intensity
          style.color = style.highlight?  mat_red_500   : mat_red_400 ;
          break;
        case Color.PINK:
          style.color = style.highlight? mat_pink_400 : mat_pink_300 ;
          break;
        case Color.GREEN:
          style.color = style.highlight? mat_green_400 : mat_green_300;
          break;
        case Color.TURQUOISE:
          style.color = style.highlight? mat_cyan_400  :mat_cyan_300 ;
          break;
        case Color.YELLOW:
          style.color = style.highlight? mat_yellow_400: mat_yellow_300;
          break;
        case Color.WHITE:
          style.color = style.highlight? 'white' : mat_grey_100;
          break;
        default:
          if (style.highlight)
          { style.color = lu3270_highlight_color; }
      }
      if (cell.value && this.reverse) {
        style.backgroundColor = style.color? style.color : lu3270_color;
        style.color = mat_grey_900;
      }
    }
    return style;
  }

  /** String dump, for testing */
  toString() {
    return `ATTR=[${this.protect? 'PROT ' : ''}${this.numeric? 'NUM ' : ''}${this.highlight? 'HILITE ' : ''}${this.hidden? 'HIDDEN ' : ''}${this.modified? 'MDT ' : ''}${this.blink? 'BLINK ' : ''}${this.reverse? 'REV ' : ''}${this.underscore? 'USCORE ' : ''}${Color[this.color]}]`;
  }
}

/** Create from a single byte, as in SF */
Attributes.prototype.fromByte = byte => {
  return new Attributes(((byte & 0b00100000) !== 0),
    ((byte & 0b00010000) !== 0),
    ((byte & 0b00001000) !== 0) && ((byte & 0b00000100) === 0),
    ((byte & 0b00001000) !== 0) && ((byte & 0b00000100) !== 0),
    ((byte & 0b00000001) !== 0));
};

/** Create from multiple bytes, as in SFE */
Attributes.prototype.fromBytes = bytes => {
  let basic = 0;
  let blink = false;
  let reverse = false;
  let underscore = false;
  let color = Color.NEUTRAL;
  for (let i = 0; i < bytes.length; i++) {
    switch (bytes[i]) {
      case TypeCode.BASIC:
        basic = bytes[i + 1];
        break;
      case TypeCode.HIGHLIGHT:
        switch (bytes[i + 1]) {
          case Highlight.BLINK:
            blink = true;
            break;
          case Highlight.REVERSE:
            reverse = true;
            break;
          case Highlight.UNDERSCORE:
            underscore = true;
            break;
        }
        break;
      case TypeCode.COLOR:
        color = bytes[i + 1];
        break;
    }
  }
  return new Attributes(((basic & 0b00100000) !== 0),
    ((basic & 0b00010000) !== 0),
    ((basic & 0b00001000) !== 0) && ((basic & 0b00000100) === 0),
    ((basic & 0b00001000) !== 0) && ((basic & 0b00000100) !== 0),
    ((basic & 0b00000001) !== 0),
    blink,
    reverse,
    underscore,
    color);
};
/** Create from others */
Attributes.prototype.from = (...another) => {
  const attributes = new Attributes();
  Object.assign(attributes, ...another);
  return attributes;
};

class Cell {
  constructor(value, attributes, attribute) {
    this.value = value || '\u00a0';
    this.attributes = attributes || new Attributes();
    this.attribute = attribute || false;
  }
  /** Convert to CSS */
  toCSS(cursorAt, focused) {
  // delegate to attributes
    return this.attributes.toCSS(this, cursorAt, focused);
  }
}

class CellLine extends Component {
  constructor(props) {
    
  }
}




export const TN3270 = (props, context) => {
  const { act, data } = useBackend(context);
  const {
    commands,
  } = data;
  return (
    <Window
      width={800}
      height={600}>
      <Window.Content>
        <BlockTerminal screen_width={800} screen_height={600} />
      </Window.Content>
    </Window>
  );
};
