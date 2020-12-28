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
const CELL_UPDATE_ON_ENTER = (1<<9);
const CELL_UPDATE_ON_LOST_FOCUS = (1<<10); // like on tab, we send an act
const CELL_UPDATE_ALWAYS = (1<<11); // this cell is always sent on any act update
const CELL_READONLY 	=	(1<<12); // this cell is always sent on any act update
const text_mask = CELL_BLINK | CELL_HIGHLIGHT |  CELL_UNDERLINE | CELL_REVERSE | CELL_COLOR_MASK;

const createClassList = attribute => {
  let classname = ["attribute"];
  classname.push("blink");
  switch (attribute & CELL_COLOR_MASK) {
    case CELL_BLUE:
      classname.push("fg-blue");
      break;
    case CELL_RED:
      // NOTE: subjective compensation for relative low-intensity
      classname.push("fg-red");
      break;
    case CELL_PINK:
      classname.push("fg-pink");
      break;
    case CELL_GREEN:
      classname.push("fg-green");
      break;
    case CELL_TURQUOISE:
      classname.push("fg-turquoise");
      break;
    case CELL_YELLOW:
      classname.push("fg-yellow");
      break;
    case CELL_WHITE:
      classname.push("fg-white");
      break;
  }
  if (attribute & CELL_HIGHLIGHT)  classname.push("highlight");
  if (attribute & CELL_BLINK) classname.push("blink");
  if (attribute & CELL_UNDERLINE)  classname.push("underline");

  const text = classname.join(" ");
  logger.log("classes=" + text);
  return text;
};
/**
 * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
 *
 * @param {String} text The text to be rendered.
 * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
 *
 * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
 */
const getTextWidth = (text, font) => {
  // re-use canvas object for better performance
  var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
  var context = canvas.getContext("2d");
  context.font = font;
  var metrics = context.measureText(text);
  return metrics.width;
}
const letter_width = getTextWidth("W", "18px 3270 Font");

const createStyle = (attribute, x, y, length) => {
  const style = {
  //  'flex': '1 1 ' + ((length/80) * 100) +'%',
   'width': length + 'rem', // (magic.cxFactor*length) + 'px' ,
   'min-width' : length + 'rem', // (magic.cxFactor*length) + 'px' ,
   'max-width' : length + 'rem', // (magic.cxFactor*length) + 'px' ,
  };
  return style;
};

const createStyleFromByte = (attribute, x, y, length,  text) => {
  const trasform_text = 'translate(' + x * letter_width + "px," + y * 18 + "px)";
  //const text_length = (length/80) * 100 +"%";
 const text_length =(text ?  getTextWidth(text, "18px 3270 Font") : (length* letter_width))+ 'px';
 // const text_length = length + 'rem', // (magic.cxFactor*length) + 'px' ,
  const style = {
    'width': text_length,
    'min-width' : text_length,
    'max-width' : text_length,
    'transform': trasform_text,
    color: lu3270_color,
    'background': 'none',
    'background-color': lu3270_background ,
   // 'border' : '1px solid red',
  //  'width': (length/80*100) + '%' ,
  };
  /*
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
  }*/ if(attribute) {
    const highlight  = attribute & CELL_HIGHLIGHT;
    if (highlight)  { style['font-weight'] = '900'; }
    if (attribute & CELL_BLINK)  { style.animation = 'blinker  1s linear infinite'; }

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

      style['text-decoration'] = 'underline';
    }
  }
  style['text-color'] = style.color;
  return style;
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

const ESC = '\u001B';

const makeBlankCell = (x,y, field_length) => {
  let   style =  createStyleFromByte(0,  x, y, field_length, false, false);
  return  { x:x, y:y,  type: "text",
    field_length: field_length,
    style: style,
    class:  createClassList(0),
    attribute:0,
    text:" ".repeat(field_length)
  };
};

const parse_screen_code = (commands, numRows,numCols) => {

  // () is must [] is optional
  // attibute is a number of a bunch of bit flags, can be up to 16bit NOT hex
  // ESC[attribute] (".*) = text at the current position.  We will ignore an ending " but its not necessary
  // ESCG(y)[,x] // goto cursor
  // ESCF(attribute),(field_name),(field_length)[,tab_pos] // its a field, going to be updated after ui_update as we use ui_static_update to make the screen
  // ESCM(attribute),(menu_name)("+*) // menu field, by default on clickable
  let x = 0;
  let y = 0;
  let rows = new Array(numRows);
  for(let i=0;i < rows.length; i++) {
    rows[i] = [];
  }
  let fields = {};
  let field_length = 0;
  let last_field_attribute = 0;
  let last_menu_attribute = 0;
  let value = 0;
  let pos = 0;
  let last_tab = 0;
  let last_text_attribute = 0;
  const move_cursor = l => {
    x+=l;
    while(y < numRows  && x > numCols) {
      y++;
      x-=numCols;
    }
  }

  for(let i = 0; i < commands.length; i++) {
    const current = commands[i];
    const cmd = current[0];
    let args = current.slice(1);
    let parsed_cmd = null;
    field_length = 0;
    switch(cmd) {
      case "goto":
        if(!args || args.length!=2)
          logger.log("screen("+ i +"): goto has no args");
        else if((args[0] < 0 ||  args[0] > numCols) || (args[1] < 0 || args[1] > numRows))
         logger.log("screen("+ i +"): goto args out of range");
        else {
          x = args[0];
          y = args[1];
        }
        break;
      case "text":
        if(!args)
          break; // no text
        else if(args.length == 2) {
          // we have an attribute number
          last_text_attribute = args[0] ;
          args.shift();
        }
        field_length = args[0].length
        parsed_cmd = { type: "text", x:x, y:y , text: args[0], attribute: last_text_attribute };
        break;
      case "field":
        if(!args || args.length < 2)
          logger.log("screen("+ i +"): field need at least name and its length");
        else {
          if(Number.isInteger(args[0])) {
            last_field_attribute = args[0];
            args.shift();
          }
          field_length = args[1];
          parsed_cmd = { type: "field", x:x, y:y , name: args[0], attribute: last_field_attribute, tab: last_tab++ };
          parsed_cmd.class = "field";
          last_field_attribute &= ~text_mask; // filter out all the individual field settings like readonly
        }
        break; // no text
      case "menu": // menu button
      if(!args || args.length < 2)
        logger.log("screen("+ i +"): field need at least name and its length");
      else {
        if(Number.isInteger(args[0])) {
          last_menu_attribute = args[0];
          args.shift();
        }
        field_length = args[1];
        parsed_cmd = { type: "menu", x:x, y:y , name: args[0], attribute: last_menu_attribute, tab: last_tab++ };
        last_menu_attribute &= ~text_mask; // filter out all the individual field settings like readonly
      }
      break; // no text
      default:
        logger.log("screen("+ i +"): unkonwn command = " + cmd);
      break;
    }
    if(field_length>0) {
      parsed_cmd.field_length = field_length;
     // parsed_cmd.style = createStyleFromByte(parsed_cmd.attribute,  x, y, field_length, false, false);
      parsed_cmd.style =  createStyleFromByte(parsed_cmd.attribute,  x, y, field_length+1, parsed_cmd.text);

     // if(parsed_cmd.type)
     //   parsed_cmd.class += " field";
      rows[y].push(parsed_cmd);
      move_cursor(field_length);
    }
  }
  let cell = null;
  for(let y=0; y < rows.length; y++) {
      let row = rows[y];
      if(!row || row.length == 0) {
        //const cell = { type: 'blank_line' };
       cell = makeBlankCell(0,y, numCols);
      //  cell.style['flex'] = '0 1 100%';
      //  cell.style['width'] = '100%';
        row.push(cell);
      } else {
        row.sort((l,r)=> l.x - r.x);
        let new_row = [];
        let x = 0;
        while(row.length > 0) {
          cell = row[0];
          row.shift();
          if(x != cell.x) {
        //    new_row.push(makeBlankCell(x,y, cell.x-x));
            x = cell.x;
          }
          new_row.push(cell);
          x += cell.field_length;
          if(x > numCols) {
            logger.log("length of line " + y + " to long, trunked");
            break;
          }
        }

        if(x < numCols) {
      //      new_row.push(makeBlankCell(x,y, numCols-x));
        }

        rows[y] = new_row;
      }
  }
  return rows;
}

const TerminalField = (props, context) => {
  const {
    cell,
    state_name,
    ...rest
  } = props;

  const [
    fields,
    setFields,
  ] = useSharedState(context, state_name, {});
  const field_name = cell.name;
  const onChange = e => {
    const v = fields;
    v[field_name] = e.target.value;
    setFields(v);
  }
  if(cell.attribute & CELL_READONLY)
    return <span {...rest}>{fields[field_name]}</span>
  else
    return (<input onchange={e=> onChange(e) }
      class="field"
      type="text"
      maxlength={cell.field_length}
      length={cell.field_length}
      value={fields[field_name]}
     {...rest}/>);
};

class RealTerminal extends Component {
  constructor(props,context) {
    super(props,context);
    // TODO: caculate resizing with font size of a base of 18px
    const numRows =  props.numRows ? props.numRows+1 :  24+1;
    const numCols = props.numCols || 80;
    const current_screen =  0; // -1 should be a non connection screen
    const screen_data=  props.screens && props.screens[current_screen]; // setup default screen
    this.letter_width = getTextWidth("W", "18px 3270 Font");
    this.state = {
      focused:true,
      cursorAt : [0,0],
      current_screen : current_screen,
      screen_data: screen_data,
      numRows: numRows,
      numCols: numCols,
      parsed_screen: parse_screen_code(screen_data,numRows,numCols),
      status:  { cursorAt: [1,1] },
      force_update: true,
      update_time: -1,
    };

  }
  printAllFields(fields) {
    let line = "{ ";
    Object.keys(fields).forEach(name => {
      line += name + "=" + fields[name] + ", "
    })
    logger.log(line + "}");
  }
  initFieldData(data) {
    const state_name = "screen_fields_" + this.state.current_screen; // get the object id for the screen as that should be here
    const [
      fields,
      setFields,
    ] = useSharedState(this.context, state_name, {});
    setFields(data);
  }
  componentWillReceiveProps(nextProps, context) {
    const { act, data } = useBackend(this.context);
    const fields = data.fields;
    const update_time = data.update_time;
    if(this.state.update_time < 0 || update_time >  this.state.update_time) {
      // run this update once
      let new_fields = {};
      Object.keys(fields).forEach(name => {
          new_fields[name]  = fields[name];
      })
      this.setState({ update_time: update_time});
      this.initFieldData(new_fields);
      logger.log("static_up updated =" + update_time );
    }

  }
  updateSingleField(name, value) {
    const state_name = "screen_fields_" + this.state.current_screen; // get the object id for the screen as that should be here
    const [
      fields,
      setFields,
    ] = useSharedState(this.context, state_name, {});
    setFields({name : value});
  }
  shouldComponentUpdate(nextProps, nextState, context) {
    /*
    const { act, data } = useBackend(this.context);
    const fields = data["fields"];
    if(fields) {
      let new_fields = {};
      Object.keys(fields).forEach(name => {
          new_fields[name]  = fields[name];
      })
      logger.log("All fields updated");
      this.initFieldData(new_fields)
      return true; // always update for now
    }
    */
    // kind of important to know if we "should" update.
    // for one, if byond sens us a minor screen update we should
    // update the approprate screen.  field updating is set to
    // shared state so we want to update THAT if a field update
    // comes down the pipe from somewhere else
    return true; // always update for now
  }

