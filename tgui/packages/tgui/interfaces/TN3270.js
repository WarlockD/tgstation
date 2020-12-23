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
// cause I am lazy

/* global window, exports, define */

const re = {
    not_string: /[^s]/,
    not_bool: /[^t]/,
    not_type: /[^T]/,
    not_primitive: /[^v]/,
    number: /[diefg]/,
    numeric_arg: /[bcdiefguxX]/,
    json: /[j]/,
    not_json: /[^j]/,
    text: /^[^\x25]+/,
    modulo: /^\x25{2}/,
    placeholder: /^\x25(?:([1-9]\d*)\$|\(([^)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijostTuvxX])/,
    key: /^([a-z_][a-z_\d]*)/i,
    key_access: /^\.([a-z_][a-z_\d]*)/i,
    index_access: /^\[(\d+)\]/,
    sign: /^[+-]/
}

const sprintf = key => {
    // `arguments` is not an array, but should be fine for this call
    return sprintf_format(sprintf_parse(key), arguments)
};

const vsprintf = (fmt, argv) => {
    return sprintf.apply(null, [fmt].concat(argv || []))
};

const sprintf_format = (parse_tree, argv) => {
    var cursor = 1, tree_length = parse_tree.length, arg, output = '', i, k, ph, pad, pad_character, pad_length, is_positive, sign
    for (i = 0; i < tree_length; i++) {
        if (typeof parse_tree[i] === 'string') {
            output += parse_tree[i]
        }
        else if (typeof parse_tree[i] === 'object') {
            ph = parse_tree[i] // convenience purposes only
            if (ph.keys) { // keyword argument
                arg = argv[cursor]
                for (k = 0; k < ph.keys.length; k++) {
                    if (arg == undefined) {
                        throw new Error(sprintf('[sprintf] Cannot access property "%s" of undefined value "%s"', ph.keys[k], ph.keys[k-1]))
                    }
                    arg = arg[ph.keys[k]]
                }
            }
            else if (ph.param_no) { // positional argument (explicit)
                arg = argv[ph.param_no]
            }
            else { // positional argument (implicit)
                arg = argv[cursor++]
            }

            if (re.not_type.test(ph.type) && re.not_primitive.test(ph.type) && arg instanceof Function) {
                arg = arg()
            }

            if (re.numeric_arg.test(ph.type) && (typeof arg !== 'number' && isNaN(arg))) {
                throw new TypeError(sprintf('[sprintf] expecting number but found %T', arg))
            }

            if (re.number.test(ph.type)) {
                is_positive = arg >= 0
            }

            switch (ph.type) {
                case 'b':
                    arg = parseInt(arg, 10).toString(2)
                    break
                case 'c':
                    arg = String.fromCharCode(parseInt(arg, 10))
                    break
                case 'd':
                case 'i':
                    arg = parseInt(arg, 10)
                    break
                case 'j':
                    arg = JSON.stringify(arg, null, ph.width ? parseInt(ph.width) : 0)
                    break
                case 'e':
                    arg = ph.precision ? parseFloat(arg).toExponential(ph.precision) : parseFloat(arg).toExponential()
                    break
                case 'f':
                    arg = ph.precision ? parseFloat(arg).toFixed(ph.precision) : parseFloat(arg)
                    break
                case 'g':
                    arg = ph.precision ? String(Number(arg.toPrecision(ph.precision))) : parseFloat(arg)
                    break
                case 'o':
                    arg = (parseInt(arg, 10) >>> 0).toString(8)
                    break
                case 's':
                    arg = String(arg)
                    arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                    break
                case 't':
                    arg = String(!!arg)
                    arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                    break
                case 'T':
                    arg = Object.prototype.toString.call(arg).slice(8, -1).toLowerCase()
                    arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                    break
                case 'u':
                    arg = parseInt(arg, 10) >>> 0
                    break
                case 'v':
                    arg = arg.valueOf()
                    arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                    break
                case 'x':
                    arg = (parseInt(arg, 10) >>> 0).toString(16)
                    break
                case 'X':
                    arg = (parseInt(arg, 10) >>> 0).toString(16).toUpperCase()
                    break
            }
            if (re.json.test(ph.type)) {
                output += arg
            }
            else {
                if (re.number.test(ph.type) && (!is_positive || ph.sign)) {
                    sign = is_positive ? '+' : '-'
                    arg = arg.toString().replace(re.sign, '')
                }
                else {
                    sign = ''
                }
                pad_character = ph.pad_char ? ph.pad_char === '0' ? '0' : ph.pad_char.charAt(1) : ' '
                pad_length = ph.width - (sign + arg).length
                pad = ph.width ? (pad_length > 0 ? pad_character.repeat(pad_length) : '') : ''
                output += ph.align ? sign + arg + pad : (pad_character === '0' ? sign + pad + arg : pad + sign + arg)
            }
        }
    }
    return output
}

let sprintf_cache = Object.create(null)

const sprintf_parse = fmt=> {
    if (sprintf_cache[fmt]) {
        return sprintf_cache[fmt]
    }

    let _fmt = fmt, match, parse_tree = [], arg_names = 0
    while (_fmt) {
        if ((match = re.text.exec(_fmt)) !== null) {
            parse_tree.push(match[0])
        }
        else if ((match = re.modulo.exec(_fmt)) !== null) {
            parse_tree.push('%')
        }
        else if ((match = re.placeholder.exec(_fmt)) !== null) {
            if (match[2]) {
                arg_names |= 1
                var field_list = [], replacement_field = match[2], field_match = []
                if ((field_match = re.key.exec(replacement_field)) !== null) {
                    field_list.push(field_match[1])
                    while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                        if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                            field_list.push(field_match[1])
                        }
                        else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                            field_list.push(field_match[1])
                        }
                        else {
                            throw new SyntaxError('[sprintf] failed to parse named argument key')
                        }
                    }
                }
                else {
                    throw new SyntaxError('[sprintf] failed to parse named argument key')
                }
                match[2] = field_list
            }
            else {
                arg_names |= 2
            }
            if (arg_names === 3) {
                throw new Error('[sprintf] mixing positional and named placeholders is not (yet) supported')
            }

            parse_tree.push(
                {
                    placeholder: match[0],
                    param_no:    match[1],
                    keys:        match[2],
                    sign:        match[3],
                    pad_char:    match[4],
                    align:       match[5],
                    width:       match[6],
                    precision:   match[7],
                    type:        match[8]
                }
            )
        }
        else {
            throw new SyntaxError('[sprintf] unexpected placeholder')
        }
        _fmt = _fmt.substring(match[0].length)
    }
    return sprintf_cache[fmt] = parse_tree
}
const printf = key => {
    // `arguments` is not an array, but should be fine for this call
    const str =  sprintf_format(sprintf_parse(key), arguments);
    logger.log(str);
}

/// tek 4010 testing

const STANDARD_FONT = "Monospace";
const STANDARD_FONT_SIZE = 18.0;
const APL_FONT = "APL385 Unicode";
const APL_FONT_SIZE = 20.0;

const SOLID = 1;
const DOTTED =2;
const DOTDASH =3;
const SHORTDASH =4;
const LONGDASH = 5;
let ltype;

let tube_doClearPersistent;
let windowWidth;
let windowHeight;

