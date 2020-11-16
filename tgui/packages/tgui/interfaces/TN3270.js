import { Fragment } from 'inferno';
import { useBackend } from '../backend';
import { Button, Section } from '../components';
import { Window } from '../layouts';

 // all these magic numbers have to coordinate to
  // properly scale the 3270 font

  const magic = {
    cxFactor: 9.65625,
    cyFactor: 21,
    nominalFontSize: 18,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8
  };


const Color = {
  NEUTRAL   = 0x00,
  BLUE      = 0xF1,
  RED       = 0xF2,
  PINK      = 0xF3,
  GREEN     = 0xF4,
  TURQUOISE = 0xF5,
  YELLOW    = 0xF6,
  WHITE     = 0xF7
};

const Command = {
  EAU = 0x6F,
  EW  = 0xF5,
  EWA = 0x7E,
  W   = 0xF1,
  WSF = 0xF3
};

const Highlight = {
  BLINK      = 0xF1,
  REVERSE    = 0xF2,
  UNDERSCORE = 0xF4
};

const Op = {
  Q       = 0x02,
  QL      = 0x03,
  RB      = 0xF2,
  RM      = 0xF6,
  RMA     = 0x6E,
  UNKNOWN = 0xFF
};

cosnt Order = {
  SF  = 0x1D,
  SFE = 0x29,
  SBA = 0x11,
  SA  = 0x28,
  MF  = 0x2C,
  IC  = 0x13,
  PT  = 0x05,
  RA  = 0x3C,
  EUA = 0x12,
  GE  = 0x08
};

const QCode = {
  ALPHANUMERIC_PARTITIONS = 0x84,
  CHARACTER_SETS = 0x85,
  COLOR = 0x86,
  DDM = 0x95,
  HIGHLIGHTING = 0x87,
  IMPLICIT_PARTITION = 0xA6,
  REPLY_MODES = 0x88,
  RPQ_NAMES = 0xA1,
  SUMMARY = 0x80,
  USABLE_AREA = 0x81
}

const TypeCode ={
  BASIC     = 0xC0,
  HIGHLIGHT = 0x41,
  COLOR     = 0x42
};

const SFID = {
  QUERY_REPLY    = 0x81,
  READ_PARTITION = 0x01
};
const host_create = {
  'color': 'var(--lu3270-color)',
  'display': 'block',
  'font-family': '3270 Font',
  'font-size': '18px',
  'overflow': 'auto',
};

const grid_create = (width,height, keyboardLocked=false) => {
  width = width || 80;
  height = height || 24;
  return {
    'cursor': keyboardLocked ? 'not-allowed' : 'default',
    'align-items': 'start',
    'justify-content': 'center',
    'display':'-ms-grid',
    'display':'grid',
      /* IE repeat syntax */
    '-ms-grid-columns': '(20px)[' + width + ']',
    '-ms-grid-rows': '(20px)[' + height + ']',
  /* Modern repeat syntax */
    'grid-template-columns': '1fr repeat(3, 20px 1fr)',
    'border':'solid 1px #000',
  } ;
}

class Attributes {
  constructor(protect = false,
    numeric = false,
    highlight = false,
    hidden = false,
    modified = false,
    blink = false,
    reverse = false,
    underscore = false,
    color = Color.NEUTRAL) {
      this.protect = protect;
      this.numeric = numeric;
      this. highlight = highlight;
      this.hidden = hidden;
      this.modified = modified;
      this.blink = blink;
      this.reverse = falreversese;
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
      byte &= 0b00100000;
    if (this.numeric)
      byte &= 0b00010000;
    if (this.highlight)
      byte &= 0b00001000;
    if (this.hidden)
      byte &= 0b00001100;
    if (this.modified)
      byte &= 0b00000001;
    return six2e[byte];
  }