  render() {
    const {
      numRows,
      numCols,
      parsed_screen,
      status,
    } = this.state;

    const { act, data } = useBackend(this.context);

  const getCoordsRelativeToElement = (event, element) =>{
    const rect = element.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  }
  const printRect = rect => {
    return "rect(" + Math.round(rect.left) + "," + Math.round(rect.top) + "," + Math.round(rect.right) + "," + Math.round(rect.bottom)+ ")";
  }
  const printCords = cords => {
    return "(" + Math.round(cords[0]) + "," + Math.round(cords[1]) + ")";
  }


  const onMouseClick = e => {

    const target = e.target;
    const coords = getCoordsRelativeToElement(e, e.currentTarget);

    const cell = [
      Math.trunc(coords[0] /magic.cxFactor),
      Math.trunc(coords[1] / magic.cyFactor)
    ];
    const address = cell[1] * numCols + cell[0];
    //+ " x=" + pos.x - rect.left + " y=" +  pos.y - rect.top + " address=" + address);
    this.setState({ cursorAt: [4,3]});

    return false;
  }
  const state_name = "screen_fields_" + this.state.current_screen; // get the object id for the screen as that should be here

//    <div class="row_test">
  return (
      <Box
      position="relative"
      backgroundColor="black"
        width={((numCols)*this.letter_width) + 'px'}
        height={((numRows+1)*18) + 'px'}>
          <div class="lu3270">
            {
              parsed_screen.map((row, y) => (
                row.map((cell,x) => (
                  <div class="cell" style={cell.style}>
                  {
                    cell.type === "field" ? (<TerminalField  cell={cell} state_name={state_name} />)
                    : <span class="text">{cell.text}</span>
                  }
                </div>))))
          }
          </div>
      </Box>
    );
  }
};

const TN3270_Status = (props, context) => {
//       rotation={iconRotation}
// spin={iconSpin} />
  const {
    cells,
  } = props;

  const [
    status,
  ] = useSharedState(context,"status", { cursorAt: -1 });
  const [
    perfs,
  ] = useSharedState(context,"perfs", UpdateTerminalPerfs(1));

  const connected = true;
  const current_cell = cells[status.cursorAt] || null;
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
        {(Math.trunc(status.cursorAt / perfs.numCols) + 1) +"/" + ((status.cursorAt % perfs.numCols) + 1)}
      </Flex.Item>
    </Flex>
  );
};
/*
const degrees_to_radians = degrees =>
{
  const pi = Math.PI;
  return degrees * (pi/180);
};
const line_to = (x1,y1, length, angle) => {
  let endPoint = [0,0];

  if (angle <= 45)
  {
      endPoint[0] = 30;
      endPoint[1] = Math.trunc(30 - 30*Math.Tan(degrees_to_radians(angle)));
  }
  else
  {
      endPoint[0] = 0;
      endPoint10 = Math.trunc(30*Math.Tan(degrees_to_radians(90-angle)));
  }
  return endPoint;
};
*/
class TTEKVar {
  constructor() {
    this.HWin=null;

    this.Drawing=false;
    this.ParseMode=false;
    this.SelectCodeFlag=0;

  this.TEKFont = [0,0,0,0];
  this.OldMemFont;
this.AdjustSize = false
this.ScaleFont = false;
this.ScreenWidth = 1024;
this.ScreenHeight = 1024;
  this.FontWidth = 20;
  this.FontHeight = 20;
  this.FW = [0,0,0,0];
  this.FH = [0,0,0,0];
  this.CaretX = 0;
  this.CaretY = 0;
  this.CaretOffset = 0;
  this.TextSize = 0;
  this.DispMode = 0;
  this.MemDC = "M 0,0"; // path start
  //  HBITMAP HBits, OldMemBmp;
  this.Active = 0;
  this.TextColor = "green";
  this.PenColor = "green";
  this.MemForeColor= "green";
  this.MemBackColor = "black";
  this. MemTextColor= "green";
  this.MemPenColor = "green";
  this.ps=0;
  this.ChangeEmu=0;
  this.CaretStatus=0;

  this.ButtonDown = false;
  this.Select = false;
  this.RubberBand = false;
  this.SelectStart = [0,0];
  this.SelectEnd = [0,0];

  this.GIN=false;
  this.CrossHair=false;
  this.IgnoreCount=0;
  this.GINX=0;
  this.GINY=0;

  /* flags for Drawing */
  this.LoXReceive;
  this.LoCount;
  this.LoA=0;
  this.LoB=0;

  /* variables for 2OC mode */
  this.OpCount=0;
  this.PrmCount=0;
  this.PrmCountMax=0;
  this.Op2OC=0;
  this.Prm2OC = [];

  /* plot mode */
  this.JustAfterRS = false;
  this.PenDown = false;
  this.PlotX = 0;
  this.PlotY=0;

  // variables for control sequences
  this.CSBuff = [];
  this.Param = [];

  // variables for graphtext
  this.GTWidth=0;  this.GTHeight=0; this.GTSpacing=0;
  this.GTCount=0;  this.GTLen=0;this.GTAngle=0;
  this.GTBuff =[];

  // variables for marker
  this.MarkerType=0;
  this.MarkerW=0;
  this.MarkerH=0;
  this.MarkerFont="";
  this.MarkerFlag=false;

  this.HiY=0;this.Extra=0; this.LoY=0; this.HiX=0; this.LoX=0;
  }
};

const line_to = (x1,y1, length, angle) => {

  const line = { start: [x1,y1], end: [ x1 + length * Math.cos(angle), y1 + length * Math.sin(angle)]  };
  logger.log("line=(" + line.start[0] + ", " + line.start[1] + ") -> (" + line.end[0] + ", " + line.end[1] + ")")
  return line
}
const rand = (l,h) => { return (Math.random() * h)+l ; }
const random_line = () => {
    return line_to(rand(100,900),rand(100,900), 100, rand(0,360));
};
// 4 charaters, make an x,y pair
const decode_tex_cords = (str, pos) => {
  const X = 32* (str.charCodeAt(pos+2) - 32) + (str.charCodeAt(pos+3)  - 64);
  const Y = 32* (str.charCodeAt(pos)  - 32) + (str.charCodeAt(pos+1)  - 96);
  return { x: X, y: Y };
};
// 4 font sizes
const tek_char_sizes = [
  { pix_width:56, pix_height:88, cols:74, rows:35, font:'15px Ubuntu Mono, courier-new, courier, monospace'},		/* large   "9x15" */
  { pix_width:51, pix_height:82, cols:81, rows:38, font:'13px Ubuntu Mono, courier-new, courier, monospace'},		/* #2 "6x13")*/
  { pix_width:34, pix_height:53, cols:121, rows:58, font:'13px Ubuntu Mono, courier-new, courier, monospace'},		/* #3 "8x13"*/
  { pix_width:31, pix_height:48, cols:133, rows:64, font:'10px Ubuntu Mono, courier-new, courier, monospace'},		/* small L "6x10" */
];
const EAST = 1;
const WEST = 2;
const NORTH = 4;
const SOUTH = 8;

const LINEMASK = 7;
const MARGIN1 = 0;
const MARGIN2 = 1;
const MAX_PTS	=	150;
const MAX_VTX	=	300;
const PENDOWN = 1;
const PENUP = 0;
const TEKBOTTOMPAD = 23;
const TEKDEFHEIGHT = 565;
const TEKDEFWIDTH = 750;
const TEKHEIGHT = 3072;
const TEKHOME = (state) => (state.fontsize.rows - 1)/state.fontsize.pix_height;

const TEKMINHEIGHT = 452;
const TEKMINWIDTH = 600;
const TEKTOPPAD = 34;
const TEKWIDTH = 4096;

const FULL_HEIGHT	= (TEKHEIGHT + TEKTOPPAD + TEKBOTTOMPAD);

const BottomY = y=>	(TEKHEIGHT + TEKTOPPAD - (y));

//const	input()		Tinput(tw)
//const unput(c)	*Tpushback++ = (Char) c
const ANSI_EOT = 0x04;
const ANSI_BEL = 0x07;
const ANSI_BS	=	0x08;
const ANSI_HT	=	0x09;
const ANSI_LF	=	0x0A;
const ANSI_VT	=	0x0B;
const	ANSI_FF	=	0x0C;		/* C0, C1 control names		*/
const ANSI_CR	=	0x0D;
const ANSI_SO	=	0x0E;
const ANSI_SI	=	0x0F;
const ANSI_XON = 0x11;		/* DC1 */
const ANSI_XOFF = 0x13;		/* DC3 */
const ANSI_NAK = 0x15;
const ANSI_CAN = 0x18;
const ANSI_ESC = 0x1B;
const ANSI_SPA = 0x20;
const XTERM_POUND = 0x1E;		/* internal mapping for '#'	*/
const ANSI_DEL = 0x7F;
const ANSI_SS2 = 0x8E;
const ANSI_SS3 = 0x8F;
const ANSI_DCS = 0x90;
const ANSI_SOS = 0x98;
const ANSI_CSI = 0x9B;
const ANSI_ST	=	0x9C;
	const ANSI_OSC = 0x9D;
  const ANSI_PM	=	0x9E;
const ANSI_APC = 0x9F;

const CASE_REPORT =1;
const CASE_VT_MODE =2;
const CASE_SPT_STATE =3;
const CASE_GIN =4;
const CASE_BEL =5;
const CASE_BS =6;
const CASE_PT_STATE =7;
const CASE_PLT_STATE =8;
const CASE_TAB =1;
const CASE_IPL_STATE =9;
const CASE_ALP_STATE =10;
const CASE_UP =11;
const CASE_COPY =12;
const CASE_PAGE =13;
const CASE_BES_STATE =14;
const CASE_BYP_STATE =15;
const CASE_IGNORE =16;
const CASE_ASCII =17;
const CASE_APL =18;
const CASE_CHAR_SIZE =19;
const CASE_BEAM_VEC =20;
const CASE_CURSTATE =21;
const CASE_PENUP =22;
const CASE_PENDOWN =23;
const CASE_IPL_POINT =24;
const CASE_PLT_VEC =25;
const CASE_PT_POINT =26;
const CASE_SPT_POINT =27;
const CASE_CR =28;
const CASE_ESC_STATE =29;
const CASE_LF =30;
const CASE_SP =31;
const CASE_PRINT =32;
const CASE_OSC =33;