let argFull;
let  argTab1;
let argRaw;
let argAPL;
let argAutoClear;
let argKeepSize;
let argHideCursor;

let hDotsPerChar;
let vDotsPerChar;

let refresh_interval;           // after this time in msec next refresh is done
let refreshCount;

let showCursor;                 // set of cursor is shown (not set in graphics mode)
let isBrightSpot;               // set if there is currently a bright spot on the screen
let isGinMode;                  // set if GIN mode is active
let isGinSuppress;              // set if suppressing echoed chars in/after GIN.

let specialPlotMode;
let defocussed;
let intensity;
let aplMode;

let plotPointMode;
let writeThroughMode;

let tube_x0;
let tube_x2;
let tube_y0;
let tube_y2;

let pensize;

const DEBUG = true;



const ginCharacter= [0, 0, 0, 0, 0, 0];

// table for special plot point mode
// 4014 manual page F-9
const intensityTable  =[14,16,17,19,  20,22,23,25,  28,31,34,38,  41,33,47,50,
                        56,62,69,75,  81,88,94,100, 56,62,69,75,  81,88,96,100,
                         0, 1, 1, 1,   1, 1, 1, 2,   2, 2, 2, 2,   3, 3, 3, 3,
                         4, 4, 4, 5,   5, 5, 6, 6,   7, 8, 9,10,  11,12,12,13,
                        14,16,17,19,  20,22,23,25,  28,31,34,38,  41,44,47,50,
                        56,62,69,75,  81,88,94,100, 56,63,69,75,  81,88];

const tek4010_checkLimits = (cr, cr2)=>
/* check whether char is in visibel space */
{
        /* don't check here for leftmargin, graphics needs to write characters to the whole screen */
        if (tube_x0 < 0) tube_x0 = 0;

        if (tube_x0 > windowWidth - hDotsPerChar) {
                tube_x0 = leftmargin; tube_y0 -= vDotsPerChar;
        }
        if (tube_y0 < 4) { // new line at bottom of page
                tube_y0 = windowHeight - vDotsPerChar;
                if (leftmargin) leftmargin = 0;
                else leftmargin = windowWidth / 2;
                if (argAutoClear) {
                        leftmargin = 0;
                        tube_clearPersistent(cr,cr2);
                }
                /* check here for leftmargin */
                if (tube_x0 < leftmargin) tube_x0 = leftmargin;
        }
        if (tube_y0 > (windowHeight - vDotsPerChar)) tube_y0 = windowHeight - vDotsPerChar;
}

const tek4010_bell =()=>
{
        // bell function, delay 0.05 sec
        tube_u100ResetSeconds(1);
        usleep(50000);
        showCursor=0;
        todo = 0;
}

const sendCoordinates =()=>
{
        // send 4 coordinate bytes
        let x,y,ch;
        x = Math.trunc(tube_x0 / efactor);
        y = Math.trunc(tube_y0 / efactor);

        if (DEBUG) printf("sendCoordinates, x=%d, y=%d\n", x, y);

        ch = (x >> 5) + 0x20;
      //  putc(ch, putKeys);
        ginCharacter[4] = ch;       // save to check for echo
        ch = (x & 31) + 0x20;
     //   putc(ch,putKeys);
        ginCharacter[3] = ch;       // save to check for echo
        ch = (y >> 5) + 0x20;
     //   putc(ch, putKeys);
        ginCharacter[2] = ch;       // save to check for echo
        ch = (y & 31) + 0x20;
   //     putc(ch,putKeys);
        ginCharacter[1] = ch;       // save to check for echo
}

const enqMode =()=>
{
        // activated by sending ESC ENQ
        int status;
        status = 0x20;
        if (leftmargin == 0) status += 2;
        if (mode == 0) status += 4;
        putc(status,putKeys);           // send status byte
        sendCoordinates();
        putc(13, putKeys);              // cannot send a EOT here
}

const ginMode =(cr, cr2)=>
{
        // activated by sending ESC SUB
        if (DEBUG) printf("GIN, mode = %d, isGinMode = %d\n", mode, isGinMode);
        tube_crosshair(cr, cr2);
        mode = 60;
        todo = 0;
        showCursor = 0;
        isGinMode = 1;
}

const ginSend = ch =>
{
        // user has stoken a key during GIN mode
        if (DEBUG) printf("ginSend, ch = %d\n", ch);
        putc(ch,putKeys);           // user key stroke character
        ginCharacter[5] = ch;       // save to check for echo
        sendCoordinates();          // 4 characters of packed coordinates
        // cannot send a EOT here
        // wait 5 ms, then send CR.
        usleep(5000);
        putc(13,putKeys);           // cr
        ginCharacter[0] = 13;
        // prepare to suppress unwanted echoed characters.
        isGinSuppress = 6;
}

const tek4010_clicked =(x,y)=>
{
        if (DEBUG) printf("Clicked, mode = %d\n", mode);
        if (mode == 60) {
                tube_x0 = x;
                tube_y0 = y;
        }
}

