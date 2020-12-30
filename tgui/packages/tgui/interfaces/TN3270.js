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
const CELL_TAB_ON_ENTER = (1<<13);
const CELL_FIELD_MASK = ~(CELL_READONLY | CELL_UPDATE_ALWAYS |  CELL_UPDATE_ON_LOST_FOCUS | CELL_UPDATE_ON_ENTER| CELL_TAB_ON_ENTER);

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
};

const createStyle = (attribute, x, y, length) => {
  const style = {
  //  'flex': '1 1 ' + ((length/80) * 100) +'%',
   'width': length + 'rem', // (magic.cxFactor*length) + 'px' ,
   'min-width' : length + 'rem', // (magic.cxFactor*length) + 'px' ,
   'max-width' : length + 'rem', // (magic.cxFactor*length) + 'px' ,
  };
  return style;
};

const createStyleFromByte = attribute => {

  const style = {
    /*
    'width': text_length,
    'min-width' : text_length,
    'max-width' : text_length,
    'height' : "18px",
    'transform': trasform_text,
    */
    color: lu3270_color,
    'background': 'none',
    'background-color': lu3270_background ,
  //  'border' : '1px solid red',
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
   //   const temp = style.color;
    //  style.color = style['background-color'];

      style['background-color'] = style.color;
      style.color = 'black';
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

const parse_screen_code = (commands, perfs) => {// numRows,numCols) => {
  const numRows = perfs.numRows;
  const numCols = perfs.numCols;
  const fontSize = perfs.fontSize;
  const fontFamily = perfs.fontFamily
  const font = fontSize + " " + fontFamily;
  const fontWidth = getTextWidth("W", font);
  perfs.fontWidth = fontWidth;

  logger.log("Cell size is " + fontWidth  + "px by 18px");

  // () is must [] is optional
  // attibute is a number of a bunch of bit flags, can be up to 16bit NOT hex
  // ESC[attribute] (".*) = text at the current position.  We will ignore an ending " but its not necessary
  // ESCG(y)[,x] // goto cursor
  // ESCF(attribute),(field_name),(field_length)[,tab_pos] // its a field, going to be updated after ui_update as we use ui_static_update to make the screen
  // ESCM(attribute),(menu_name)("+*) // menu field, by default on clickable
  let x = 0;
  let y = 0;
  let fields = [];
  let field_length = 0;
  let last_field_attribute = 0;
  let last_menu_attribute = 0;
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
        parsed_cmd = { type: "text", x:x, y:y , text: args[0], attribute: last_text_attribute, protected: true };
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
          parsed_cmd = { type: "field", x:x, y:y , name: args[0], attribute: last_field_attribute | CELL_REVERSE, tab: last_tab++, protected: (last_field_attribute & CELL_READONLY)? true : false };
          parsed_cmd.class = "field";
          last_field_attribute &= CELL_FIELD_MASK; // filter out all the individual field settings like readonly
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
        last_menu_attribute &= CELL_FIELD_MASK; // filter out all the individual field settings like readonly
      }
      break; // no text
      default:
        logger.log("screen("+ i +"): unkonwn command = " + cmd);
      break;
    }
    if(field_length>0) {
      parsed_cmd.field_length = field_length;
     // parsed_cmd.style = createStyleFromByte(parsed_cmd.attribute,  x, y, field_length, false, false);
      let style =  createStyleFromByte(parsed_cmd.attribute);
      // so fuck it right?  We don't care about blank space.  Lets just map this to top/left
      style.position = "absolute";
      style.top = (parsed_cmd.y * fontSize) + "px";
      style.left= (parsed_cmd.x * fontWidth)+ "px";
      style.width = (field_length * fontWidth)+ "px";
      style.height = fontSize+ "px";
      style.font = font;
      parsed_cmd.style = style;
    //  logger.log(`Parsed rect top= ${style.top } left= ${style.left} width= ${style.width} height= ${style.height}`)
      if(parsed_cmd.type === "field") {
      //  logger.log(`Field name=${parsed_cmd.name} protected=${parsed_cmd.protected}`);
      }
      move_cursor(field_length);
    }
  }
  return fields;
}
const default_terminal_settings = {
  numRows: 25,
  numCols: 80,
  fontSize: 18,
  fontFamily: "'Consolas' monospace",
};