const Talptable =		/* US (^_) normal alpha mode */
[
/*	NUL		SOH		STX		ETX	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	EOT		ENQ		ACK		BEL	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_BEL,
/*	BS		HT		NL		VT	*/
CASE_BS,
CASE_TAB,
CASE_LF,
CASE_UP,
/*	NP		CR		SO		SI	*/
CASE_IGNORE,
CASE_CR,
CASE_IGNORE,
CASE_IGNORE,
/*	DLE		DC1		DC2		DC3	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	DC4		NAK		SYN		ETB	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	CAN		EM		SUB		ESC	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_ESC_STATE,
/*	FS		GS		RS		US	*/
CASE_PT_STATE,
CASE_PLT_STATE,
CASE_IPL_STATE,
CASE_ALP_STATE,
/*	SP		!		"		#	*/
CASE_SP,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	$		%		&		'	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	(		)		*		+	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	,		-		.		/	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	0		1		2		3	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	4		5		6		7	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	8		9		:		;	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	<		=		>		?	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	@		A		B		C	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	D		E		F		G	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	H		I		J		K	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	L		M		N		O	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	P		Q		R		S	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	T		U		V		W	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	X		Y		Z		[	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	\		]		^		_	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	`		a		b		c	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	d		e		f		g	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	h		i		j		k	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	l		m		n		o	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	p		q		r		s	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	t		u		v		w	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	x		y		z		{	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*	|		}		~		DEL	*/
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_IGNORE,
/*      0x80            0x81            0x82            0x83    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x84            0x85            0x86            0x87    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x88            0x89            0x8a            0x8b    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x8c            0x8d            0x8e            0x8f    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x90            0x91            0x92            0x93    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x94            0x95            0x96            0x97    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x99            0x99            0x9a            0x9b    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x9c            0x9d            0x9e            0x9f    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      nobreakspace    exclamdown      cent            sterling        */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      currency        yen             brokenbar       section         */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      diaeresis       copyright       ordfeminine     guillemotleft   */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      notsign         hyphen          registered      macron          */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      degree          plusminus       twosuperior     threesuperior   */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      acute           mu              paragraph       periodcentered  */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      cedilla         onesuperior     masculine       guillemotright  */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      onequarter      onehalf         threequarters   questiondown    */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      Agrave          Aacute          Acircumflex     Atilde          */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      Adiaeresis      Aring           AE              Ccedilla        */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      Egrave          Eacute          Ecircumflex     Ediaeresis      */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      Igrave          Iacute          Icircumflex     Idiaeresis      */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      Eth             Ntilde          Ograve          Oacute          */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      Ocircumflex     Otilde          Odiaeresis      multiply        */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      Ooblique        Ugrave          Uacute          Ucircumflex     */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      Udiaeresis      Yacute          Thorn           ssharp          */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      agrave          aacute          acircumflex     atilde          */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      adiaeresis      aring           ae              ccedilla        */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      egrave          eacute          ecircumflex     ediaeresis      */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      igrave          iacute          icircumflex     idiaeresis      */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      eth             ntilde          ograve          oacute          */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      ocircumflex     otilde          odiaeresis      division        */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      oslash          ugrave          uacute          ucircumflex     */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
/*      udiaeresis      yacute          thorn           ydiaeresis      */
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
CASE_PRINT,
];

const Tbestable =		/* ESC while in bypass state */
[
/*	NUL		SOH		STX		ETX	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_VT_MODE,
/*	EOT		ENQ		ACK		BEL	*/
CASE_BYP_STATE,
CASE_REPORT,
CASE_BYP_STATE,
CASE_BEL,
/*	BS		HT		NL		VT	*/
CASE_BS,
CASE_TAB,
CASE_IGNORE,
CASE_UP,
/*	NP		CR		SO		SI	*/
CASE_PAGE,
CASE_IGNORE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	DLE		DC1		DC2		DC3	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	DC4		NAK		SYN		ETB	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_COPY,
/*	CAN		EM		SUB		ESC	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_GIN,
CASE_IGNORE,
/*	FS		GS		RS		US	*/
CASE_SPT_STATE,
CASE_PLT_STATE,
CASE_IPL_STATE,
CASE_ALP_STATE,
/*	SP		!		"		#	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	$		%		&		'	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	(		)		*		+	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	,		-		.		/	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	0		1		2		3	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	4		5		6		7	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	8		9		:		;	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	<		=		>		?	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	@		A		B		C	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	D		E		F		G	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	H		I		J		K	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	L		M		N		O	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	P		Q		R		S	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	T		U		V		W	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	X		Y		Z		[	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	\		]		^		_	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	`		a		b		c	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	d		e		f		g	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	h		i		j		k	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	l		m		n		o	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	p		q		r		s	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	t		u		v		w	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	x		y		z		{	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*	|		}		~		DEL	*/
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_IGNORE,
CASE_BYP_STATE,
/*      0x80            0x81            0x82            0x83    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x84            0x85            0x86            0x87    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x88            0x89            0x8a            0x8b    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x8c            0x8d            0x8e            0x8f    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x90            0x91            0x92            0x93    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x94            0x95            0x96            0x97    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x99            0x99            0x9a            0x9b    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x9c            0x9d            0x9e            0x9f    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      nobreakspace    exclamdown      cent            sterling        */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      currency        yen             brokenbar       section         */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      diaeresis       copyright       ordfeminine     guillemotleft   */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      notsign         hyphen          registered      macron          */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      degree          plusminus       twosuperior     threesuperior   */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      acute           mu              paragraph       periodcentered  */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      cedilla         onesuperior     masculine       guillemotright  */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      onequarter      onehalf         threequarters   questiondown    */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      Agrave          Aacute          Acircumflex     Atilde          */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      Adiaeresis      Aring           AE              Ccedilla        */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      Egrave          Eacute          Ecircumflex     Ediaeresis      */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      Igrave          Iacute          Icircumflex     Idiaeresis      */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      Eth             Ntilde          Ograve          Oacute          */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      Ocircumflex     Otilde          Odiaeresis      multiply        */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      Ooblique        Ugrave          Uacute          Ucircumflex     */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      Udiaeresis      Yacute          Thorn           ssharp          */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      agrave          aacute          acircumflex     atilde          */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      adiaeresis      aring           ae              ccedilla        */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      egrave          eacute          ecircumflex     ediaeresis      */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      igrave          iacute          icircumflex     idiaeresis      */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      eth             ntilde          ograve          oacute          */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      ocircumflex     otilde          odiaeresis      division        */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      oslash          ugrave          uacute          ucircumflex     */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
/*      udiaeresis      yacute          thorn           ydiaeresis      */
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
CASE_BYP_STATE,
];

const Tbyptable =		/* ESC CAN (^X) bypass state */
[
/*	NUL		SOH		STX		ETX	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	EOT		ENQ		ACK		BEL	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_BEL,
/*	BS		HT		NL		VT	*/
CASE_BS,
CASE_TAB,
CASE_LF,
CASE_UP,
/*	NP		CR		SO		SI	*/
CASE_IGNORE,
CASE_CR,
CASE_IGNORE,
CASE_IGNORE,
/*	DLE		DC1		DC2		DC3	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	DC4		NAK		SYN		ETB	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	CAN		EM		SUB		ESC	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_BES_STATE,
/*	FS		GS		RS		US	*/
CASE_PT_STATE,
CASE_PLT_STATE,
CASE_IPL_STATE,
CASE_ALP_STATE,
/*	SP		!		"		#	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	$		%		&		'	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	(		)		*		+	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	,		-		.		/	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	0		1		2		3	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	4		5		6		7	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	8		9		:		;	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	<		=		>		?	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	@		A		B		C	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	D		E		F		G	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	H		I		J		K	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	L		M		N		O	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	P		Q		R		S	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	T		U		V		W	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	X		Y		Z		[	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	\		]		^		_	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	`		a		b		c	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	d		e		f		g	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	h		i		j		k	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	l		m		n		o	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	p		q		r		s	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	t		u		v		w	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	x		y		z		{	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	|		}		~		DEL	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x80            0x81            0x82            0x83    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x84            0x85            0x86            0x87    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x88            0x89            0x8a            0x8b    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x8c            0x8d            0x8e            0x8f    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x90            0x91            0x92            0x93    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x94            0x95            0x96            0x97    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x99            0x99            0x9a            0x9b    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x9c            0x9d            0x9e            0x9f    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      nobreakspace    exclamdown      cent            sterling        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      currency        yen             brokenbar       section         */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      diaeresis       copyright       ordfeminine     guillemotleft   */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      notsign         hyphen          registered      macron          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      degree          plusminus       twosuperior     threesuperior   */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      acute           mu              paragraph       periodcentered  */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      cedilla         onesuperior     masculine       guillemotright  */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      onequarter      onehalf         threequarters   questiondown    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Agrave          Aacute          Acircumflex     Atilde          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Adiaeresis      Aring           AE              Ccedilla        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Egrave          Eacute          Ecircumflex     Ediaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Igrave          Iacute          Icircumflex     Idiaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Eth             Ntilde          Ograve          Oacute          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Ocircumflex     Otilde          Odiaeresis      multiply        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Ooblique        Ugrave          Uacute          Ucircumflex     */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Udiaeresis      Yacute          Thorn           ssharp          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      agrave          aacute          acircumflex     atilde          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      adiaeresis      aring           ae              ccedilla        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      egrave          eacute          ecircumflex     ediaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      igrave          iacute          icircumflex     idiaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      eth             ntilde          ograve          oacute          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      ocircumflex     otilde          odiaeresis      division        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      oslash          ugrave          uacute          ucircumflex     */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      udiaeresis      yacute          thorn           ydiaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
];

