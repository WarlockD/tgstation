import { useBackend } from '../backend';
import { classes } from 'common/react';
import { Component, createRef } from 'inferno';
import { Box, Button, ProgressBar, Section, AnimatedNumber, Flex } from '../components';
import { Window } from '../layouts';
import { createLogger } from '../logging';

const logger = createLogger('SlotMachine');
/*
const Fsym = (props, context) => {
  const {
    image,
    ...rest
  } = props;
return <div className={classes([image.sheet,image.sprite])}></div>
};*/

const Fsym = (props, context) => {
  const {
    image,
  } = props;

  return (
      <div
      className={classes([
        image.sheet,image.sprite])}
        width="32px" height="32px" />
  );
  };

  /*
  {this.symbols.map((el, idx) => {
    return (<Flex.Item direction="column">
      <Symbol symbol={el} key={idx} index={idx}
      image={el}
      width={this.props.width} height={this.symbolHeight}
      ref={r => this.symbols_ref[idx] = r }
      />
      </Flex.Item>
      );
      */
/*
    some slot math
    32 Stop, 3 Reel:  32 x 32 x 32 = 32,768 combinations
    22 stop, 4 Reel:  22 x 22 x 22 x 22 = 234,256 combinations
    32 stop, 5 Reel:  32 x 32 x 32 x 32 x 32 = 33 million.
    As such we can fudge those odds by instead of haveing 32 "unique"
    symbols, that we can have multipul of others.
  */
 const slot_keyframes = [
   "slot-frame-1",
   "slot-frame-2",
   "slot-frame-3",
   "slot-frame-4",
   "slot-frame-5",
   "slot-frame-6",
   "slot-frame-7",
 ];

const symbols = [
  { sheet: "slot_machine32x32", sprite: "M2", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M3", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M4", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M5", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M6", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M2", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M3", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M4", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M5", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M6", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M2", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M3", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M4", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M5", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M6", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M2", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M3", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M4", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M5", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M6", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M2", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M3", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M4", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M5", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M6", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M2", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M3", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M4", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M5", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M6", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M2", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M3", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M4", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M5", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M6", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M2", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M3", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M4", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M5", x: 0, y: 0, rotate: 0 },
  { sheet: "slot_machine32x32", sprite: "M6", x: 0, y: 0, rotate: 0 },
];
const FPS = 30;
const Q = 3;


class Slots3 extends Component {
  constructor(props,context) {
    super(props,context);
    this.slot_ref = createRef();
    this.slots = [];
    this.total_height = symbols.length * 32;
    this.display_height = 5 * 32;


    let slots = [];
    for(let i=0; i < symbols.length; i++) {
      slots.push({ 'sheet': symbols[i].sheet, 'sprite': symbols[i].sprite, 'index' : i });
    }
    this.state = {
      'pos': -64,
      'slots': slots,
    };
  };
  tick() {
    if(!Array.isArray(this.state.slots)) {
      logger.log("Not a array!");
      clearTimeout(this.timer);
      return;
    }
    const pos = this.state.pos + 4; // move 8 pixels?  is this smooth?

    if(pos % 32) {
      logger.log("UPDATE!");
      let slots = this.state.slots.splice(0);
      slots.unshift(slots.pop());
      this.setState({'pos' : 64, 'slots': slots });
    } else {
      this.setState({'pos' : pos});
    }

    if(!Array.isArray(this.state.slots)) {
      logger.log("Not a array!");
      clearTimeout(this.timer);
      return;
    }
  }