const tek4010_escapeCodeHandler = (cr, cr2, ch)=>
// handle escape sequencies, see 4014 user manual, table page G-1
// codes identical for all modes are handled elsewhere
{
        if (DEBUG) printf("Escape %02X, savemode=%d\n",ch,savemode);
        switch (ch) {
                case 0: break; // ignore filler 0

                case 5: // ENQ: ask for status and position
                        enqMode();
                        mode = 0; break;
                case 6: break;

                case 8: // backspace during ESC
                        tube_x0 -= hDotsPerChar;
                        tek4010_checkLimits(cr, cr2);
                        mode = 0; break;
                case 9: // tab during ESC
                        if (argTab1)
                                tube_x0 += hDotsPerChar;
                        else
                                tube_x0 = tube_x0 - (tube_x0 % (8 * hDotsPerChar)) + 8 * hDotsPerChar;
                        tek4010_checkLimits(cr, cr2);
                        mode = 0; break;

                case 11:// VT during ESC, move one line up
                        tube_y0 += vDotsPerChar;
                        tek4010_checkLimits(cr, cr2);
                        mode = 0; break;
                case 12:// FF during ESC
                        if (!argKeepSize)
                                tube_changeCharacterSize(cr, cr2, 74, 35, efactor);
                        tube_clearPersistent(cr,cr2);
                        mode = 0; break;
                case 13:mode = 0; break;
                case 14: // SO  activate alternative char set
                        if (argAPL) {            // switch only of argAPL is set
                                aplMode = 1;
                                // printf("Setting APL mode to 1 from computer\n");
                        }
                        mode = 0;
                        todo = 0;
                        break;
                case 15: // SI  deactivate alternative char set
                        aplMode = 0;
                        mode = 0;
                        todo = 0;
                        // printf("Setting APL mode to 0 from computer\n");
                        break;

                case 23: system("scrot --focussed"); mode= 0; break;

                case 26: // sub
                        ginMode(cr, cr2);
                        break;

                // modes 27 and 29 - 31 are identical in all modes
                case 28: // record separator
                        if (DEBUG) printf("Special point plot mode, mode=%d\n",savemode);
                        mode = 50; // for the intensity/focus character
                        plotPointMode = 1;
                        specialPlotMode = 1;
                        double intensity = 1.0;
                        int defocussed = 0;
                        break;

                case '8': tube_changeCharacterSize(cr, cr2, 74, 35, efactor); mode = 0; break;
                case '9': tube_changeCharacterSize(cr, cr2, 81, 38, efactor * 0.9); mode = 0; break;
                case ':': tube_changeCharacterSize(cr, cr2, 121, 58, efactor * 0.65); mode = 0; break;
                case ';': tube_changeCharacterSize(cr, cr2, 133, 64, efactor * 0.55); mode = 0; break;

                case '[': printf("Ignoring ANSI escape sequence: [");
                          mode=31;
                          break;

                // normal mode
                case '`': ltype = SOLID;    writeThroughMode = 0; mode = savemode; break;
                case 'a': ltype = DOTTED;   writeThroughMode = 0; mode = savemode; break;
                case 'b': ltype = DOTDASH;  writeThroughMode = 0; mode = savemode; break;
                case 'c': ltype = SHORTDASH;writeThroughMode = 0; mode = savemode; break;
                case 'd': ltype = LONGDASH; writeThroughMode = 0; mode = savemode; break;
                case 'e': ltype = SOLID;    writeThroughMode = 0; mode = savemode; break;
                case 'f': ltype = SOLID;    writeThroughMode = 0; mode = savemode; break;
                case 'g': ltype = SOLID;    writeThroughMode = 0; mode = savemode; break;

                // defocussed mode
                case 'h':
                case 'i':
                case 'j':
                case 'k':
                case 'l':
                case 'm':
                case 'n':
                case 'o': if (DEBUG) printf("Defocussed mode ESC %c not supported, ignored\n", ch);
                          mode = 101;  break;

                // write-trough mode
                case 'p': ltype = SOLID;    writeThroughMode = 1; mode = 101; showCursor = 0; break;
                case 'q': ltype = DOTTED;   writeThroughMode = 1; mode = 101; showCursor = 0; break;
                case 'r': ltype = DOTDASH;  writeThroughMode = 1; mode = 101; showCursor = 0; break;
                case 's': ltype = SHORTDASH;writeThroughMode = 1; mode = 101; showCursor = 0; break;
                case 't': ltype = LONGDASH; writeThroughMode = 1; mode = 101; showCursor = 0; break;
                case 'u': ltype = SOLID;    writeThroughMode = 1; mode = 101; showCursor = 0; break;
                case 'v': ltype = SOLID;    writeThroughMode = 1; mode = 101; showCursor = 0; break;
                case 'w': ltype = SOLID;    writeThroughMode = 1; mode = 101; showCursor = 0; break;

                default:
                        printf("Ignoring escape code: 0x%02x\n",ch);
                        mode = 0;
                        break;
        }
}

const tek4010_checkReturnToAlpha = ch =>
// test for return to alpha character set
// see 4014 manual, page F-10, note 1
{
        if (ch == 27)
                savemode = mode;
        if ((ch==31) || (ch==13) || (ch==27) /*|| (ch==12)*/) {
                if (DEBUG && mode) printf("Going to alpha mode\n");
                mode = 0;
                showCursor = 0;
                //if (ch == 12) {
                //        tube_doClearPersistent = 1;
                //        todo = 0;
                //}
                if (ch == 27) {
                        mode = 30;
                        todo = 0;
                }
                plotPointMode = 0;
                specialPlotMode = 0;
                if (isGinMode && DEBUG)
                        printf("clearing isGinMode, char = %d\n", ch);
                isGinMode = 0;
                return 1;
        }
        else return 0;
}

const digit = ch =>
{
        return ((ch>='0') && (ch<='9'));
}

const tek4010_draw = (cr, cr2, first) =>
// draw onto the main window using cairo
// cr is used for persistent drawing, cr2 for temporary drawing