const Tesctable =		/* ESC */
[
/*	NUL		SOH		STX		ETX	*/
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
CASE_VT_MODE,
/*	EOT		ENQ		ACK		BEL	*/
CASE_CURSTATE,
CASE_REPORT,
CASE_CURSTATE,
CASE_BEL,
/*	BS		HT		NL		VT	*/
CASE_BS,
CASE_TAB,
CASE_IGNORE,
CASE_UP,
/*	NP		CR		SO		SI	*/
CASE_PAGE,
CASE_IGNORE,
CASE_APL,
CASE_ASCII,
/*	DLE		DC1		DC2		DC3	*/
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
/*	DC4		NAK		SYN		ETB	*/
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
CASE_COPY,
/*	CAN		EM		SUB		ESC	*/
CASE_BYP_STATE,
CASE_CURSTATE,
CASE_GIN,
CASE_IGNORE,
/*	FS		GS		RS		US	*/
CASE_SPT_STATE,
CASE_PLT_STATE,
CASE_IPL_STATE,
CASE_ALP_STATE,
/*	SP		!		"		#	*/
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
/*	$		%		&		'	*/
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
/*	(		)		*		+	*/
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
/*	,		-		.		/	*/
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
/*	0		1		2		3	*/
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
/*	4		5		6		7	*/
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
/*	8		9		:		;	*/
CASE_CHAR_SIZE,
CASE_CHAR_SIZE,
CASE_CHAR_SIZE,
CASE_CHAR_SIZE,
/*	<		=		>		?	*/
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
/*	@		A		B		C	*/
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
/*	D		E		F		G	*/
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
/*	H		I		J		K	*/
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
/*	L		M		N		O	*/
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
/*	P		Q		R		S	*/
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
/*	T		U		V		W	*/
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
/*	X		Y		Z		[	*/
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
/*	\		]		^		_	*/
CASE_CURSTATE,
CASE_OSC,
CASE_CURSTATE,
CASE_CURSTATE,
/*	`		a		b		c	*/
CASE_BEAM_VEC,
CASE_BEAM_VEC,
CASE_BEAM_VEC,
CASE_BEAM_VEC,
/*	d		e		f		g	*/
CASE_BEAM_VEC,
CASE_CURSTATE,
CASE_CURSTATE,
CASE_BEAM_VEC,
/*	h		i		j		k	*/
CASE_BEAM_VEC,
CASE_BEAM_VEC,
CASE_BEAM_VEC,
CASE_BEAM_VEC,
/*	l		m		n		o	*/
CASE_BEAM_VEC,
CASE_CURSTATE,
CASE_CURSTATE,
CASE_BEAM_VEC,
/*	p		q		r		s	*/
CASE_BEAM_VEC,
CASE_BEAM_VEC,
CASE_BEAM_VEC,
CASE_BEAM_VEC,
/*	t		u		v		w	*/
CASE_BEAM_VEC,
CASE_CURSTATE,
CASE_CURSTATE,
CASE_BEAM_VEC,
/*	x		y		z		{	*/
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
CASE_CURSTATE,
/*	|		}		~		DEL	*/
CASE_CURSTATE,
CASE_CURSTATE,
CASE_IGNORE,
CASE_CURSTATE,
/*      0x80            0x81            0x82            0x83    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x84            0x85            0x86            0x87    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x88            0x89            0x8a            0x8b    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x8c            0x8d            0x8e            0x8f    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x90            0x91            0x92            0x93    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x94            0x95            0x96            0x97    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x99            0x99            0x9a            0x9b    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x9c            0x9d            0x9e            0x9f    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      nobreakspace    exclamdown      cent            sterling        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      currency        yen             brokenbar       section         */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      diaeresis       copyright       ordfeminine     guillemotleft   */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      notsign         hyphen          registered      macron          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      degree          plusminus       twosuperior     threesuperior   */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      acute           mu              paragraph       periodcentered  */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      cedilla         onesuperior     masculine       guillemotright  */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      onequarter      onehalf         threequarters   questiondown    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Agrave          Aacute          Acircumflex     Atilde          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Adiaeresis      Aring           AE              Ccedilla        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Egrave          Eacute          Ecircumflex     Ediaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Igrave          Iacute          Icircumflex     Idiaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Eth             Ntilde          Ograve          Oacute          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Ocircumflex     Otilde          Odiaeresis      multiply        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Ooblique        Ugrave          Uacute          Ucircumflex     */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Udiaeresis      Yacute          Thorn           ssharp          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      agrave          aacute          acircumflex     atilde          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      adiaeresis      aring           ae              ccedilla        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      egrave          eacute          ecircumflex     ediaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      igrave          iacute          icircumflex     idiaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      eth             ntilde          ograve          oacute          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      ocircumflex     otilde          odiaeresis      division        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      oslash          ugrave          uacute          ucircumflex     */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      udiaeresis      yacute          thorn           ydiaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
];

const Tipltable =		/* RS (^^) incremental plot */
[
/*	NUL		SOH		STX		ETX	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	EOT		ENQ		ACK		BEL	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_BEL,
/*	BS		HT		NL		VT	*/
CASE_BS,
CASE_TAB,
CASE_LF,
CASE_UP,
/*	NP		CR		SO		SI	*/
CASE_IGNORE,
CASE_CR,
CASE_IGNORE,
CASE_IGNORE,
/*	DLE		DC1		DC2		DC3	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	DC4		NAK		SYN		ETB	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	CAN		EM		SUB		ESC	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_ESC_STATE,
/*	FS		GS		RS		US	*/
CASE_PT_STATE,
CASE_PLT_STATE,
CASE_IPL_STATE,
CASE_ALP_STATE,
/*	SP		!		"		#	*/
CASE_PENUP,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	$		%		&		'	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	(		)		*		+	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	,		-		.		/	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	0		1		2		3	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	4		5		6		7	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	8		9		:		;	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	<		=		>		?	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	@		A		B		C	*/
CASE_IGNORE,
CASE_IPL_POINT,
CASE_IPL_POINT,
CASE_IGNORE,
/*	D		E		F		G	*/
CASE_IPL_POINT,
CASE_IPL_POINT,
CASE_IPL_POINT,
CASE_IGNORE,
/*	H		I		J		K	*/
CASE_IPL_POINT,
CASE_IPL_POINT,
CASE_IPL_POINT,
CASE_IGNORE,
/*	L		M		N		O	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	P		Q		R		S	*/
CASE_PENDOWN,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	T		U		V		W	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	X		Y		Z		[	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	\		]		^		_	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	`		a		b		c	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	d		e		f		g	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	h		i		j		k	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	l		m		n		o	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	p		q		r		s	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	t		u		v		w	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	x		y		z		{	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	|		}		~		DEL	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x80            0x81            0x82            0x83    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x84            0x85            0x86            0x87    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x88            0x89            0x8a            0x8b    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x8c            0x8d            0x8e            0x8f    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x90            0x91            0x92            0x93    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x94            0x95            0x96            0x97    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x99            0x99            0x9a            0x9b    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x9c            0x9d            0x9e            0x9f    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      nobreakspace    exclamdown      cent            sterling        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      currency        yen             brokenbar       section         */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      diaeresis       copyright       ordfeminine     guillemotleft   */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      notsign         hyphen          registered      macron          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      degree          plusminus       twosuperior     threesuperior   */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      acute           mu              paragraph       periodcentered  */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      cedilla         onesuperior     masculine       guillemotright  */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      onequarter      onehalf         threequarters   questiondown    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Agrave          Aacute          Acircumflex     Atilde          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Adiaeresis      Aring           AE              Ccedilla        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Egrave          Eacute          Ecircumflex     Ediaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Igrave          Iacute          Icircumflex     Idiaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Eth             Ntilde          Ograve          Oacute          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Ocircumflex     Otilde          Odiaeresis      multiply        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Ooblique        Ugrave          Uacute          Ucircumflex     */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Udiaeresis      Yacute          Thorn           ssharp          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      agrave          aacute          acircumflex     atilde          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      adiaeresis      aring           ae              ccedilla        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      egrave          eacute          ecircumflex     ediaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      igrave          iacute          icircumflex     idiaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      eth             ntilde          ograve          oacute          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      ocircumflex     otilde          odiaeresis      division        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      oslash          ugrave          uacute          ucircumflex     */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      udiaeresis      yacute          thorn           ydiaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
];

const Tplttable =		/* GS (^]) graph (plot) mode */
[
/*	NUL		SOH		STX		ETX	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	EOT		ENQ		ACK		BEL	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_BEL,
/*	BS		HT		NL		VT	*/
CASE_BS,
CASE_TAB,
CASE_LF,
CASE_UP,
/*	NP		CR		SO		SI	*/
CASE_IGNORE,
CASE_CR,
CASE_IGNORE,
CASE_IGNORE,
/*	DLE		DC1		DC2		DC3	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	DC4		NAK		SYN		ETB	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	CAN		EM		SUB		ESC	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_ESC_STATE,
/*	FS		GS		RS		US	*/
CASE_PT_STATE,
CASE_PLT_STATE,
CASE_IPL_STATE,
CASE_ALP_STATE,
/*	SP		!		"		#	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	$		%		&		'	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	(		)		*		+	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	,		-		.		/	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	0		1		2		3	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	4		5		6		7	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	8		9		:		;	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	<		=		>		?	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	@		A		B		C	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	D		E		F		G	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	H		I		J		K	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	L		M		N		O	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	P		Q		R		S	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	T		U		V		W	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	X		Y		Z		[	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	\		]		^		_	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	`		a		b		c	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	d		e		f		g	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	h		i		j		k	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	l		m		n		o	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	p		q		r		s	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	t		u		v		w	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	x		y		z		{	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*	|		}		~		DEL	*/
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
CASE_PLT_VEC,
/*      0x80            0x81            0x82            0x83    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x84            0x85            0x86            0x87    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x88            0x89            0x8a            0x8b    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x8c            0x8d            0x8e            0x8f    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x90            0x91            0x92            0x93    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x94            0x95            0x96            0x97    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x99            0x99            0x9a            0x9b    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x9c            0x9d            0x9e            0x9f    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      nobreakspace    exclamdown      cent            sterling        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      currency        yen             brokenbar       section         */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      diaeresis       copyright       ordfeminine     guillemotleft   */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      notsign         hyphen          registered      macron          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      degree          plusminus       twosuperior     threesuperior   */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      acute           mu              paragraph       periodcentered  */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      cedilla         onesuperior     masculine       guillemotright  */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      onequarter      onehalf         threequarters   questiondown    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Agrave          Aacute          Acircumflex     Atilde          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Adiaeresis      Aring           AE              Ccedilla        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Egrave          Eacute          Ecircumflex     Ediaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Igrave          Iacute          Icircumflex     Idiaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Eth             Ntilde          Ograve          Oacute          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Ocircumflex     Otilde          Odiaeresis      multiply        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Ooblique        Ugrave          Uacute          Ucircumflex     */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Udiaeresis      Yacute          Thorn           ssharp          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      agrave          aacute          acircumflex     atilde          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      adiaeresis      aring           ae              ccedilla        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      egrave          eacute          ecircumflex     ediaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      igrave          iacute          icircumflex     idiaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      eth             ntilde          ograve          oacute          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      ocircumflex     otilde          odiaeresis      division        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      oslash          ugrave          uacute          ucircumflex     */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      udiaeresis      yacute          thorn           ydiaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
];