const TerminalScreen = (props, context) => {
  const { act, data } = useBackend(context);
  const perfs = props.settings || default_terminal_settings;
  const screen_data = props.screen || []; // blank screen?  make an error screen?
  const screen_name = props.name; // really got to have this for the shared field states
  const onUpdate = props.onUpdate || (() => {});
  const updateByond = props.updateByond || false;
  const state_name = "state_" + screen_name; // random number?
  const onMouseClick = props.onMouseClick || ((x,y) => {});
  const parsed_screen = parse_screen_code(screen_data,perfs);
  const screen_id_ref = "screen_id_" + screen_name;

  const [
    fields,
    setFields,
  ] = useSharedState(context, state_name, {});

  const updateField = (name, value) => {
    fields[cell.name] = value;
    setFields(fields);
    if(props.updateByond) {
      act("update", { "field_name" : name, "field_value" : value });
    }
    if(props.onUpdate) {
      props.onUpdate(name,value,fields);
    }
  };

  const onInputKeyDown = (e,cell) => {
    if(cell.type === "field" && !cell.protected) {
      if(cell.attribute & CELL_UPDATE_ON_ENTER && e.key==='Enter') { // really don't want to do this, its very heavy
          updateField(cell.name, e.target.value);
          e.preventDefault();
          return false;
      }

    }
    return true;
  };

  const onInputChange = (e,cell) => {
    if(cell.type === "field" && !cell.protected) {
      if(cell.attribute & CELL_UPDATE_ALWAYS) { // really don't want to do this, its very heavy
        updateField(cell.name, e.target.value);
      } else {
        fields[cell.name] = e.target.value;
        setFields(fields);
      }
    }
  };

  const onInputBlur = (e,cell) => {
    if(cell.type === "field" && !cell.protected) {
      if(cell.attribute & CELL_UPDATE_ON_LOST_FOCUS) { // really don't want to do this, its very heavy
        updateField(cell.name, e.target.value);
      }
    }
  };
  const on_mouse_click = e => {
    const letter_width =  perfs.fontWidth;
   const main = document.getElementById(screen_id_ref);
    const rect = main.getBoundingClientRect(); // target just gets the line created
    logger.log("top=" + rect.top + " left=" + rect.left);
    const px = Math.trunc(e.pageX - rect.left);
    const py = Math.trunc(e.pageY - rect.top);
    const x = Math.trunc(px / magic.cxFactor);
    const y= Math.trunc(py / magic.cyFactor);
   // const x = e.clientX - rect.left; //x position within the element.
   // const y = e.clientY - rect.top;  //y position within the element.
    logger.log("Left? : " + x + " ; Top? : " + y + ".");
    onMouseClick(x,y);
  };

 // const translate = "translate(" + Math.trunc(cursorAt.x * magic.cxFactor) + "px," + Math.trunc(cursorAt.y * magic.cyFactor) + "px)";

  return (
    <Box
    position="absolute"
    backgroundColor="black"
      width={((perfs.numCols)* perfs.fontWidth) + 'px'}
      height={((perfs.numRows+1)*perfs.fontSize) + 'px'} >

        <div class="lu3270" id={screen_id_ref}  onmousedown={ e=> on_mouse_click(e)} >
          {
            parsed_screen.map((cell,i)  => (
                <div class="cell" style={cell.style}   >
                  <input
                    key={"field_"+i}
                    onchange={e=> onInputChange(e,cell) }
                    onkeydown={e=> onInputKeyDown(e,cell)}
                    onblur={e=>onInputKeyDown(e,cell) }
                    type="text"
                    maxlength={cell.field_length}
                    length={cell.field_length}
                    tabIndex={cell.tab || -1}
                    disabled={cell.protected}
                    maxlength={cell.field_length}
                    length={cell.field_length}
                    value={cell.type !== "field" ? cell.text : fields[cell.name]}
                  />
              </div>))
       }

        </div>
    </Box>
  );

};


//color: transparent;
//text-shadow: 0 0 0 #333333;


let nextTerminalId = 1;


export const TN3270 = (props, context) => {
  const { act, data } = useBackend(context);
  const {
    commands,
    screen,
    screens
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
    [ "field", CELL_WHITE|CELL_UPDATE_ON_ENTER ,"spider_2", 3 ],
    [ "goto", 2, 7 ],
    [ "text", "Do you have plenty of spider food?"],
    [ "goto", 45, 7 ],
    [ "field", CELL_BLUE|CELL_REVERSE|CELL_UPDATE_ON_ENTER ,"spider_3", 3 ],
    [ "goto", 2, 8 ],
    [ "text", "Are you an idiot?"],
    [ "goto", 45, 8 ],
    [ "field", CELL_WHITE|CELL_REVERSE|CELL_UPDATE_ON_ENTER ,"spider_4", 3 ],
  ];
  /*
    [ "goto", 40, 10],
    [ "text", CELL_WHITE|CELL_BLINK|CELL_REVERSE, "\xA0" ],
  ];
*/
/*
parse_screen_code

*/
  return (
    <Window
      width={1024}
      height={768}>
      <Window.Content>

      <Box fillPositionedParent>
        <TerminalScreen name={"test_screen"} screen={header} />
      </Box>
      </Window.Content>
    </Window>
  );
};