{
        let ch, tag;

        refreshCount++;

        if (first) {
                first = 0;
                efactor = windowWidth / 1024.0;
                refresh_interval = 30;
                tube_changeCharacterSize(cr, cr2, 74, 35, efactor);
                if (efactor > 0.8) pensize = efactor * 1.25;
                if (windowWidth != 1024) printf("Scaling: %0.3f\n", efactor / 4.0);
        }

        startPaintTime = tube_mSeconds(); // start to measure time for this draw operation

        showCursor = 1;
        isBrightSpot = 0;

        // clear the second surface
        tube_clearSecond(cr2);

        // clear persistent surface, if necessary
        if (tube_doClearPersistent) {
                tube_clearPersistent(cr,cr2);
                if (!argKeepSize)
                        tube_changeCharacterSize(cr, cr2, 74, 35, efactor);
        }

        if (aplMode)
                tube_setupPainting(cr, cr2, APL_FONT);
        else
                tube_setupPainting(cr, cr2, STANDARD_FONT);

        if (plotPointMode)
                todo = 100 * TODO;
        else if (writeThroughMode)
                todo = 8 * TODO;
        else if (mode == 0)
                todo = 4 * TODO;      // for text speed
        else
                todo = TODO;

        do {
                ch = tube_getInputChar();

                if (tube_isInput() == 0) {
                        todo = 0;
                }

                if (ch == -1) {
                        if ((mode == 0) && showCursor) tube_doCursor(cr2);
                        if (mode != 60) return;         // no char available, need to allow for updates
                }

		// Try suppressing GIN echoed characters here.
		if (isGinSuppress){
                        if (ch == 10) // additional line feed may be echoed if cr is typed
                                return;
                        if ((ch & 0x7F) == ginCharacter[isGinSuppress - 1]) {
                                if (DEBUG) printf( "isGinSuppress (%d): suppressing: %d\n",
                                        isGinSuppress, ch);
                                isGinSuppress --;
                                return;
                        }
                        else {
                                if (DEBUG) printf("isGinSuppress, characters are different (%d,%d)\n",
                                        ch & 0x7F, ginCharacter[isGinSuppress - 1]);
                                isGinSuppress = 0;
                        }
		}

                // if (aplMode) printf("Receiving character %d from host\n", ch);

                if (DEBUG) {
                        printf("mode=%d, ch code %02X",mode,ch);
                        if ((ch>0x20)&&(ch<=0x7E)) printf(" (%c)",ch);
                        printf("\n");
                }

                if (tek4010_checkReturnToAlpha(ch)) {
                        todo = todo - 4;
                        goto endDo;
                }

                // the following chars are identical in all modes (with exception: 13,28)
                // see 4014 user manual, table on page G1 ff

                switch (ch) {
                        case 7:         tek4010_bell();
                                        goto endDo;
                        case 10:        // new line
                                        tube_y0 -= vDotsPerChar;
                                        if (!argRaw) tube_x0 = leftmargin;
                                        tek4010_checkLimits(cr, cr2);
                                        goto endDo;
                        case 13:        // return
                                        if (mode != 30) { // special handling in ESC mode
                                                mode = 0; tube_x0 = leftmargin;
                                                goto endDo;
                                        }
                                        break;
                        case 27:        // escape code, all modes
                                        savemode = mode;
                                        mode = 30;
                                        goto endDo;
                        case 28:        // file separator  >> point plot mode
                                        if (mode != 30) { // special handling in ESC mode
                                                mode = 5;
                                                plotPointMode= 1;
                                                goto endDo;
                                        }
                                        break;
                        case 29:        // group separator >> graphics mode
                                        mode = 1;
                                        plotPointMode = 0;
                                        goto endDo;
                        case 30:        // record separator >> incremental plot mode
                                        if (DEBUG) printf("Incremental point plot mode\n");
                                        penDown = 1;
                                        mode = 40;
                                        goto endDo;
                        case 31:        // US, normal mode
                                        mode = 0;
                                        goto endDo;
                }


                // handle skipping coordinate bytes
                // this cannot be done in switch(mode) below, because multiple bytes
                // can be skipped and the current byte must be executed after a mode change

                tag = (ch >> 5) & 3;

                if ((mode >= 1) && (mode <= 8)) {

                        if ((mode == 5) && (ch == 29)) {
                                if (DEBUG) printf("group separator, go from mode 5 to mode 1\n");
                                mode = 1;
                                goto endDo; // goto end of do loop
                        }

                        if (DEBUG) {
                                if (mode & 1)
                                        printf("    mode=%d,tag=%d-H-val=%d,",
                                                mode,tag, 32 * (ch & 31));
                                else
                                        printf("    mode=%d,tag=%d-L-val=%d,",
                                                mode,tag, ch & 31);
                                printf("xh=%d,xl=%d,yh=%d,yl=%d\n",xh,xl,yh,yl);
                        }

                        if (tag != 0) {

                                if ((mode == 1) && (tag != 1)) mode = 2;

                                if ((mode == 3) && (tag == 3)) {
                                        // this overwrites the extra data byte of the 4014 for the
                                        // persistent mode ccordinates and stores it for further use
                                        mode = 2;
                                        xy4014 = yl;
                                        if (DEBUG)
                                                printf("4014 coordinates, overwrite last value\n");
                                }

                                if ((mode == 2) && (tag != 3)) mode = 3;
                                if ((mode == 3) && (tag != 1)) mode = 4;

                                if ((mode == 5) && (tag != 1)) mode = 6;

                                if ((mode == 7) && (tag == 3)) {
                                        // this overwrites the extra data byte of the 4014 for the
                                        // persistent mode ccordinates and stores it for further use
                                        mode = 6;
                                        xy4014 = yl;
                                        if (DEBUG)
                                                printf("4014 coordinates, overwrite last value\n");
                                }

                                if ((mode == 6) && (tag != 3)) mode = 7;
                                if ((mode == 7) && (tag != 1)) mode = 8;
                        }
                        else {
                                if (ch ==  0) return;
                                if (ch == 29) mode = 1; // group separator
                                else if (ch == 28) { plotPointMode = 1; todo = 16 * todo; }
                                else if (DEBUG) printf("Plot mode, unknown char %d, plotPointMode = %d\n",ch,plotPointMode);
                                return;
                        }

                }


                // handling anything specific to a mode

                switch (mode) {
                        case 1: plotPointMode = 0; // normal graphics mode, starting coordinates
                                yh = 32 * (ch & 31); mode++;
                                if (DEBUG) printf("setting yh to %d\n", yh);
                                break;
                        case 2: yl = (ch & 31);
                                mode++;
                                if (DEBUG) printf("setting yl to %d\n", yl);
                                break;
                        case 3: if (tag == 1) xh = 32 * (ch & 31); mode++;
                                if (DEBUG) printf("setting xh to %d\n", xh);
                                break;
                        case 4: xl = (ch & 31);
                                if (windowWidth != 1024) {
                                        int xb = xy4014 & 3;
                                        tube_x0 = (int)(efactor * (double)(((xh+xl) << 2) + xb) / 4.0);
                                        int yb = (xy4014 >> 2) & 3;
                                        tube_y0 = (int)(efactor * (double)(((yh+yl) << 2) + yb) / 4.0);
                                }
                                else {
                                        tube_x0 = xh + xl;
                                        tube_y0 = yh + yl;
                                }
                                mode++;
                                tube_emulateDeflectionTime();
                                if (DEBUG) printf("setting xl to %d\n", xl);
                                if (DEBUG) printf("******************************************** Moving to (%d,%d)\n",tube_x0,tube_y0);
                                break;
                        case 5: if (ch == 29) {
                                        if (DEBUG) printf("setting mode to 1\n");
                                        mode = 1;
                                }
                                else if (tag != 0) {
                                        yh = 32 * (ch & 31);  mode++;
                                }
                                else if (DEBUG) printf("case 5: tag is 0\n");
                                if (DEBUG) printf(">>>>>yh=%d\n",yh);
                                break;
                        case 6: yl = (ch & 31);               mode++;
                                break;
                                if (DEBUG) printf(">>>>>yl=%d\n",yl);
                        case 7: xh = 32 * (ch & 31);          mode++;
                                break;
                                if (DEBUG) printf(">>>>>xh=%d\n",xh);
                        case 8: xl = (ch & 31);
                                if (windowWidth != 1024) {
                                        int xb = xy4014 & 3;
                                        tube_x2 = (int)(efactor * (double)(((xh+xl) << 2) + xb) / 4.0);
                                        int yb = (xy4014 >> 2) & 3;
                                        tube_y2 = (int)(efactor * (double)(((yh+yl) << 2) + yb) / 4.0);
                                }
                                else {
                                        tube_x2 = xh + xl;
                                        tube_y2 = yh + yl;
                                }
                                if (DEBUG) printf(">>>>>xl=%d\n",xl);

                                if (plotPointMode>0.0) {

                                        // draw the point
                                        tube_drawPoint(cr, cr2);

                                        todo--;
                                }

                                else {
                                        tube_drawVector(cr,cr2);

                                        todo--;
                                }

                                showCursor = 0;

                                tube_x0 = tube_x2;        // prepare for additional vectors
                                tube_y0 = tube_y2;
                                if (specialPlotMode) mode = 50;  // another intensity/focus char follows
                                else mode = 5;
                                break;
                        case 30: // escape code handler
                                tek4010_escapeCodeHandler(cr, cr2, ch);
                                break;
                        case 31: // ANSI CSI sequence
                                printf("%c",ch);
                                if ((ch<0x20) || (ch>0x3F)) {
                                  mode=0;
                                  printf("\n");
                                }
                        case 40: // incremental plot mode
                                tek4010_checkReturnToAlpha(ch);  // check for exit
                                if (DEBUG) printf("Incremental plot mode, ch = %d, penDown = %d\n",ch, penDown);
                                if (ch == 32) penDown = 0;
                                else if (ch == 80) penDown = 1;
                                else if ((ch & 0x70) == 0x40){
                                        if (ch & 4) tube_y0++;
                                        if (ch & 1) tube_x0++;
                                        if (ch & 8) tube_y0--;
                                        if (ch & 2) tube_x0--;
                                        if (DEBUG) printf("point (%d,%d)\n", tube_x0, tube_y0);
                                        tube_x2 = tube_x0;
                                        tube_y2 = tube_y0;
                                        if (penDown) tube_drawPoint(cr, cr2);
                                }
                                else if (DEBUG) printf("Illegal byte 0x%02X in incremental plot\n", ch);
                                break;
                        case 50:// special plot mode
                                tag = ch >> 5;
                                if ((ch < 32) || (ch >= 126)) return;
                                if (DEBUG) printf("intensity/focus control = %c: %d: ", ch, tag);
                                defocussed = (tag == 1);
                                intensity = intensityTable[ch - 32];
                                if (DEBUG) printf("defocussed = %d, intensity = %d%%\n", defocussed, intensity);
                                mode = 5; // coordinates follow
                                break;
                        case 60:// crosshair mode
                                if (isGinMode > 1) { // key stroken by user
                                        ginSend(isGinMode);
                                        mode = 0;
                                        todo = 0;
                                        if (DEBUG) printf("GIN: key stroken by user, exiting GIN mode\n");
                                        isGinMode = 0;
                                }
                                else
                                        ginMode(cr, cr2);
                                break;
                        case 101:
                                if (DEBUG) printf("Ignore until group separator, ch = %02x\n", ch);
                                if (ch == 29) mode = 1;
                                break;
                        case 0: // handle ALPHA mode; 4014 user manual, table page G-1
                                // some characters are indentical for all modes and handled elsewhere
                                switch (ch) {
                                case 0:     break;
                                case 8:     // backspace
                                            tube_x0 -= hDotsPerChar;
                                            tek4010_checkLimits(cr, cr2);
                                            break;
                                case 9:     // tab
                                            if (argTab1)
                                                tube_x0 += hDotsPerChar;
                                            else
                                                tube_x0 = tube_x0 - (tube_x0 % (8 * hDotsPerChar)) + 8 * hDotsPerChar;
                                            tek4010_checkLimits(cr, cr2);
                                            break;
                                case 11:    // VT, move one line up
                                            tube_y0 += vDotsPerChar;
                                            tek4010_checkLimits(cr, cr2);
                                            break;
                                case 23:    // ctrl-w  screen dump
                                            system("scrot --focussed");
                                            break;

                                default:    if ((ch >= 32) && (ch <127)) { // printable character
                                                tek4010_checkLimits(cr, cr2);
                                                tube_drawCharacter(cr,cr2, ch);
                                                todo-= 2;
                                            }
                                            break;
                                }
                                break;
                        default: if (DEBUG) printf("Illegal mode - this is a tek4010decoder error and should not happen\n");
                                break;
                }
                endDo:;
        }
        while ((todo > 0) && ((tube_mSeconds() - startPaintTime) < refresh_interval));

        // display cursor

        if (showCursor && (tube_isInput() == 0)) tube_doCursor(cr2);

}