const Tpttable =		/* FS (^\) point plot mode */
[
/*	NUL		SOH		STX		ETX	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	EOT		ENQ		ACK		BEL	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_BEL,
/*	BS		HT		NL		VT	*/
CASE_BS,
CASE_TAB,
CASE_LF,
CASE_UP,
/*	NP		CR		SO		SI	*/
CASE_IGNORE,
CASE_CR,
CASE_IGNORE,
CASE_IGNORE,
/*	DLE		DC1		DC2		DC3	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	DC4		NAK		SYN		ETB	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	CAN		EM		SUB		ESC	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_ESC_STATE,
/*	FS		GS		RS		US	*/
CASE_PT_STATE,
CASE_PLT_STATE,
CASE_IPL_STATE,
CASE_ALP_STATE,
/*	SP		!		"		#	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	$		%		&		'	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	(		)		*		+	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	,		-		.		/	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	0		1		2		3	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	4		5		6		7	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	8		9		:		;	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	<		=		>		?	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	@		A		B		C	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	D		E		F		G	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	H		I		J		K	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	L		M		N		O	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	P		Q		R		S	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	T		U		V		W	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	X		Y		Z		[	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	\		]		^		_	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	`		a		b		c	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	d		e		f		g	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	h		i		j		k	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	l		m		n		o	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	p		q		r		s	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	t		u		v		w	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	x		y		z		{	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*	|		}		~		DEL	*/
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
CASE_PT_POINT,
/*      0x80            0x81            0x82            0x83    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x84            0x85            0x86            0x87    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x88            0x89            0x8a            0x8b    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x8c            0x8d            0x8e            0x8f    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x90            0x91            0x92            0x93    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x94            0x95            0x96            0x97    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x99            0x99            0x9a            0x9b    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x9c            0x9d            0x9e            0x9f    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      nobreakspace    exclamdown      cent            sterling        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      currency        yen             brokenbar       section         */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      diaeresis       copyright       ordfeminine     guillemotleft   */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      notsign         hyphen          registered      macron          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      degree          plusminus       twosuperior     threesuperior   */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      acute           mu              paragraph       periodcentered  */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      cedilla         onesuperior     masculine       guillemotright  */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      onequarter      onehalf         threequarters   questiondown    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Agrave          Aacute          Acircumflex     Atilde          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Adiaeresis      Aring           AE              Ccedilla        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Egrave          Eacute          Ecircumflex     Ediaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Igrave          Iacute          Icircumflex     Idiaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Eth             Ntilde          Ograve          Oacute          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Ocircumflex     Otilde          Odiaeresis      multiply        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Ooblique        Ugrave          Uacute          Ucircumflex     */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Udiaeresis      Yacute          Thorn           ssharp          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      agrave          aacute          acircumflex     atilde          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      adiaeresis      aring           ae              ccedilla        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      egrave          eacute          ecircumflex     ediaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      igrave          iacute          icircumflex     idiaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      eth             ntilde          ograve          oacute          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      ocircumflex     otilde          odiaeresis      division        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      oslash          ugrave          uacute          ucircumflex     */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      udiaeresis      yacute          thorn           ydiaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
];

const Tspttable =	/* ESC FS (^\) special point plot */
[
/*	NUL		SOH		STX		ETX	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	EOT		ENQ		ACK		BEL	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_BEL,
/*	BS		HT		NL		VT	*/
CASE_BS,
CASE_TAB,
CASE_LF,
CASE_UP,
/*	NP		CR		SO		SI	*/
CASE_IGNORE,
CASE_CR,
CASE_IGNORE,
CASE_IGNORE,
/*	DLE		DC1		DC2		DC3	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	DC4		NAK		SYN		ETB	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*	CAN		EM		SUB		ESC	*/
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_ESC_STATE,
/*	FS		GS		RS		US	*/
CASE_PT_STATE,
CASE_PLT_STATE,
CASE_IPL_STATE,
CASE_ALP_STATE,
/*	SP		!		"		#	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	$		%		&		'	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	(		)		*		+	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	,		-		.		/	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	0		1		2		3	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	4		5		6		7	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	8		9		:		;	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	<		=		>		?	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	@		A		B		C	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	D		E		F		G	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	H		I		J		K	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	L		M		N		O	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	P		Q		R		S	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	T		U		V		W	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	X		Y		Z		[	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	\		]		^		_	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	`		a		b		c	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	d		e		f		g	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	h		i		j		k	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	l		m		n		o	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	p		q		r		s	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	t		u		v		w	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	x		y		z		{	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*	|		}		~		DEL	*/
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
CASE_SPT_POINT,
/*      0x80            0x81            0x82            0x83    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x84            0x85            0x86            0x87    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x88            0x89            0x8a            0x8b    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x8c            0x8d            0x8e            0x8f    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x90            0x91            0x92            0x93    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x94            0x95            0x96            0x97    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x99            0x99            0x9a            0x9b    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      0x9c            0x9d            0x9e            0x9f    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      nobreakspace    exclamdown      cent            sterling        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      currency        yen             brokenbar       section         */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      diaeresis       copyright       ordfeminine     guillemotleft   */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      notsign         hyphen          registered      macron          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      degree          plusminus       twosuperior     threesuperior   */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      acute           mu              paragraph       periodcentered  */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      cedilla         onesuperior     masculine       guillemotright  */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      onequarter      onehalf         threequarters   questiondown    */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Agrave          Aacute          Acircumflex     Atilde          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Adiaeresis      Aring           AE              Ccedilla        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Egrave          Eacute          Ecircumflex     Ediaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Igrave          Iacute          Icircumflex     Idiaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Eth             Ntilde          Ograve          Oacute          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Ocircumflex     Otilde          Odiaeresis      multiply        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Ooblique        Ugrave          Uacute          Ucircumflex     */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      Udiaeresis      Yacute          Thorn           ssharp          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      agrave          aacute          acircumflex     atilde          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      adiaeresis      aring           ae              ccedilla        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      egrave          eacute          ecircumflex     ediaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      igrave          iacute          icircumflex     idiaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      eth             ntilde          ograve          oacute          */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      ocircumflex     otilde          odiaeresis      division        */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      oslash          ugrave          uacute          ucircumflex     */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
/*      udiaeresis      yacute          thorn           ydiaeresis      */
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
CASE_IGNORE,
];
const EXTRABITS	=0xf;
const FIVEBITS	=0x1f;
const HIBITS		= (FIVEBITS << SHIFTHI);
const LOBITS		= (FIVEBITS << SHIFTLO);
const SHIFTHI		=7;
const SHIFTLO	=	2;
const TWOBITS		=3;
const TRACE = (X) => { logger.log(X); }

const getpoint = (cmd_array, vec_pt) => {
    //cmd_array is an array of chars
    let e=0;
    let lo_y = 0;
    let x = vec_pt.x=0;
    let y = vec_pt.y=0;
    while (cmd_array.length > 0) {
      const c =  cmd_array.shift();
      if (c < 32) {	/* control character 32 is space*/
          cmd_array.unshift(c);
          return false;
      }
     ;
      if (c < 64) {		/* Hi X or Hi Y */
        if (lo_y) {		/* seen a Lo Y, so this must be Hi X */
          x &= ~HIBITS;
          x |= (c & FIVEBITS) << SHIFTHI;
          continue;
        }
        /* else Hi Y */
        y &= ~HIBITS;
        y |= (c & FIVEBITS) << SHIFTHI;
        continue;
      }
      if (c < 96) {		/* Lo X */
        x &= ~LOBITS;
        x |= (c & FIVEBITS) << SHIFTLO;
        vec_pt.y = y;
        vec_pt.x = x;
        return true;	/* OK */
      }
      /* else Lo Y */
      if (lo_y) {		/* seen a Lo Y, so other must be extra bits */
          e = (y >> SHIFTLO) & EXTRABITS;
          x &= ~TWOBITS;
          x |= e & TWOBITS;
          y &= ~TWOBITS;
          y |= (e >> SHIFTLO) & TWOBITS;
      }
      y &= ~LOBITS;
      y |= (c & FIVEBITS) << SHIFTLO;
      lo_y++;
    }
    return false;
};


