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

const createStyleFromByte = (attribute, length, cursorAt, focused) => {
  const style = {'white-space': 'pre-wrap', color: lu3270_color, 'background-color': lu3270_background , 'width': (magic.cxFactor*length) + 'px' , 'height': (magic.cyFactor) + 'px' };
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

      style['text-decoration'] = 'underline';
    }
  }
  style['text-color'] = style.color;
  return style;
};


class Cell {
  constructor(code, attribute) {
    this.code = code[0];      // first letter T/F  text or field
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

const ESC = '\u001B';

const makeBlankCell = (x,y, field_length) => {
  return  { x:x, y:y,  type: "fill",
    field_length: field_length,
    style: createStyleFromByte(0, field_length, false, false),
    attribute:0,
    text:" ".repeat(field_length) };
};
  const parse_screen_code = commands => {

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
    let field_length = 0;
    let last_field_attribute = 0;
    let last_menu_attribute = 0;
    let value = 0;
    let pos = 0;
    let last_tab = 0;
    let last_text_attribute = 0;
    const move_cursor = l => {
      x+=l;
      while(y < numCols && x > numRows) {
        y++;
        x-=numRows;
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
            last_text_attribute = args[0];
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
        }
        break; // no text
        default:
          logger.log("screen("+ i +"): unkonwn command");
        break;
      }
      if(field_length>0) {
        parsed_cmd.field_length = field_length;
        logger.log("type:" + parsed_cmd.type + " pos:" + parsed_cmd.pos);
        parsed_cmd.style = createStyleFromByte(parsed_cmd.attribute, field_length, false, false),
        rows[y].push(parsed_cmd);
        move_cursor(field_length);
      }
    }
    for(let i=0; y < rows.length; y++) {
        let row = rows[y];
        if(row.length == 0)
          row.push(makeBlankCell(0,y, numCols));
        else {
          let new_row = [];
          let x = 0;
          while(row.length > 0) {
            const cell = row[0];
            row.shift();
            if(x != cell.x) {
              new_row.push(makeBlankCell(x,y, cell.x-x));
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
            new_row.push(makeBlankCell(x,y, numCols-x));
          }
          rows[y] = new_row;
        }
    }
    return rows;
  }
  const test_data = [
    [ "goto", 10, 10 ],
    [ "text", CELL_YELLOW, "Name:      "],
    [ "text", "[" ],
    [ "field", "field_name", 20 ],
    [ "text", "]" ],
    [ "goto", 10, 11 ],
    [ "text", CELL_YELLOW, "Race:      "],
    [ "text", "[" ],
    [ "field", "race_name", 20 ],
    [ "text", "]" ],
  ];
  const test_screen = parse_screen_code(test_data);
/*

  for(var/datum/data/record/R in sortRecord(GLOB.data_core.general, sortBy, order))
  var/blood_type = ""
  var/b_dna = ""
  for(var/datum/data/record/E in GLOB.data_core.medical)
    if((E.fields["name"] == R.fields["name"] && E.fields["id"] == R.fields["id"]))
      blood_type = E.fields["blood_type"]
      b_dna = E.fields["b_dna"]
  var/background

  if(R.fields["m_stat"] == "*Insane*" || R.fields["p_stat"] == "*Deceased*")
    background = "'background-color:#990000;'"
  else if(R.fields["p_stat"] == "*Unconscious*" || R.fields["m_stat"] == "*Unstable*")
    background = "'background-color:#CD6500;'"
  else if(R.fields["p_stat"] == "Physically Unfit" || R.fields["m_stat"] == "*Watch*")
    background = "'background-color:#3BB9FF;'"
  else
    background = "'background-color:#4F7529;'"

  dat += text("<tr style=[]><td><A href='?src=[REF(src)];d_rec=[]'>[]</a></td>", background, R.fields["id"], R.fields["name"])
  dat += text("<td>[]</td>", R.fields["id"])
  dat += text("<td><b>F:</b> []<BR><b>D:</b> []</td>", R.fields["fingerprint"], b_dna)
  dat += text("<td>[]</td>", blood_type)
  dat += text("<td>[]</td>", R.fields["p_stat"])
  dat += text("<td>[]</td></tr>", R.fields["m_stat"])
*/
  const [
    status,
    setStatus,
  ] = useSharedState(context,"status", { cursorAt: -1 });

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

    logger.log("target = " + target + "address= " + address + " cell=" + printCords(cell));
    //+ " x=" + pos.x - rect.left + " y=" +  pos.y - rect.top + " address=" + address);
    setStatus({ cursorAt: address});

    return false;
  }

  const returnFiled = cell => { // {fields[name]}
  //const field_size = * magic.cxFactor + "px";
    return cell.type == "field" ?
      (<input  class="lu3270_input" size={cell.field_length} maxlength={cell.field_length} length={cell.field_length}  style={{ 'border-bottom': '1px solid ' + cell.style.color}} />) : (<span style={cell.style}>{cell.text}</span>);
  };


  return (
    <Box fillPositionedParent >
      <Flex direction="column" height="100%" className="lu360_root" onClick={e=> onMouseClick(e)}>
            <Flex.Item grow={1} shrink={1}>
              <div class="lu3270" style={{ width:((numCols+1)*Constants.magic.cxFactor) + 'px', height:((numRows+1)*Constants.magic.cyFactor) + 'px'}}>
                  <Flex>
                    {
                    test_screen.map((row, y) =>
                    (<Flex.Item grow={1} key={"row_" + y}>
                      {
                      row.map((cell,x) =>
                      (<Box inline={1} key={"cell("+ x + "," + y + ")"} width={cell.field_length + "rem"}>
                          {returnFiled(cell)}
                      </Box>))
                    }
                    </Flex.Item>))
                    }
                  </Flex>
                </div>
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