long tube_mSeconds()
// return time in msec since start of program
{
        static int initialized = 0;
        static long startTime;
        struct timeval tv;
        gettimeofday(&tv,NULL);
        long t = (1000 * tv.tv_sec)  + (tv.tv_usec/1000);
        if (!initialized) startTime = t;
        initialized = 1;
        t = t - startTime;
        if (t < 0) t += 86400000;
        return t;
}

long tube_u100ResetSeconds(int reset)
// returns time in 100 usec since last reset
{
        static long startTime;
        struct timeval tv;
        gettimeofday(&tv,NULL);
        long t = (10000 * tv.tv_sec)  + (tv.tv_usec/100);
        if (reset) {
                startTime = t;
                charResetCount = 0;
        }
        t = t - startTime;
        if (t < 0) t += 864000000;
        return t;
}

int tube_isInput()
// is char available on getDataPipe?
{
        int bytesWaiting;
        if (isGinMode)
                // delay any input from host during GIN mode
                // this allows to test .plt files with GIN mode
                return 0;
        ioctl(getDataPipe[0], FIONREAD, &bytesWaiting);
        if (DEBUG) {
                debugCount++;
                if (DEBUGMAX && (debugCount > DEBUGMAX)) return 0;
        }
        if (bytesWaiting == 0) {
                // reset the baud rate counter
                // without this, baud rate goal would not work after waiting for chars
                tube_u100ResetSeconds(1);
        }
        return bytesWaiting;
}

int tube_getInputChar()
// get a char from getDataPipe, if available, otherwise return -1
{
        static long lastTime = 0;

        long t = tube_u100ResetSeconds(0);
        if (tube_isInput()) {
                // handle baud rate since last no input available
                if (t < charResetCount * characterInterval)
                        return -1; // there is time to refresh the screen
                int c = getc(getData) & 0x7F;
                charCount++;
                charResetCount++;
                lastTime = t;
                return c;
        }
        else
                return -1;
}

void checkFont(char *fontName)
// check whether font has been installed
{
#define MAXL 255
        FILE *f;
        int i, ch;
        char line[MAXL];
        sprintf(line,"fc-list \'%s\'", fontName); // prepare system call
        f = popen(line, "r");
        if (f != NULL) {
                i = 0;
                line[0] = 0;
                while (((ch=fgetc(f))!=EOF) && (i<MAXL-1)) {
                        line[i++] = ch;
                }
                line[i-1]=0;
                // printf("%s\n",line);
                if (strstr(line, fontName) > 0) {
                        pclose(f);
                        return;
                }
       }
       pclose(f);
       printf("Error: APL font \'%s\' not installed. This font is required for the APL mode.\n", fontName);
       printf("See github.com/rricharz/tek4010 paragraph \'APL mode\'\n");
       exit(1);
}

void readKeyTranslationTable()
// read keyboard translation table from ~/.tekaplkeys
{
        FILE *confFile;
        int code1, code2, i;
        char *homedir = getpwuid(getuid())->pw_dir;
	char s[255];

        memset(keyTable, 0, sizeof(keyTable));

        strcpy(s, homedir);
        strcat(s, "/.tek4010conf/aplkeys" );
        // printf("Looking for conf file %s\n",s);
        confFile = fopen(s,"r");
        if (confFile) {
                // printf("confFile open\n");
                i = 0;
                while (!feof(confFile)) {
                        if (fscanf(confFile, "%d %d\n", &code1, & code2) == 2) {
                                // printf("%d %d\n", code1, code2);
                                keyTable[i].inputCode = code1;
                                keyTable[i].outputCode = code2;
                                i++;
                                if (i >= MAXKEYCODES) {
                                        printf("Error: APL key code table too large, max %d entries\n",MAXKEYCODES);
                                        fclose(confFile);
                                        exit(1);
                                }
                        }
                        else
                                fscanf(confFile,"%s\n",s); // skip comment line
                }
                fclose(confFile);
        }
}

int tube_translateKeyCode(int ch)
{
        int i = 0;
        // printf("TranslateKeyCode %d ", ch);
        while ((i < MAXKEYCODES) && (keyTable[i].inputCode != 0)) {
                if (keyTable[i].inputCode == ch) {
                        // printf("%d\n", keyTable[i].outputCode);
                        return keyTable[i].outputCode;
                }
                i++;
        }
        printf("\n");
        return ch;
}