const tek_us_map2 = ";)f{+Z*kc)Y,cm*Eag+Ona,_)kxXf{+Z,g}2K`{QexScs3EKdoPcmPogPhhSieRnaT+l|P`yPd{SnTW,heYmg[lg\ad[+kwVcsVnmTajU*k}SlsVbq2OfuId{HbI+fdFiFikDeo1^cs\jtXlyQ,dcQffRiOknQdrWi|Vn~Xd}\n~2@-kbHmaJ,k|Hg}K)fp8DokF`hFgm7]ok]gg](XfVmwTQeyNlnLehHofIbcGn`BkaA'i~@c}6[i~Zk{Ul}R(iaQhaOlcLakFepFotJhxJ`}Lf|MazNk{Oh~O)cbOeRbeVlk[ow[m|Zj}\l_nn7M`eObkSckUlnXfm[io\lq8@fpD/ml%_`o&@ml%_`o&ChpCimB`oCdkCijBdkCmfElfCgbChaFe`EdbCmfBaiEmfE-et'_nm^isEhs&]arQksOmrHluFdw@nu%YlxU.aUcdRodOkhLjhJmiHboJkjIekKgqLfqJetKdtOkvLmuK/hdLniJhpLkpLgkRlf[]id_`c&@ge@cc@mcBf`A.m~%_/f`^.a{ZnxYhy]iyZ`{[i&BB/aB.`~Cc~@ez%_jy&Aau%_fw^et\`x]lu[jvYgtXdt[`r[et\or]lu&@hvCb~D/iaHnfGliFniDekEoiFblGnoG`oFisEdtFbc(I-et'_(jl7JemK`zOcwRhxU)a`W(gX)g]m]`h8FokFbkJnhJleRobR(c}OmzQb}SdyWgyZ`w]ku9@cq@q8]dvWhuWko]jo9Aan8_em9B`kChl@dj@ki@fj8^gmZdmZak\fh9AehBofCjdAnf8^gh]ZhiZfhXhgZ]ge]kd9@bcAocCgeCidH'~K(c`I'j~Jl}Iiu7\dn6Gol5[fs6EowG(iaQ'b}Si{W~Zb}\(c`7AkaAacEbcGofIehHjlJdy9InzLirKhoIaiHgjFlnFntGhuIdyIh{NixMh{N,ojN`sNjJ-ie:B,`~C{Cnv9^as_kh]+f{^`y:@nv9U,dfQjeOojN(g(H*k}Tcv)\kcY)n*T'huK(a(CgH$iy,Z'ac-@o`.L%i|KkyOmxTdzUaxWmuWgt]`u/@nrAgtCetHgqIcoIenKhpOkmRcoTkmTalVenVipYm\lo]km]ek0BgnFfnJipMaoPhpTnlXjj^di1@E$lEngIodH#kKd}NiwMhnKkhK`dHjbI\"o|0Zn^cZ#ad\faXmaV\"`Wf{XayVcyTjtRbjAnjAapKnpJmDcpCjnAcp@om@in/_eo\am\el_kk]lj0@mh/\hkZajYdgZceWggW`eWneSgdR!nS\"i`N!nPb|P`|RovOfuMexNguLxIitKduOcsOfmMleO mQoRk}Rn|SM`IbD!k`@nb.^ob[ceXmeTanQiqNduOb|MmH\"aeEkiA`mAit-]jt\e{ZbV#j`SmaTgaRmdQheOdfGmgCgfAef,]\"bYo|XdxUoyPa|Om|Lg~JlG#ff+_ik]hq^kyYb~T$jhKnjHapFbrCuCp,YiyZ&fw5YhsX`rUhmUoi4Pcf2\i_hm_jm]`o_gn_lr3Bft@wC`xEd|Em}Do}EdE'ocEiaGmc[ig[mf4Abl5Yhp6X`lXofRO`cLkdJaG&gGaz@fw5Y*{-Vj},\,`s-Akn0@hh/]ec0B+aB`b@*l|@izBas/_nn0Aio/_`s]bvU`vOhtL`yFf{-V&eb6NnfKbiEdkDloGnuPax7EmuEgwFcrIetZbf8Me`H%`{FfzDlxFivEftAgn7]mo\al\kjXhhXmgTbdSgfOibQoaR$n~P%d`LffJkhFcoCip@ft6\jv\b{V`~R&ebN+jk:U`hWneUkfTdiTfiRedS`bNknK`pQikSjkU)`t8Ijl6_*`vXo|7AfxB+hc8]*m9Bg{CmyHhtFjqDfjDgjFjcL)i}He{EBhx@`t8I,dx'ZcsTdoTkkW+meMg~$O,i`NknOavTn{Y-am%@luDa{Ec{F.fcGldIhhIffJgfOodOlaU-xUmuZlu&FmrHcrThs]mr'BisEnm^ld(C,n{'[dxZ&oo0]%jj^nlXhpTjpRaoPipMfnJgnFfkAkm/]lo]dnZipYboXlUooThmRfqMenKcoIbrGetHgtCnrA`u@gt.]muWdzUmxTkyOm{Ni|K'o`L`c-AolA`i/]ni0[&oo](kr5[`tXkrUotM`zJgyD*ji4_fj5QokShXejZki[fgYnh\eg6@ckJepN`vX)j}\a|Zgv[ejZbeVcbO(h~Ok{OazN`}LhxJotJmqIepFgsAiu@kr5[,er-N`sA.fkEbg/X-axY`m],o{]`v0@kn@cp.Xer-N'nq9Rm}Ki~KnqRmq7Ciu\h~9Ij{Ji{KevMbzJcwKjxGcwIdvIcwFjuGiuEfsDjrAot@w@mw8_hu9@jrApAoqFgsIirKmoKgnKfnJnqL`tNmqPdnQmiMjjLkgKigHaiHkgF`iFdkFoiCjgDfh8^mf_lf9C`fCbfGocFmcEl`F&gC'ia8_m`_&j~9Ak~F'``F&fG'iaH&dI'jaJ&eKh{IozFd|Fgy@az8_`x9@jv8^hv]fy[iv\`u]ooWliWalVkgTbfMet7ZcrIgwFmuEaxEnu6PloGhm5U`rUgtXox[az6@gG'kdJbcMofOnfSclU`lXhpXmq7C*nn9RilSlkQnnRgpTcsWvZ]y:Ek}Hn|IgxEhwHf{Ik}No|NjqAaq9_cv:Eer9_mVkoWcnTgpT{7UfxBo|A+`hLjkJmmHiqHmsNguXns[gu]hw8F`|Ih}L,kbIecKieKgfI`dIagHkwRo{Wj9J`sNinMjeOkeQ+bvU*k}WizYexVrVfrUguT{C+a@ic8\*g{7U&ai*D'huKm,Uol-A`cA$bp,Ycu+BdqDet*JglHhn)\&ai*D)bt9RemPgmNcqNnqLaqK`tFcwCf{D*jcLgjFbkDjqDmyHguTosTlkQejSnkU`hW)W*icV)oyTlyTbtR,fl:OObdUcaTj`R+o|N`y@f{9^,kh]iw_`{:C~C-f`AbjAglE,flO'mt'E)hx%XkzX+do&F*k}(T'gs@kp']ctWjrUkgTgbT&eS'mtE*ae,Zj}\`y/FnsM`vOduWgr]io_an0BlhCobF)`FcFgyIonIjfLm`P`/Njc-SevTkx,X*aeZ,lg)_ie^agUngTjeRogNjeLmgJamJbpFdxEa~D-d`B,k|(\o~Z-ad\md^bj]mr)Ar(^ft]et\hW.bdR`gTcoQ/baU.`u*So,Afk-E,na,_la^ag+Ocm*EecDfi@lg)_(f0U)bbOoeNjfLmkKgm2BmhG(eGjxLotQgmSlnYjlZciYncWfbWc`Y'm}^hx3EjrFdqEllHclKkgKmcJgeHiaGncFccEn`F&o}Em}Dh{EfyCox2Y'a`^db\b`0[(q[nqXhxT~WfU$ei2PnjOojQfoRnpTfqTopQgqQdtVfwRkvSySoxQa{SjRl~Q%hbQjeRdfQjhRmgPdiQihPjjOimPjmRorQgtSmuSivUgwSdzVl{Y&d`Y%jZ&haYjd]cf\eh3[cf\$hn\#dr_grYnsWpQhqPjnNinLlvHj|Ic{2KkK$jbLhbNkeNagMeiP,hh/]om0@`v@o{/]-`m]axY.`aZbgXcg0QkmQmlVkbWca]d`1C-`~C.baI-hQe}PSkyTj|XezYdw_w2Ba{GcxHlxQkvSewXbmFefA,i|1VdrWlmQjhOffRdcQ+lyQjtXcs\eo^fi2FicGea0B,cBhh/]-dc4GheSe`R,hV-ca[,i|]cy5Aex@ay4XfuWxTcyMbvKduDfrCkn3_`p_ns4@bs3]eo[ms[cpYndTbdTieRhRhhPcmPdoPapLcsKosBfx2R`{Qo{N-laVib[je3@bjC`jEamGinJfoNnmNbjIheHjeFaaGheKfcIndNfcQ,a~Ul~Ye}[b~]e}^j4@-dcG+`5Md{MkzJeuIhtGmpFomG`mJapLfuNhwSlvUmsWce[*l|[bYh}XayWlvUdrUjlQi4_dgDhqJbyK+eaIcjDnmEdrD`yGi}F,jbHadLjhN`NldPi`OgcPiPikR`mVcpSasUjtWfr_`p5AmJihLlgJ+`Mh;HegDbhFgiE`hHch:_le\hf\fi]ch_lm\nm[bhXlhWjkUikS`pQbj9UnvUo|:N,j`RcaT+o|Wb|UhwTfuUavYbs[kqZjn]hn_bp;CsCfu@duBrEcmEomBcj:\lm\)aq7Whx9@cbFkcN({Nh{NeMnzLowFixEozFd|Fk{CgCc}CeBa}Bj~8^)c`]ab_kc]ob9@me8_ae\lh]kl]fm[`q]mq_lt9@ju8^lt]mq\gpZioYemYanVlkZbkX`hZbhXeXl`Z(h~]m}\)b`X(}[`}]jx^mz\bz[j{XozWe|Vj{Un}SmzQg|O)c`OjfSdgRhfOnhJbkJokFjoDbqDmq7_io\fm[cnXmnWckUbkS`eOnnMaqW-b~;Lc~QaxSjvTgwV`uYarXeq[lmYknVcmVbmTnjTojQgQihPePlgNbgLkeKndImaJjbFfcF`dHcgEecD,}Dh|EjyCezAa{Ajw@dx:_kw\os\bv[itYkqWapYdoWjeUheTmjP-glEHoHdoKgqHfzLl~K.jhLoxQlxT`uWox\ky\dz_ou;E-b~L#iw1Md}NhK$ecJodHdiHlEhE%d`2Q$l~QjRk|Qa{SoxQkvSjvRdtVbrTgqQapSeqUbpTfoRojQbjOdiQefMhbNjbLe`M#kKc{Kh|3Hn{IjtIlmMfoFopBfo@dl2_nj3@F`mHamJelJomKglKiHmgLkkMlmSmjRgiSbgQ`gPdcM\"nNj}Qk}Sn|Tc|VhzVjzTfxTlySkwPjzQm|Oe~LJ#j`IF\"o|Ea|GbyCl|Bf{@m|2^e{^byZizUnR#i`P\"oN#naLadMgcHieGfcCgaE\"lB#j`1]cdQjbI`dHglKdrKiwM'ci4SmfAig3[mc[dbHgeHhdKclKmlJkpKgqMfnTjpTntTgvYazXi~[^c}_(`_'g4B`}G(kaJ'gM(m`OidOjdQbfQebUncWdhYem]aq]fs5EntElwDfyE`zJjxKotMkrUes]hu6AepFakFlcLhaOiaQ'g|LowGfsEirCjpBbl5Yci4S(ev0VnqXbq['ni[`i/]li.Ucl-O)jcSm`/Nda0Q(h~TfUd|WhxTevV*d{2HfuIanSilSgjVceVj`T)h}Qo|KdyKmtMlnKjlFmhGgmBmk0KonIgyIcF`F*meElhCanBms/_iz0Bl|@+`b@ic2G*bId{H)ct5A(lwDfsEep@aq4]biZigXncWebUmcRbfQidO'gM(haJ'`}G(c`3_'`}_i~[e|[g|Ym}X(bcZfZ`f\cn_hr_ku\i~^*neZdd_g4Dfj_)ct5Aoe2EjlFlnKevMo|K*j`TceV`kVbqOls3VnVneZ(az^ku\cn_`f\kdY'~Ym}Xg|YeyXgvYntToqSjpTdnSgqMkpKalJkmHllHdqElwEzBf|2](jaWncWjlZlnYhoVgmSanSotQeG)oeE,i'_-mg(Bnm'^et_/bc(IaU.gnQldTbdR-oxZet\mr^ar)Aj(^bj]og\md^ad\,o~Zk|\-d`)B,a~DdxEmsGkqEinGamJmgJjeLogNjeRngTagUie^fi*@ecD*cv)\+me'M,keTkWmmVdoTcsTjwXby[i_#o~6Gc~5U$ffQmrO`xPezRo~P%mdL&gkAlo6GhjDmfInfK%`~Rb{VcxXjv\ft\ip7@boDkhFdcL$hLa~Qo{Ob{MezN`xLnuMetKgtLmpKopIcmImmHojIikKcjIjeJndGefCcdA#e}C@$f`6_#o~Ge}7C$jeBgfCmdK#l~LmsQlgXfc[\"c|]dg8ImeK!nMmnNfpM`kLggLedKcbFk`@ab7_ed_mb8B`eCne7^ilZanWemTonRvOgxLe~KlLmHo|Im|H\"j`DfBeg@ohAjAknCmpCknAq6^do^in7@jk6_nm\s\`y^m]n\#da^ieZgfUfiSojOlmOdoLrJjtEit@kq5^bp_\dlXbmVkkU`jPflNinOljPglPeoOdrJkqMdrMasIhtJguGhtGjtHfrHnv4\v5BdxAfx4\ov[itRmvUfxTcvSfxQlsP`sMeuOkyM|Jo~J$dc5S#c~U$f`6_#d}7Ae}C)dg8RjfSddRjfPdgRaq9Bhx@e{BEctCbqGckIggNahMbeLkcNcbFaqB+mbVbjUkn:KobN*H+i`G*k}@d~@jz9^cyZovWexVizY+mbV'gq+Mhu*K)nTev-T'clOgq+M)fm$SpSjoVrShrR`nRfmPioNesLkrJevLgvLjxK*neE`hGfuH`|G+h`DgdDflKjnK`vOjzMg~Odo&F)hx%X&e'SftUnoXdkQncOfbL%h|L`xNluLez&Ea~Ef}D&acEciCis%\`uXeyW`}O'kdIeh$]`l[jp\ev]lw[g|[(ebWmkTioQltR`wUlzUo}O)daO`hOokOlkRmhQaeTceUokRfmS$j2Ch1E%diE@jj0^&bl^'`[gb2\a`^&f|]oxYfy3C`xEcuBft@lrBkm2_`o_jm]ll_hg_of\c\`aY%jZ&d`Y%`{YgwSmuUSrSorQhmQolQjmOjOlgQjhRdfQfcRhbQd`Q$jC'lc*H$hn)\mr(\%ar'HouI`xN{Nh|L&fbLeePclQjpXlzT'`TgbTkgTesVfsXjp^gs(@(haC'u*KlcH#gz4DfrC`s3_$hn\&cf\dh\gk5A%baN$o~P{PezRmrOffQdcS#o~4Jk|JyMeuOrLlpGnpEfrHitFgzDitF jd DnjDjdDkdJ7m}?Un}[jw[n}[4w ACD/2000\n:DAIPAC602:DAC\n)";
const imtest_pxi = " ` @ `?_ `?_8m?_8m?_8m @8m @ ` @!r#D(0,0) ` @8m?_ `?_8m @,p @";

