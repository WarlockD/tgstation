import { classes } from 'common/react';
import { Fragment, Component, createRef } from 'inferno';
import { useBackend, useSharedState, useLocalState, backendSetSharedState } from '../backend';
import { Button, Section, Box, Flex, Icon } from '../components';
import { Window } from '../layouts';
import { createLogger, logger } from '../logging';
// tslint:disable-next-line:max-line-length

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

const ENABLE_FIELD_LOGGING = false;



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
  const style = { color: lu3270_color, 'background-color': lu3270_background  };
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
    if (highlight)  { style['font-weight'] = '900'; }
    if (attribute & CELL_BLINK)  { style.animation = 'blink 1s linear infinite'; }

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
      style.color = style['background-color'];
      style['background-color'] = temp;
    }
    if (attribute & CELL_UNDERLINE)  {
      style['border-bottom'] = '1px solid '+ style.color;
    }
  }
  style['text-color'] = style.color;
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
const CellFill = (props, context) => {
  const {
    pos, // starting position, used for selecting
    fill_length,
    attribute,
    ...rest
  } = props;

  const text = "\xA0".repeat(fill_length);
  if(ENABLE_FIELD_LOGGING)
    logger.log("CellFill("+  pos + ") fill_length=" + fill_length +" attribute=" + attribute);
  const style = createStyleFromByte(attribute, false, false);
  return (<span style={style}  {...rest}>{text}</span>);
};

const CellLabel = (props, context) => {
  const {
    pos, // starting position, used for selecting
    value,
    attribute,
    ...rest
  } = props;
  const text = value && value.replace(" ", "\xA0");
  if(ENABLE_FIELD_LOGGING)
    logger.log("CellLabel("+  pos + ") value=" + value +" attribute=" + attribute);
  const style = createStyleFromByte(attribute, false, false);
  return (<span style={style} {...rest}>{text || "\xA0"}</span>);
};