void tube_init(int argc, char* argv[])
// put any code here to initialize the tek4010
{
        char *argv2[20];
        size_t bufsize = 127;
        int firstArg = 1;
        printf("tek4010 version 1.5.7b\n");
        windowName = "Tektronix 4010/4014 emulator";
        if ((argc<2) || (argc>19)) {
                printf("Error:number of arguments\n");
                exit(1);
        }

        // this stays here for compatibility with early versions of tek4010
        if (strcmp(argv[argc-1],"-noexit") == 0) {
                argNoexit = 1;
                argc--;
        }

        while ((argv[firstArg][0] == '-') && firstArg < argc-1) {
                if (strcmp(argv[firstArg],"-raw") == 0)
                        argRaw = 1;
                else if (strcmp(argv[firstArg],"-noexit") == 0)
                        argNoexit = 1;
                else if (strcmp(argv[firstArg],"-b100000") == 0)
                        argBaud = 100000;
                else if (strcmp(argv[firstArg],"-b38400") == 0)
                        argBaud = 38400;
                else if (strcmp(argv[firstArg],"-b19200") == 0)
                        argBaud = 19200;
                else if (strcmp(argv[firstArg],"-b9600") == 0)
                        argBaud = 9600;
                else if (strcmp(argv[firstArg],"-b4800") == 0)
                        argBaud = 4800;
                else if (strcmp(argv[firstArg],"-b2400") == 0)
                        argBaud = 2400;
                else if (strcmp(argv[firstArg],"-b1200") == 0)
                        argBaud = 1200;
                else if (strcmp(argv[firstArg],"-b600") == 0)
                        argBaud = 600;
                else if (strcmp(argv[firstArg],"-b300") == 0)
                        argBaud = 300;
                else if (strcmp(argv[firstArg],"-tab1") == 0)
                        argTab1 = 1;
                else if (strcmp(argv[firstArg],"-full") == 0)
                        argFull = 1;
                else if (strcmp(argv[firstArg],"-fullv") == 0)
                        argFullV = 1;
                else if (strcmp(argv[firstArg],"-autoClear") == 0)
                        argAutoClear = 1;
                else if (strcmp(argv[firstArg],"-keepsize") == 0)
                        argKeepSize = 1;
                else if (strcmp(argv[firstArg],"-hidecursor") == 0)
                        argHideCursor = 1;
                else if (strcmp(argv[firstArg],"-APL") == 0) {
                        argAPL = 1;
                        windowName = "Tektronix 4013/4015 emulator (APL)";
                        checkFont(APL_FONT);
                        readKeyTranslationTable();
                }
                else if (strcmp(argv[firstArg],"-ARDS") == 0) {
                        argARDS = 1;
                        windowName = "ARDS emulator";
                }
                else {
                        printf("tek4010: unknown argument %s\n", argv[firstArg]);
                        exit(1);
                }
                firstArg++;

        }

        // A child process for rsh is forked and communication
        // between parent and child are established

        // expand argv[firstArg] to full path and check, whether it exists
        char *str = (char *) malloc(bufsize * sizeof(char));
        if (str == NULL) {
               printf("Cannot allocate memory for absolute path\n");
               exit(1);
        }
        strcpy(str,"which ");
        strcat(str, argv[firstArg]);
        FILE *fullPath = popen(str,"r");
        if (fullPath) {
                getline(&str, &bufsize,fullPath);

                // remove the endline character
                str[strlen(str)-1] = 0;

                if (strncmp(str,"which",5) == 0) {
                        printf("Unknown command %s\n", argv[firstArg]);
                        exit(1);
                }

                argv[firstArg] = str;
                pclose(fullPath);
        }
        else {
                printf("Unknown command %s\n", argv[firstArg]);
                exit(1);
        }

        characterInterval = 100000 / argBaud; // in 100 usecs, assuming 1 start and 1 stop bit.

        if (DEBUG) printf("character_interval = %0.1f msec\n",(double)characterInterval/10.0);

        tube_doClearPersistent = 1;

        // create pipes for communication between parent and child
        if (pipe(getDataPipe) == -1) {
                printf("Cannot initialize data pipe\n");
                exit(1);
        }

        if (pipe(putKeysPipe) == -1) {
                printf("Cannot initialize key pipe\n");
                exit(1);
        }

        // now fork a child process
        pid_t pid = fork();
        if (pid == -1) {
                printf("Cannot fork child process\n");
                exit(1);
        }
        else if (pid == 0) {  // child process

                // we need a second string array with an empty string as last item!
                argv2[0] = argv[firstArg];
                for (int i = 1; i < argc; i++)
                        argv2[i] = argv[firstArg+i-1];
                argv2[argc-firstArg+1] = (char*) NULL;

                // int i = 0;
                // do {
                //        printf("argv2[%d] = %s\n",i,argv2[i]);
                //        i++;
                // }
                // while (argv2[i] != (char*) NULL);

                // set stdout of child process to getDataPipe
                while ((dup2(getDataPipe[1], STDOUT_FILENO) == -1) && (errno == EINTR)) {}
                close(getDataPipe[1]); // not used anymore
                close(getDataPipe[0]); // not used

                // set stdin of child process to putKeysPipe
                while ((dup2(putKeysPipe[0], STDIN_FILENO) == -1) && (errno == EINTR)) {}
                close(putKeysPipe[1]); // not used
                close(putKeysPipe[0]); // not used anymore

                // run rsh in the child process
                execv(argv2[0],argv2+1);
                free(str);
                exit(0);
        }

        // parent process

        free(str);

        close(getDataPipe[1]); // not used
        close(putKeysPipe[0]); // not used

        // use termios to turn off line buffering for both pipes
        // struct termios term;
        // tcgetattr(getDataPipe[0], &term);
        // term.c_lflag &= ~ICANON ;
        // tcsetattr(getDataPipe[0], TCSANOW,&term);
        // tcgetattr(putKeysPipe[1], &term);
        // tcsetattr(putKeysPipe[0], TCSANOW,&term);

        // open now a stream from the getDataPipe descriptor
        getData = fdopen(getDataPipe[0],"r");
        if (getData == 0) {
                printf("Parent: Cannot open input stream\n");
                exit(1);
        }
        setbuf(getData,0);

        // open now a stream from the putKeysPipe descriptor
        putKeys = fdopen(putKeysPipe[1],"w");
        if (putKeys == 0) {
                printf("Parent: Cannot open output stream\n");
                exit(1);
        }
        setbuf(putKeys,0);

        tube_mSeconds();             // initialize the timer
        tube_u100ResetSeconds(1);
}

int tube_on_timer_event()
// if TIMER_INTERVAL in tek4010.h is larger than zero, this function
// is called every TIMER-INTERVAL milliseconds
// if the function returns 1, the window is redrawn by calling applicatin_draw
{
        // if there is a char available on the imput stream
        // or there is still a bright spot, return 1 to ask for
        // one more redraw

        // is child process still running?

        int status;
        if ((!argNoexit) && (tube_isInput() == 0) && (waitpid(-1, &status, WNOHANG))) {
                long t = tube_mSeconds();
                // printf("Execution time: %0.3f sec\n", (double)t/1000.0);
                // if (t > 0) {
                //         printf("Average screen refresh rate: %0.1f Hz\n",(double)(1000.0*refreshCount)/t);
                //         printf("Average character rate: %0.0f baud\n",(double)(8000.0*charCount)/t);
                // }
                tube_quit();
                gtk_main_quit();
                printf("Process has been terminated\n");
                exit(0);
        }
        return (isBrightSpot || tube_isInput());
}

int tube_clicked(int button, int x, int y)
// is called if a mouse button is clicked in the window
// button = 1: means left mouse button; button = 3 means right mouse button
// x and y are the coordinates
// if the function returns 1, the window is redrawn by calling applicatin_draw
{
        if (argARDS) return 0;
        if (button == 1) {
                tek4010_clicked(x, windowHeight - y);
                return 1;
        }
	return 0;
}

void tube_quit()
// is called if the main window is quit bevore the tek4010 exits
// put any code here which needs to be called on exit
{
        pclose(getData);
        system("pkill rs232-console");
}