  /** Convert to CSS */
  toCSS(cell,cursorAt, focused) {
    const style = { };
    if (cursorAt) {
      if (this.hidden) {
        style.backgroundColor = 'var(--lu3270-color)';
        style.color = 'var(--lu3270-color)';
      }
      else if (focused) {
        style.backgroundColor = 'var(--lu3270-color)';
        style.color = 'var(--background-color)';
      }
      style.outline = '1px solid var(--lu3270-color)';
    }
    else if (this.hidden) {
      style.backgroundColor = 'var(--background-color)';
      style.color = 'var(--background-color)';
    }
    else if (!cell.attribute) {
      if (this.highlight)
        style.fontWeight = '900';
      if (this.blink)
        style.animation = 'blink 1s linear infinite';
      if (this.underscore)
        style.textDecoration = 'underline';
      switch (this.color) {
        case Color.BLUE:
          style.color = style.highlight? 'var(--mat-blue-400)' : 'var(--mat-blue-300)';
          break;
        case Color.RED:
          // NOTE: subjective compensation for relative low-intensity
          style.color = style.highlight? 'var(--mat-red-500)' : 'var(--mat-red-400)';
          break;
        case Color.PINK:
          style.color = style.highlight? 'var(--mat-pink-400)' : 'var(--mat-pink-300)';
          break;
        case Color.GREEN:
          style.color = style.highlight? 'var(--mat-green-400)' : 'var(--mat-green-300)';
          break;
        case Color.TURQUOISE:
          style.color = style.highlight? 'var(--mat-cyan-400)' : 'var(--mat-cyan-300)';
          break;
        case Color.YELLOW:
          style.color = style.highlight? 'var(--mat-yellow-400)' : 'var(--mat-yellow-300)';
          break;
        case Color.WHITE:
          style.color = style.highlight? 'white' : 'var(--mat-grey-100)';
          break;
        default:
          if (style.highlight)
            style.color = 'var(--lu3270-highlight-color)';
      }
      if (cell.value && this.reverse) {
        style.backgroundColor = style.color? style.color : 'var(--lu3270-color)';
        style.color = 'var(--mat-grey-900)';
      }
    }
    return style;
  };

  /** String dump, for testing */
  toString() {
    return `ATTR=[${this.protect? 'PROT ' : ''}${this.numeric? 'NUM ' : ''}${this.highlight? 'HILITE ' : ''}${this.hidden? 'HIDDEN ' : ''}${this.modified? 'MDT ' : ''}${this.blink? 'BLINK ' : ''}${this.reverse? 'REV ' : ''}${this.underscore? 'USCORE ' : ''}${Color[this.color]}]`;
  }
};
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
  };
};

const
const generateInitalScreen = (width, height) => {
  let allcells = [];
  for(var i=0; i < (width*height);i++)
    allcells.push(new Cell());
    return allcells;
};

const Screen = (props, context) => {
  const grid_create = grid_create(80,24,false);

  const [
    settings,
  ] = useSharedState(context,"screen_settings", { width: 80, height: 24, color: 'green', });

  const [
    status,
  ] = useSharedState(context,"screen_status", { cursorAt: -1, focused: false, });

  const [
    cells,
  ] = useSharedState(context,"screen_chars", generateInitalScreen(settings.width,settings.height));


  /*
    (click)="cursorAt($event.srcElement?.id)"
    (window:keydown)="keystroke($event)"
  */
  return (
    <Box style={grid_create}>
      {cells.map((cell,i) => (
        <Box

          key={i}
          id={'cell' + i}
          style={cell.attributes.toCSS(cell, status.cursorAt = i,status.focused)}>
          {cell.value}
        </Box>)
      )};
    </Box>
  );
};

<div
    [id]="'cell' + ix"
    [ngStyle]="cell.toCSS(status.cursorAt === ix, status.focused)"
    *ngFor="let cell of screen.cells; let ix = index">
    {{ cell.value? cell.value : '\u00a0' }}
  </div>
    </Box>


  );
  <div

  [ngStyle]="{cursor: status.keyboardLocked? 'not-allowed' : 'default'}"
  *ngIf="status.connected; else ready"
  class="cells">

  <div
    [id]="'cell' + ix"
    [ngStyle]="cell.toCSS(status.cursorAt === ix, status.focused)"
    *ngFor="let cell of screen.cells; let ix = index">
    {{ cell.value? cell.value : '\u00a0' }}
  </div>

</div>
};

export const TN3270 = (props, context) => {
  const { act, data } = useBackend(context);
  const {
    minutes,
    seconds,
    timing,
    loop,
  } = data;
  return (
    <Window
      width={275}
      height={115}>
      <Window.Content>
        <Section
          title="Timing Unit"
          buttons={(
            <Fragment>
              <Button
                icon={'sync'}
                content={loop ? 'Repeating' : 'Repeat'}
                selected={loop}
                onClick={() => act('repeat')} />
              <Button
                icon={"clock-o"}
                content={timing ? 'Stop' : 'Start'}
                selected={timing}
                onClick={() => act('time')} />
            </Fragment>
          )}>
          <Button
            icon="fast-backward"
            disabled={timing}
            onClick={() => act('input', { adjust: -30 })} />
          <Button
            icon="backward"
            disabled={timing}
            onClick={() => act('input', { adjust: -1 })} />
          {' '}
          {String(minutes).padStart(2, '0')}:
          {String(seconds).padStart(2, '0')}
          {' '}
          <Button
            icon="forward"
            disabled={timing}
            onClick={() => act('input', { adjust: 1 })} />
          <Button
            icon="fast-forward"
            disabled={timing}
            onClick={() => act('input', { adjust: 30 })} />
        </Section>
      </Window.Content>
    </Window>
  );
};