const CellField = (props, context) => {
  const {
    pos,
    name,
    value,
    field_length,
    attribute,
    ...rest
  } = props;
  const [
    fields,
    setFields
  ] = useSharedState(context, "field_cache", { });
  // kind of hacky, but these magic numbers DO work
  if(ENABLE_FIELD_LOGGING)
    logger.log("CellField("+  pos + ") name=" + name +" field_length=" + field_length);
  const field_size = field_length * magic.cxFactor + "px";
  let style = createStyleFromByte(attribute | CELL_UNDERLINE, false, false);

  return (
    <input type="lu3270_input" size={field_length}
    maxlength={field_length} style={style}
    onchange={ e=> setFields({ name: e.target.value })} >
    {fields[name]}
  </input>
};

const CellDom = (props, context) => {
  const {
    pos,
    value,
    field_length,
    onClick = e => { logger.log("Clicky " + pos + "color=" + style.color ); setCursorAt(pos); },
  } = props;
    const [
      cursorAt,
      setCursorAt
    ] = useSharedState(context,"status", { cursorAt: -1 });

    const style = { 'flex' : '1 1 ' + (field_length*magic.cxFactor) + 'px' };
  //  const style = { 'flex' : 'none' };
    const color_style = createStyleFromByte(value.attribute, false, false);
  return (
    <div id={'cell'+value.pos } style="{style}" >
      <span style={color_style}>
      {
        value.type === "text" ?
          value.text:
        value.type === "fill" ?
          "\xA0".repeat(field_length) :
        value.type == "field" ?
          (<CellField pos={pos} name={value.name}  attribute={value.attribute || 0} field_length={value.field_length}/>) :
          null
      }
      </span>

    </div>
  );
};
const makeBlankCell = (pos,field_length) => {
  return  { pos: pos, type: "fill", fill_length: field_length };
};

const createScreen = ( data, cols, rows) => {
  let last_pos = 0;
  let pos = 0;
  let fill_length = 0;
  let ret = [];
  let data_pos = 0;
  let cells = [];
  data.sort((l,r) => l.pos - r.pos); // make sure we are sorted
  // no know, there is no easy way to just "add" x amount of objects at the end of an array
  // without just recreating it.  silly really
  const pushMany = (o, count=1) => {
    for(let i=0;i < count; i++)
      cells.push(o);
  }
  const pushCellCache = cell => {
    switch(cell.type){
      case "text":
        ret.push({ pos: cell.pos, field_length:cell.text.length, cell: cell });
        pushMany({ protect: true, cell: cell },cell.text.length);
        return cell.text.length;
      case "field":
        ret.push({ pos: cell.pos, field_length:cell.field_length, cell: cell });
        pushMany({ protect: false, cell: cell},cell.field_length);
        return cell.field_length;
      case "fill":
        ret.push({ pos: cell.pos, field_length:cell.fill_length, cell: cell });
        pushMany({ protect: true, cell: cell },cell.fill_length);
        return cell.fill_length;
      default:
        logger.log("pushCellchash error");
        return 0;
    }
  };

  for(let r=0; r < rows; r++) {
    pos = r * cols; // force start of line
    last_pos = pos
    fill_length = 0;
    let c = 0;
    while(c < cols && data_pos < data.length) {
      const cell = data[data_pos];
      if(cell.pos === pos) {
        if(fill_length > 0) {
          pushCellCache(makeBlankCell(last_pos,fill_length));
          fill_length = 0;
        }
        const field_length = pushCellCache(cell);
        c+=field_length;
        pos+=field_length;
        last_pos = pos;
        data_pos++;
      } else {
        c++;
        pos++;
        fill_length++;
      }
    }
    if(c < cols) { // end of line
      pushCellCache(makeBlankCell(pos,cols-c));
    } else if(fill_length > 0) {
      pushCellCache(makeBlankCell(last_pos,fill_length));
    }
  }
  return { cells: cells, doms: ret };
};

const RealTerminal = (props,context) => {
  const {
    numRows=24,
    numCols=80,
    focused=true,
    data = []
  } = props;
/*
              onkeypress={this.onKeyPress.bind(this)}
              onkeydown={this.onKeyUp.bind(this)}
              onkeyup={this.onKeyDown.bind(this)}
              onblur={this.onLoseFocus.bind(this)}
              onfocus={this.onFocus.bind(this)}
              */
  const field_col = 80+10;
  const test_data = [
    { type: "text", pos: 80, text: "Fuck Me I am asian!", attribute: CELL_YELLOW  | CELL_UNDERLINE},
    { type: "text", pos: 334, text: "Fuck Me I am asian!", attribute: CELL_BLUE | CELL_UNDERLINE },
    { type: "text", pos: 1000, text: "Fuck Me I am asian!", attribute: CELL_YELLOW | CELL_REVERSE },
    { type: "text", pos: field_col+10, text: "[", attribute: CELL_WHITE },
    { type: "field", pos: field_col+11, name: "test_field2", attribute: CELL_RED | CELL_UNDERLINE, field_length: 10 },
    { type: "text", pos: field_col+10+21, text: "]", attribute: CELL_WHITE },
  ];


  const screen = createScreen(test_data, numCols, numRows );
  const [
    cursorAt,
    setCursorAt,
  ] = useSharedState(context,"status", { cursorAt: -1 });
  const getPosition = el => {
    var xPosition = 0;
    var yPosition = 0;

    while (el) {
      if (el.tagName == "BODY") {
        // deal with browser quirks with body/window/document and page scroll
        var xScrollPos = el.scrollLeft || document.documentElement.scrollLeft;
        var yScrollPos = el.scrollTop || document.documentElement.scrollTop;

        xPosition += (el.offsetLeft - xScrollPos + el.clientLeft);
        yPosition += (el.offsetTop - yScrollPos + el.clientTop);
      } else {
        xPosition += (el.offsetLeft - el.scrollLeft + el.clientLeft);
        yPosition += (el.offsetTop - el.scrollTop + el.clientTop);
      }

      el = el.offsetParent;
    }
    return {
      x: xPosition,
      y: yPosition
    };
  }
  const onMouseClick = e => {
    const pos = getPosition(e);
    const address = e.y * numCols + e.x;
    logger.log("x=" + e.x + " y=" + e.y + " address=" + address);
    return false;
  }
  return (
    <Box fillPositionedParent onClick={e=> onMouseClick(e)}>
      <button class="caret" for="input">&nbsp;</button>
      <Flex direction="column" height="100%" className="lu360_root">
            <Flex.Item grow={1}>

              <div class="lu3270"
              style={{ width:((numCols+1)*Constants.magic.cxFactor) + 'px', height:((numRows+1)*Constants.magic.cyFactor) + 'px'}}>
                <div class="cells">

                  {
                    screen.doms.map((info, i) => <CellDom key={"cell_" + i} value={info.cell} pos={info.pos} field_length={info.field_length} />)
                  }
                </div>
              </div>
            </Flex.Item>
            <Flex.Item shrink={0}>
              <TN3270_Status cells={screen.cells} perfs={UpdateTerminalPerfs(1)} />
            </Flex.Item>
          </Flex>
        </Box>
    );

};

const TN3270_Status = (props, context) => {
//       rotation={iconRotation}
// spin={iconSpin} />
  const {
    cells,
  } = props;

  const [
    cursorAt,
  ] = useSharedState(context,"status", { cursorAt: -1 });
  const [
    perfs,
  ] = useSharedState(context,"perfs", UpdateTerminalPerfs(1));

  const connected = true;
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
          <RealTerminal numRows={24}  numCols={80} focused={true} data = {[]}/>
      </Window.Content>
    </Window>
  );
};