void tube_doCursor(cairo_t *cr2)
{
        cairo_set_source_rgb(cr2, 0, CURSOR_INTENSITY, 0);
        cairo_set_line_width (cr2, 1);
        cairo_rectangle(cr2, tube_x0, windowHeight - tube_y0 - vDotsPerChar + 6 + currentCharacterOffset,
                                                hDotsPerChar - 3, vDotsPerChar - 3);
        cairo_fill(cr2);
        cairo_stroke (cr2);
}

void tube_clearPersistent(cairo_t *cr, cairo_t *cr2)
// clear the persistant surface
// flash using the second surface
{
        cairo_set_source_rgb(cr, 0.0, BLACK_COLOR, 0.0);
        cairo_paint(cr);
        tube_doClearPersistent = 0;
        tube_x0 = 0;
        tube_y0 = windowHeight - vDotsPerChar;
        tube_x2 = tube_x0;
        tube_y2 = tube_y0;
        leftmargin = 0;
        cairo_set_source_rgb(cr, 0, NORMAL_INTENSITY, 0);
        cairo_set_source_rgb(cr2, BRIGHT_SPOT_COLOR, BRIGHT_SPOT_COLOR, BRIGHT_SPOT_COLOR);
        cairo_paint(cr2);
        isBrightSpot = 1;
        plotPointMode = 0;
        ltype = SOLID;
        xlast = 0;
        ylast = 0;
        specialPlotMode = 0;
        defocussed = 0;
        intensity = 100;
}

void tube_clearSecond(cairo_t *cr2)
// clear second surface
{
        cairo_set_source_rgba(cr2, 0, 0, 0, 0);
        cairo_set_operator(cr2, CAIRO_OPERATOR_SOURCE);
        cairo_paint(cr2);
        cairo_set_operator(cr2, CAIRO_OPERATOR_OVER);
}

void tube_line_type(cairo_t *cr, cairo_t *cr2, enum LineType ln)
{
    int ndash,ndx;
    double ofs = 0.5;

    switch (ln) {
    case SOLID:
        ndx = 0;
        ndash = 0;
        break;
    case DOTTED:
        ndx = 0;
        ndash = 2;
        break;
    case DOTDASH:
        ndx = 2;
        ndash = 4;
        break;
    case LONGDASH:
        ndx = 8;
        ndash = 2;
        break;
    case SHORTDASH:
        ndx = 6;
        ndash = 2;
        break;
    }
    cairo_set_dash (cr,&dashset[ndx],ndash,ofs);
    cairo_set_dash (cr2,&dashset[ndx],ndash,ofs);
}

void tube_drawCharacter(cairo_t *cr, cairo_t *cr2, char ch)
{
        char s[8];

        if (ch < 32) return; // non printable control character

        if (aplMode) {
                switch (ch) {
                        case 32: sprintf(s," ");
                                 break;
                        case 33: sprintf(s,"\u00A8");
                                 break;
                        case 34: sprintf(s,")");
                                 break;
                        case 35: sprintf(s,"<");
                                 break;
                        case 36: sprintf(s,"\u2264");
                                 break;
                        case 37: sprintf(s,"=");
                                 break;
                        case 38: sprintf(s,">");
                                 break;
                        case 39: sprintf(s,"]");
                                 break;
                        case 40: sprintf(s,"\u2228");
                                 break;
                        case 41: sprintf(s,"\u2227");
                                 break;
                        case 42: sprintf(s,"\u2260");
                                 break;
                        case 43: sprintf(s,"\u00F7");
                                 break;
                        case 44: sprintf(s,",");
                                 break;
                        case 45: sprintf(s,"+");
                                 break;
                        case 46: sprintf(s,".");
                                 break;
                        case 47: sprintf(s,"/");
                                 break;

                        // 48 - 57: Digits

                        case 58: sprintf(s,"(");
                                 break;
                        case 59: sprintf(s,"[");
                                 break;
                        case 60: sprintf(s,";");
                                 break;
                        case 61: sprintf(s,"\u00D7");
                                 break;
                        case 62: sprintf(s,":");
                                 break;
                        case 63: sprintf(s,"\\");
                                 break;
                        case 64: sprintf(s,"\u00AF");
                                 break;
                        case 65: sprintf(s,"\u237A");
                                 break;
                        case 66: sprintf(s,"\u22A5");
                                 break;
                        case 67: sprintf(s,"\u2229");
                                 break;
                        case 68: sprintf(s,"\u230A");
                                 break;
                        case 69: sprintf(s,"\u220A");
                                 break;
                        case 70: sprintf(s,"_");
                                 break;
                        case 71: sprintf(s,"\u2207");
                                 break;
                        case 72: sprintf(s,"\u2206");
                                 break;
                        case 73: sprintf(s,"\u2373");
                                 break;
                        case 74: sprintf(s,"\u2218");
                                 break;
                        case 75: sprintf(s,"'");
                                 break;
                        case 76: sprintf(s,"\u2395");
                                 break;
                        case 77: sprintf(s,"\u2223");
                                 break;
                        case 78: sprintf(s,"\u22A4");
                                 break;
                        case 79: sprintf(s,"\u25CB");
                                 break;

                        case 80: sprintf(s,"\u22c6");
                                 break;
                        case 81: sprintf(s,"?");
                                 break;
                        case 82: sprintf(s,"\u2374");
                                 break;
                        case 83: sprintf(s,"\u2308");
                                 break;
                        case 84: sprintf(s,"\u223C");
                                 break;
                        case 85: sprintf(s,"\u2193");
                                 break;
                        case 86: sprintf(s,"\u222A");
                                 break;
                        case 87: sprintf(s,"\u03C9");
                                 break;
                        case 88: sprintf(s,"\u2283");
                                 break;
                        case 89: sprintf(s,"\u2191");
                                 break;
                        case 90: sprintf(s,"\u2282");
                                 break;
                        case 91: sprintf(s,"\u2190");
                                 break;
                        case 92: sprintf(s,"\u22A2");
                                 break;
                        case 93: sprintf(s,"\u2192");
                                 break;
                        case 94: sprintf(s,"\u2265");
                                 break;
                        case 95: sprintf(s,"-");
                                 break;
                        case 96: sprintf(s,"\u22C4");
                                 break;

                        // 97 - 122 capital letters

                        case 123: sprintf(s,"{");
                                 break;
                        case 124: sprintf(s,"\u22A3");
                                 break;
                        case 125: sprintf(s,"}");
                                 break;
                        case 126: sprintf(s,"$");
                                 break;

                        default: if ((ch>=48) && (ch<=57)) sprintf(s,"%c", ch); // digits
                                 else if ((ch>=97) && (ch<=122)) sprintf(s,"%c", ch - 32); // capital letters
                                 else sprintf(s," ");
                                 break;
                }
        }
        else {
                s[0] = ch;
                s[1] = 0;
        }
        cairo_set_font_size(cr, currentFontSize);
        cairo_set_font_size(cr2,currentFontSize);

        if (writeThroughMode) {  // draw the write-through character
                cairo_set_source_rgb(cr2, 0, WRITE_TROUGH_INTENSITY, 0);
                cairo_move_to(cr2, tube_x0, windowHeight - tube_y0 + currentCharacterOffset);
                cairo_show_text(cr2, s);
        }

        else {
                // draw the character
                cairo_set_source_rgb(cr, 0, BLACK_COLOR + ((NORMAL_INTENSITY - BLACK_COLOR) * intensity) / 100, 0);
                cairo_move_to(cr, tube_x0, windowHeight - tube_y0 + currentCharacterOffset);
                cairo_show_text(cr, s);

                // draw the bright spot
                cairo_set_source_rgb(cr2, BRIGHT_SPOT_COLOR, BRIGHT_SPOT_COLOR, BRIGHT_SPOT_COLOR);
                cairo_move_to(cr2, tube_x0, windowHeight - tube_y0 + currentCharacterOffset);
                cairo_show_text(cr2, s);
        }

        tube_x0 += hDotsPerChar;
        isBrightSpot = 1;
}