const tek_us_map = imtest_pxi;

class SVGTesting extends Component {
  constructor(props,context) {
    super(props,context);
    this.vector_drawing_time = 2.8 // misseconds for each vector...christ thats slow
    this.numCols = 35;
    this.numRows = 74;
    this.screen_width = 1024;
    this.screen_height = 780;  // side note, origin is lower left
    this.state = {
      lines : [],
      vec_pt: { x:0, y:0 },
      cursor: { x:0, y:0 },
      last_draw: {x :0, y:0 },
      path: "",
      pen: PENUP,
      margin: MARGIN1,
      linetype: 0,
      text_list: [], // array of chars to print
      points: [],
      font_size: tek_char_sizes[0],
      curstate :Talptable,
      Tparsestate : Talptable
    }
  }



  Tekparse(count_to_process = -1)
  {
    const out_point = pt => pt ? "( " + pt.x + ", " + pt.y + " )" : "null";
      let TekGIN =  this.state.TekGIN;
      let margin = this.state.margin;
      let Tparsestate = this.state.Tparsestate;
      let curstate = this.state.curstate;
      let cursor = this.state.cursor;
      let last_draw = this.state.last_draw;
      let pen = this.state.pen;
      let vec_pt = this.state.vec_pt;
      let path = this.state.path;
      let text_list = this.state.text_list;
      let points = this.state.points;
      let t = this.state.font_size;
      const TekGINoff = ()=> {
        TRACE(("TekGINoff\n"));
        TekGIN = false;
      };

      const TCursorBack =()=>
      {
          if (((margin == MARGIN1) && (cursor.x < 0)) || ((margin == MARGIN2) && (cursor.x < TEKWIDTH / 2))) {
            let l = cursor.y  + (t.pix_height - 1) / (t.pix_height + 1);
            if (l >= t.rows) {
              margin = !margin;
                l = 0;
            }
            cursor.x = (t.cols- 1) * t.pix_width;
            cursor.y = l * t.pix_height;
          }
      };
      const TCursorForward =()=>
      {
        if ((cursor.x += t.pixel_width) > TEKWIDTH) {
            let l = (cursor.y / t.pix_height - 1);
            if (l < 0) {
                margin = !margin;
                l = t.rows - 1;
            }
          cursor.y = l * t.pixel_height;
          cursor.x = margin == MARGIN1 ? 0 : TEKWIDTH / 2;
        }
      };
      const TCursorUp =()=>
      {
        let l = (cursor.y + (t.pix_height -1)) / t.pix_height + 1
        if(l >= t.rows) {
            l=0;
            margin = !margin;
            if (margin != MARGIN1) {
              if (cursor.x < TEKWIDTH / 2)
                 cursor.x += TEKWIDTH / 2;
          } else if (cursor.x >= TEKWIDTH / 2)
            cursor.x -= TEKWIDTH / 2;
          }
            cursor.y = l * t.pix_height;
      };
      const TCursorDown =()=>
      {
          let l = (cursor.y / t.pix_height )- 1;
          if(l  < 0) {
            l = t.rows - 1;
                margin = !margin;
              if (margin!= MARGIN1) {
                if (cursor.x < TEKWIDTH / 2)
                  cursor.x += TEKWIDTH / 2;
            } else if (cursor.x >= TEKWIDTH / 2)
            cursor.x-= TEKWIDTH / 2;
          }
          cursor.y = l * t.pix_height;
      };
      const TekMove = (x,y) => {
        cursor.x = x;
        cursor.y = y;
        TekDrawPoint(x,y);
      //  path += "M " + cursor.x + " " + cursor.y + " "; // need a move too
      };
      const TekDraw = (x,y) => {
        if(last_draw.x != cursor.x || last_draw.y != cursor.y){
          path += "M " + cursor.x + " " + cursor.y + " "; // need a move too
          cursor.x = x;
          cursor.y = y;
        }
        path += "L " + x + " " + y + " ";
        last_draw.x = x;
        last_draw.x = y;
        TekDrawPoint(x,y);
      };
      const TekDrawPoint = (x,y) => {
        points.push({x:x, y:y});

      }
      const TekClear = () => {
        path = ""; // no path, no drawing.  Be sure to remember we have to have different paths for different dot types
        text_list = [];
        points = [];
      };
      const TekPage =() =>{

        TRACE(("TekPage\n"));
        TekClear();
        cursor.x = 0;
        cursor.y = TEKHOME;
        margin = MARGIN1;

      Tparsestate = curstate = Talptable;		/* Tek Alpha mode */
      }
      let cmd_array = this.cmd;
      while ((count_to_process == -1 || count_to_process > 0 ) && cmd_array.length > 0) {
        if(count_to_process > 0)
          count_to_process--;
        let c = cmd_array.shift()
    /*
    * The parsing tables all have 256 entries.  If we're supporting
    * wide characters, we handle them by treating them the same as
    * printing characters.
    */
        const nextstate = Tparsestate[c];
        TRACE(("Tekparse " + String.fromCharCode(c) + "(" + c + " ) >= "+  nextstate));

    switch (nextstate) {
      case CASE_REPORT:
        TRACE(("case: report address"));
        /*
          if (TekGIN) {
             TekGINoff(tw);
             TekEnqMouse(tw, 0);
          } else {
            c = 064;	// has hard copy unit
            if (margin == MARGIN2)
              c |= 02;
            TekEnq(tw, c, tekscr->cur_X, tekscr->cur_Y);
          }
          TekRecord->ptr[-1] = ANSI_NAK;	// remove from recording
          */
          Tparsestate = curstate;
          break;

      case CASE_VT_MODE:
          TRACE(("case: special return to vt102 mode\n"));
          Tparsestate = curstate;
      //   TekRecord->ptr[-1] = ANSI_NAK;	//remove from recording
       //   FlushLog();
          return;

      case CASE_SPT_STATE:
          TRACE("case: Enter Special Point Plot mode");
          if (TekGIN)
             this.TekGINoff();
          Tparsestate = curstate = Tspttable;
          break;

      case CASE_GIN:
        TRACE(("case: Do Tek GIN mode"));
        /*

          tekscr->TekGIN = &TekRecord->ptr[-1];
          // Set cross-hair cursor raster array
          if ((GINcursor =
        make_colored_cursor(XC_tcross,
                T_COLOR(screen, MOUSE_FG),
                T_COLOR(screen, MOUSE_BG))) != 0) {
        XDefineCursor(XtDisplay(tw), TWindow(tekscr),
                GINcursor);
          }
          */
          Tparsestate = Tbyptable;
          break;

      case CASE_BEL:
          TRACE(("case: BEL\n"));
          /*
          if (tekscr->TekGIN)
        TekGINoff(tw);
          if (!tekRefreshList)
        Bell(tw->vt, XkbBI_TerminalBell, 0);
        */
          Tparsestate = curstate;	/* clear bypass condition */
          break;

      case CASE_BS:
          TRACE(("case: BS\n"));
          if (TekGIN)
            TekGINoff();
          Tparsestate = curstate;	/* clear bypass condition */
          TCursorBack();
          break;

      case CASE_PT_STATE:
          TRACE("case: Enter Tek Point Plot mode\n");
          if (TekGIN)
            TekGINoff();
          Tparsestate = curstate = Tpttable;
          break;

      case CASE_PLT_STATE:

          if (TekGIN)
            TekGINoff();
          Tparsestate = curstate = Tplttable;
          if ((c = cmd_array.shift()) == ANSI_BEL)
            pen = PENDOWN;
          else {
            cmd_array.unshift(c);
            pen = PENUP;
          }
          TRACE("case: Enter Tek Plot mode(" + pen == PENUP ? "UP" : "DOWN" + ")");
          break;

      case CASE_TAB:
          TRACE(("case: HT\n"));
          if (TekGIN)
            TekGINoff();
          Tparsestate = curstate;	/* clear bypass condition */
          TCursorForward();
          break;

      case CASE_IPL_STATE:
          TRACE(("case: Enter Tek Incremental Plot mode\n"));
          if (TekGIN)
            TekGINoff();
          Tparsestate = curstate = Tipltable;
          break;

      case CASE_ALP_STATE:
          TRACE("case: Enter Tek Alpha mode from any other mode\n");
          if (TekGIN)
            TekGINoff();
          /* if in one of graphics states, move alpha cursor */
          Tparsestate = curstate = Talptable;
          break;

      case CASE_UP:
          TRACE(("case: cursor up\n"));
          if (TekGIN)
            TekGINoff();
          Tparsestate = curstate;	/* clear bypass condition */
          TCursorUp();
          break;

      case CASE_COPY:
          TRACE(("case: make copy\n"));
          if (TekGIN)
            TekGINoff();
         // TekCopy();
          Tparsestate = curstate;	/* clear bypass condition */
          break;

      case CASE_PAGE:
          TRACE(("case: Page Function\n"));

          if (TekGIN)
            TekGINoff();
         TekPage();	// clear bypass condition

          break;

      case CASE_BES_STATE:
          TRACE(("case: Byp: an escape char\n"));
          Tparsestate = Tbestable;
          break;

      case CASE_BYP_STATE:
          TRACE(("case: set bypass condition\n"));
          Tparsestate = Tbyptable;
          break;

      case CASE_IGNORE:
          TRACE(("case: Esc: totally ignore CR, ESC, LF, ~\n"));
          break;

      case CASE_ASCII:
          TRACE(("case: Select ASCII char set\n"));
          /* ignore for now */
          Tparsestate = curstate;
          break;

      case CASE_APL:
          TRACE(("case: Select APL char set\n"));
          /* ignore for now */
          Tparsestate = curstate;
          break;

      case CASE_CHAR_SIZE:
          TRACE(("case: character size selector\n"));
          t = tek_char_sizes[(c & 3)];
          Tparsestate = curstate;
          break;

      case CASE_BEAM_VEC:
          TRACE(("case: beam and vector selector\n"));
          /* only line types */
          c = (c & LINEMASK);
          if (c != linetype) {
            if (c <= TEKNUMLINES)
              linetype = c;
          }
          Tparsestate = curstate;
          break;

      case CASE_CURSTATE:
          Tparsestate = curstate;
          break;

      case CASE_PENUP:
          TRACE(("case: Ipl: PENUP\n"));
          pen = PENUP;
          break;

      case CASE_PENDOWN:
          TRACE(("case: Ipl: PENDOWN\n"));
          pen = PENDOWN;
          break;

      case CASE_IPL_POINT: {

          let x = cursor.x;
          let y = cursor.y;
          if (c & NORTH)
            y++;
          else if (c & SOUTH)
           y--;
          if (c & EAST)
            x++;
          else if (c & WEST)
            x--;
          if (pen == PENDOWN)
            TekDraw( x, y);
          else
            TekMove(x, y);
          TRACE("case: Ipl: point " + pen == PENUP ? "UP" : "DOWN" + ":" + out_point(cursor));
          break;
      }
      case CASE_PLT_VEC: {
          cmd_array.unshift(c);
            if (getpoint(cmd_array,vec_pt)) {
              if (pen == PENDOWN) {
                TekDraw( vec_pt.x, vec_pt.y);
            } else {
                TekMove( vec_pt.x, vec_pt.y);
            }
              pen = PENDOWN;
            }
            TRACE("case: Plt: vector " + (pen == PENUP ? "UP" : "DOWN") + ":" + out_point(vec_pt));
          }

          break;

      case CASE_PT_POINT: {

        cmd_array.unshift(c);
        if (getpoint(cmd_array,vec_pt)) {
         TekDrawPoint(vec_pt.x, vec_pt.y);
         TekMove(vec_pt.x, vec_pt.y);
          TekDraw( vec_pt.x, vec_pt.y);
        }
        TRACE("case: Pt: point " + (pen == PENUP ? "UP" : "DOWN" )+ ":" + out_point(vec_pt));
        break;
      }


      case CASE_SPT_POINT:{

        /* ignore intensity character in c */
     //   cmd_array.unshift(c);
        if (getpoint(cmd_array,vec_pt)) {
          TekDrawPoint(vec_pt.x, vec_pt.y);
          TekMove(vec_pt.x, vec_pt.y);
          TekDraw(vec_pt.x, vec_pt.y);
        }
        TRACE("case: Spt: point "+ pen == PENUP ? "UP" : "DOWN" + ":" + out_point(vec_pt));
        break;
      }


      case CASE_CR:
          TRACE(("case: CR\n"));
          if (TekGIN)
            TekGINoff();
            cursor.x = margin == MARGIN1 ? 0 : TEKWIDTH / 2;
          Tparsestate = curstate = Talptable;
          break;

      case CASE_ESC_STATE:
          TRACE(("case: ESC\n"));
          Tparsestate = Tesctable;
          break;

      case CASE_LF:
          TRACE(("case: LF\n"));
          if (TekGIN)
            TekGINoff();
          TCursorDown();
          break;

      case CASE_SP:
          TRACE(("case: SP\n"));
          TCursorForward();
          break;

      case CASE_PRINT:
          TRACE(("case: printable character\n"));
         // char ch = c;
          // hack for now
          text_list.push({ text: String.fromCharCode(c), x:cursor.x, y:cursor.y });
          TCursorForward();
          break;
      case CASE_OSC:
          /* FIXME:  someone should disentangle the input queues
          * of this code so that it can be state-driven.
          */
          TRACE(("case: do osc escape\n"));
          {
        /*
        * do_osc() can call TekExpose(), which calls TekRefresh(),
        * and sends us recurring here - don't do that...
        */
       /*
        static int nested;

        Char buf2[512];
        IChar c2;
        size_t len = 0;
        while ((c2 = input()) != ANSI_BEL) {
            if (!isprint((int) (c2 & 0x7f))
          || len + 2 >= (int) sizeof(buf2))
          break;
            buf2[len++] = (Char) c2;
        }
        buf2[len] = 0;
        if (!nested++) {
            if (c2 == ANSI_BEL)
          do_osc(tw->vt, buf2, len, ANSI_BEL);
        }
        --nested;
          }
          */
         //nooop
          Tparsestate = curstate;
          break;
        }
      }
    }
      TRACE("Path='" + path + "'");
    const new_state = {
      TekGIN: TekGIN,
      margin : margin,
      Tparsestate:Tparsestate,
      curstate:curstate,
      cursor:cursor,
      last_draw:last_draw,
      pen:pen,
      path: path,
      text_list:text_list,
      font_size : t,
      vec_pt: vec_pt,
    };
    this.setState(new_state);
    this.forceUpdate();
  }
  componentDidMount() {
    // Call this function so that it fetch first time right after mounting the component
    //this.addRandomLine();
    const { act, data } = useBackend(this.context);
    const test_data = data.test_data;
    this.cmd = [];
    for(let i =0; i < tek_us_map.length;i++){
      if(tek_us_map[i] >= 256)
        logger.log("Bad data " + i + " ugh");
      this.cmd.push(tek_us_map.charCodeAt(i));
   }
   this.cmd = test_data;
    this.Tekparse(1000);
    // set Interval
    this.working = false;
    this.interval = setInterval(this.addRandomLine.bind(this), 5000);
}
componentWillUnmount() {
  // Clear the interval right before component unmount
  clearInterval(this.interval);
}
  addRandomLine() {
    if(!this.working) {
      this.working = true;
      this.Tekparse(1000);
      this.working = false;
      this.forceUpdate();
    }

    /*
      let nlines = this.state.lines;
      nlines.push(random_line())
      this.setState({ lines: nlines });
      */
  }
  //      <svg viewBox="0 0 4096 4096">
  render() {
    const lines = this.state.lines;
         // lines.map(vec => <line x1={vec.start[0]} y1={vec.start[1]} x2={vec.end[0]} y2={vec.end[1]} stroke="url('#myGradient')" />)
    return (
      <svg viewBox="0 0 4096 4096" width="100%" height="100%">

         <rect width="100%" height="100%" fill="black"/>
         <g>
    <rect fill="#FFFFFF" stroke="#000" x="50" y="50" width="150" height="150" />
    <rect fill="#FFFFFF" stroke="#000" x="200" y="200" width="150" height="150" />
  </g>
         { this.state.points.map(pt => <circle cx={pt.x} cy={pt.y} r="10" fill="#FFFFFF" stroke="white" />)}
        <path d={this.state.path}  fill="none" stroke="greenyellow" />
        { this.state.text_list.map(pt => (
          <text x={pt.x} y={pt.y} fill="#FFFFFF" stroke="white">
            {pt.text}
            </text>))
        }
        <text x="200" y="200" fill="#FFFFFF" stroke="white" style="font: 100px serif">This is a test</text>
      </svg>
  );
}
};
/*
    <svg viewBox="0 0 340 333">
<defs>
    <linearGradient id="myGradient" gradientTransform="rotate(90)">
      <stop offset="0%"  stop-color="green" />
      <stop offset="97%"  stop-color="green" />
      <stop offset="99%" stop-color="white" />
    </linearGradient>

  </defs>


  <circle cx="5" cy="5" r="4" fill="url('#myGradient')" />
  <line x1="0" y1="80" x2="100" y2="20" stroke="url('#myGradient')"  />
  <path
   fill="none"
   stroke="url('#myGradient')"
   stroke-width="4"
    d="M66.039,133.545c0,0-21-57,18-67s49-4,65,8 s30,41,53,27s66,4,58,32s-5,44,18,57s22,46,0,45s-54-40-68-16s-40,88-83,48s11-61-11-80s-79-7-70-41 C46.039,146.545,53.039,128.545,66.039,133.545z"
  stroke-dasharray="988.00 988.00"
  stroke-dashoffset="344.92"
  />*/