  componentDidMount() {
    this.timer = setInterval(this.tick.bind(this), 400);
    logger.log("Do we have animate? " + this.slot_ref.current + " animate=" + this.slot_ref.current.hasOwnProperty('animate'));
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

render() {
  const {
    className
  } = this.props;
  const slots = this.state.slots;
//const default_fruits =  ["🍒", "🍉", "🍊", "🍓", "🍇", "🥝"];
  return (
    <div class={classes(["digit-container", className])} ref={this.slot_ref}>
        {slots.map((el, idx) => {
            if(!el){
              logger.log("bad obj " + el + " = " + idx);
              return null;
            }

          if(!el.hasOwnProperty('sheet') || !el.hasOwnProperty('sprite') ){
            logger.log("Do we have animate? " + idx);
            return null;
          }
          return (
            <div key={idx} class={classes([el.sheet,el.sprite])}
              width="32px" height="32px"
              style={{ transform: 'translateY(' + (this.state.pos*idx) + this.state.pos + ')'}}
              />
          );
        })}
    </div>
  );
  }
};
const create_animation = (idx,duration) => {
  const animation_text =  slot_keyframes[idx] + " infinite linear";
  const duration_text =  duration+ "ms";
  return {
    '-webkit-animation-duration': duration_text,
    'animation-duration': duration_text,
    '-webkit-animation': animation_text,
    'animation': animation_text,
    'animation-name': slot_keyframes[idx],
  }
};
const create_animation_name = (duration) => {
  const animation_text =  name + " infinite linear";
  const duration_text =  duration+ "ms";
  return {
    '-webkit-animation-duration': duration_text,
    'animation-duration': duration_text,
   // '-webkit-animation': animation_text,
    'animation-iteration-count': 'infinite',
    //'animation': animation_text,
    'animation-name': 'slot-frame-test',
   'animation-direction':    'inherit',
    'animation-fill-mode': 'forwards',
    'animation-timing-function': 'linear',
  }
};
const create_slot = i => {
  return {
    class: classes([symbols[i].sheet,symbols[i].sprite,"slot-mover"]),
    index: i,
    top: (i % 7) * 32 - 32, // raw starting position
    style: create_animation_name(900),
  }
};

class Slot extends Component {
  constructor(props,context) {
    super(props,context);
    this.timer = null;
    this.ref = createRef();
    this.item_center = Math.floor(symbols.length/2);
    this.total_height = Math.floor(symbols.length*32);
    this.center_height = Math.floor(this.total_height/2);
    let slots = [];
    for(let i=0; i < 7; i++) {
      slots.push(create_slot(i));
    }
    this.state = {
      slots:slots,
      pos:  0,
      pixel_offset: 0,
    }
  };
  tick() {
    // this is the new one
    const pos = (this.state.pos -1) < 0 ? symbols.length-1 : (this.state.pos -1);
    let slots = this.state.slots.slice(-1); // last one falls off
    slots.unshift(create_slot(pos));
    this.setState({ pos:pos, slots: slots});
    /*
    const pixels_to_move = 0.1* (1000 / FPS)
    const pixel_offset = (this.state.pixel_offset + pixels_to_move);
      this.setState({ pixel_offset: pixel_offset});
      */
  }
  componentDidMount() {
    this.timer = setInterval(this.tick.bind(this), 1000);
   // logger.log("Do we have animate? " + this.slot_ref.current + " animate=" + this.slot_ref.current.hasOwnProperty('animate'));
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }
  render() {

    const slot_length = this.state.slots.length;
    const slots = this.state.slots;
    return (
      <div class="slot-container">
        {slots.map((el, i) => {
            return  (
              <div key={i} class="slot-container-item" ref={el.style}>
                  <div class={el.class}  width="32px" height="32px" />
              </div>
            )
            })}
    </div>
    );
  }
}

export class SlotMachine extends Component {
  constructor(props,context) {
    super(props,context);
    this.timer = null;
    this.ref = createRef();
    this.item_center = Math.floor(symbols.length/2);
    let slots = [];
    for(let i=0; i < symbols.length; i++) {
      slots.push({
        ref: createRef(),
        sheet: symbols[i].sheet,
        sprite: symbols[i].sprite,
        style: {
          transform : 'translateY(' + (32 * (i - this.item_center)) + 'px)'
        },
      });
    }
    this.state = {
      slots:slots,
      selected:  this.item_center,
    }
  }
  tick() {
    const nidx = (this.state.selected + 1) % this.state.slots.length;
    this.setState({selected : nidx});
  }
  componentDidMount() {
    this.timer = setInterval(this.tick.bind(this), 400);
   // logger.log("Do we have animate? " + this.slot_ref.current + " animate=" + this.slot_ref.current.hasOwnProperty('animate'));
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }
  render() {
    return (
      <Window
        title="Slot Machine"
        width={320}
        height={320}>
        <Window.Content center>
          <Slot />
          <Slot />
          <Slot />
          <Slot />
          <Slot />
        </Window.Content>
      </Window>
    );
  }
}