void tube_emulateDeflectionTime()
{
        // find length of longer component
        int l = tube_x2 - tube_x0;
        if ((tube_x0-tube_x2) > l) l = tube_x0 - tube_x2;
        if ((tube_y2-tube_y0) > l) l = tube_y2 - tube_y0;
        if ((tube_y0-tube_y2) > l) l = tube_y0 - tube_y2;
        if (l > 300) {  // the 300 accounts for other overheads
                usleep((l - 300) * 2);  // roughly 2 usec per dot
        }
}

void tube_drawPoint(cairo_t *cr, cairo_t *cr2)
{
#define PI2 6.283185307
        int i1;
        cairo_set_line_width (cr, pensize + defocussed);
        cairo_set_source_rgb(cr, 0, BLACK_COLOR + ((1.0 - BLACK_COLOR) * intensity) / 100, 0);
        cairo_move_to(cr, tube_x2, windowHeight - tube_y2);
        cairo_line_to(cr, tube_x2 + 1, windowHeight - tube_y2 + 1);
        cairo_stroke (cr);

        // speed is a problem here
        // do not draw adjacent bright spots

        if (((tube_x2 - xlast) > 2) || ((xlast - tube_x2) > 2) ||
                ((tube_y2 - ylast) > 2) || ((ylast - tube_y2) > 2))  {

                // draw the bright spot
                cairo_set_line_width (cr2, 0.1);
                double bsc = (BRIGHT_SPOT_COLOR * intensity) / 100;

                cairo_set_source_rgb(cr2, bsc, bsc, bsc);
                cairo_arc(cr2, tube_x2, windowHeight - tube_y2, 2 + defocussed, 0, PI2);
                cairo_fill(cr2);

                xlast = tube_x2;
                ylast = tube_y2;
        }

        isBrightSpot = 1;
}

void tube_crosshair(cairo_t *cr, cairo_t *cr2)
{
        // printf("crosshair at %d,%d\n", tube_x0, tube_y0);
        cairo_set_line_width (cr2, 1);
        cairo_set_source_rgb(cr2, 0.0, WRITE_TROUGH_INTENSITY, 0.0);
        cairo_move_to(cr2, tube_x0, 0);
        cairo_line_to(cr2, tube_x0, windowHeight);
        cairo_move_to(cr2, 0, windowHeight - tube_y0);
        cairo_line_to(cr2, windowWidth, windowHeight - tube_y0);
        cairo_stroke (cr2);
}

void tube_drawVector(cairo_t *cr, cairo_t *cr2)
{
        if (DEBUG) {
                printf("********************************************");
                printf("Drawing from (%d,%d) to (%d,%d), writethrough = %d\n",
                                tube_x0, tube_y0, tube_x2, tube_y2, writeThroughMode);
        }
        tube_emulateDeflectionTime();

        if ((tube_x2 == tube_x0) && (tube_y2 == tube_y0)) tube_x0++; // cairo cannot draw a dot

        if (writeThroughMode) {
                cairo_set_line_width (cr2, pensize + 1);
                cairo_set_source_rgb(cr2, 0.0, WRITE_TROUGH_INTENSITY, 0.0);
                cairo_move_to(cr2, tube_x0, windowHeight - tube_y0);
                cairo_line_to(cr2, tube_x2, windowHeight - tube_y2);
                cairo_stroke (cr2);
        }

        else {
                // draw the actual vector on permanent surface
                cairo_set_line_width (cr, pensize + defocussed);
                cairo_set_source_rgb(cr, 0, BLACK_COLOR + ((NORMAL_INTENSITY - BLACK_COLOR) * intensity) / 100, 0);
                tube_line_type(cr, cr2, ltype);
                cairo_move_to(cr, tube_x0, windowHeight - tube_y0);
                cairo_line_to(cr, tube_x2, windowHeight - tube_y2);
                cairo_stroke (cr);

                //draw the bright spot, half intensity
                cairo_set_line_width (cr2, 6 + pensize + 1 * defocussed);
                double bsc = (BRIGHT_SPOT_COLOR_HALF * intensity) / 100;
                cairo_set_source_rgb(cr2, bsc, bsc, bsc);
                cairo_move_to(cr2, tube_x0, windowHeight - tube_y0);
                cairo_line_to(cr2, tube_x2, windowHeight - tube_y2);
                cairo_stroke (cr2);

                // draw the bright spot, high intensity
                cairo_set_line_width (cr2, pensize + 2 + 2 * defocussed);
                bsc = (BRIGHT_SPOT_COLOR * intensity) / 100;
                cairo_set_source_rgb(cr2, bsc, bsc, bsc);
                cairo_move_to(cr2, tube_x0, windowHeight - tube_y0);
                cairo_line_to(cr2, tube_x2, windowHeight - tube_y2);
                cairo_stroke(cr2);
        }

        isBrightSpot = 1; // also to be set if writeThroughMode
}

void tube_setupPainting(cairo_t *cr, cairo_t *cr2, char *fontName)
{
        cairo_set_antialias(cr, CAIRO_ANTIALIAS_BEST);
	cairo_set_line_width (cr, pensize);
        cairo_set_source_rgb(cr, 0, NORMAL_INTENSITY, 0);
        cairo_select_font_face(cr, fontName, CAIRO_FONT_SLANT_NORMAL, CAIRO_FONT_WEIGHT_NORMAL);
        cairo_select_font_face(cr2, fontName, CAIRO_FONT_SLANT_NORMAL, CAIRO_FONT_WEIGHT_BOLD);
}

void tube_changeCharacterSize(cairo_t *cr, cairo_t *cr2,int charsPerLine, int charsPerPage, double fontSize)
{
        cairo_font_extents_t et;
        hDotsPerChar = windowWidth / charsPerLine;
        vDotsPerChar = windowHeight / charsPerPage;
        leftmargin = 0;
        if (argARDS) {
                currentFontSize = (int) (fontSize * APL_FONT_SIZE);
        }
        else {
                currentFontSize = (int) (fontSize * STANDARD_FONT_SIZE);
        }
        cairo_set_font_size(cr, currentFontSize);
        cairo_set_font_size(cr2,currentFontSize);
        if (argARDS) {
               cairo_font_extents(cr, &et);
               currentCharacterOffset =(int)et.ascent;
               if (DEBUG) printf("Set vertical character offset for ARDS mode to %d\n", currentCharacterOffset);
        }
        else
                currentCharacterOffset = 0;
}








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

  return (
    <Window
      width={1024}
      height={768}>
      <Window.Content>
          <RealTerminal numRows={24}  numCols={80} screen={0} screens={[ header ] }/>
      </Window.Content>
    </Window>
  );
};