export const TN3270 = (props, context) => {
  const { act, data } = useBackend(context);
  const {
    commands,
    screen
  } = data;

  // general header
  const header = [
    [ "goto", 1,1 ],
    [ "text", CELL_TURQUOISE,"Name: "],
    [ "field", CELL_READONLY|CELL_BLUE, "name", 20 ],
    [ "text", "Gender: "],
    [ "field", CELL_READONLY|CELL_BLUE, "gender", 10 ],
    [ "text", "Species: "],
    [ "field", CELL_READONLY|CELL_BLUE, "species", 10 ],
    [ "goto", 1,2 ],
    [ "text", "Rank: "],
    [ "field", CELL_READONLY|CELL_BLUE, "rank", 10 ],
    [ "text", "  ID: "],
    [ "field", CELL_READONLY|CELL_BLUE,"id", 10 ],
    [ "goto", 1,3 ],
    [ "text", "----------------------------------------------------------------" ],
    [ "goto", 8, 4 ], [ "text", "SPIDER ORDER FORM"],

    [ "goto", 2, 6 ],
    [ "text", "Have you cared for a spider before?"],
    [ "goto", 45, 6 ],
    [ "field", CELL_WHITE|CELL_REVERSE ,"spider_2", 3 ],
    [ "goto", 2, 7 ],
    [ "text", "Do you have plenty of spider food?"],
    [ "goto", 45, 7 ],
    [ "field", CELL_WHITE|CELL_REVERSE ,"spider_3", 3 ],
    [ "goto", 2, 8 ],
    [ "text", "Are you an idiot?"],
    [ "goto", 45, 8 ],
    [ "field", CELL_WHITE|CELL_REVERSE ,"spider_4", 3 ],
  ];
  /*
    [ "goto", 40, 10],
    [ "text", CELL_WHITE|CELL_BLINK|CELL_REVERSE, "\xA0" ],
  ];
*/
/*
<Box fillPositionedParent>
<RealTerminal numRows={24}  numCols={80} screen={0} screens={[ header ] }/>
</Box>
*/
  return (
    <Window
      width={1024}
      height={768}>
      <Window.Content>
          <Box fillPositionedParent>
           <SVGTesting />
          </Box>
      </Window.Content>
    </Window>
  );
};


