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
];
const FPS = 30;
const Q = 10;
class Slots extends Component {
  constructor(props,context) {
    super(props,context);
    this.slot_ref = createRef();
    this.slots = [];
    this.total_height = symbols.length * 32;
    this.display_height = 5 * 32;


    let slots = [];
    for(let i=0; i < symbols.length; i++) {
      slots[i] = { sheet: symbols[i].sheet, sprite: symbols[i].sprite, index : i };
    }
    this.state = {
      'pos': 64,
      'slots': slots,
    };
  };
  componentDidMount() {
    logger.log("Do we have animate? " + this.slot_ref.current + " animate=" + this.slot_ref.current.hasOwnProperty('animate'));
  }
  tick() {
    if(!Array.isArray(this.state.slots)) {
      logger.log("Not a array!");
      clearTimeout(this.timer);
      return;
    }
    const currentValue = this.state.value;
    const targetValue = 96;
    const pos = currentValue * Q + targetValue * (1 - Q); // move 8 pixels?  is this smooth?
    if(pos >= 96) {
      let slots = [];
      for(let i = 1; i < this.state.slots.length-1; i++)
        slots.push(this.state.slots[i]);
      slots.push(this.state.slots[0])

      this.setState({'pos' : 64, 'slots': slots });
    } else {
      this.setState({'pos' : pos});
    }


  }

  componentDidMount() {
    this.timer = setInterval(()=> this.tick(), 1000 / FPS);
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

render() {
  const {
    className
  } = this.props;
  const slots = this.state.slots;

  return (
    <div class={classes(["digit-container", className])} ref={this.slot_ref}>
        {slots.map((el, idx) => {
          return (
            <div key={idx} class={classes([el.sheet,el.sprite])}
              width="32px" height="32px"
              style={{ transform: 'translateY(' + this.state.pos + ')'}}
              />
          );
        })}
    </div>
  );
  }
};

export class SlotMachine extends Component {
  constructor(props,context) {
    super(props,context);
    this.ref = createRef();
  }
  render() {
    return (
      <Window
        title="Slot Machine"
        width={800}
        height={600}>
        <Window.Content center>
          <Box fillPositionedParent>
            <Box left="90px">
        <div class="odometer">
          <div class="digit">
            <Slots className="slot-1" />
          </div>
          <div class="digit">
            <Slots className="slot-2" />
          </div>
          <div class="digit">
            <Slots className="slot-3" />
          </div>
          <div class="digit">
            <Slots className="slot-4" />
          </div>
          <div class="digit">
            <Slots  />
          </div>
        </div>
        </Box>
        </Box>
        </Window.Content>
      </Window>
    );
  }
}
export const SlotMachine2 = (props, context) => {
  const { act, data } = useBackend(context);
  const {
    enabled,
    dos_capacity,
    dos_overload,
    dos_crashed,
  } = data;
  return (
    <Window
      title="Slot Machine"
      width={800}
      height={600}>
      <Window.Content center>
        <Box fillPositionedParent>
          <Box left="90px">
      <div class="odometer">
        <div class="digit">
          <Slots className="slot-1" />
        </div>
        <div class="digit">
          <Slots className="slot-2" />
        </div>
        <div class="digit">
          <Slots className="slot-3" />
        </div>
        <div class="digit">
          <Slots className="slot-4" />
        </div>
        <div class="digit">
          <Slots className="slot-5" />
        </div>
      </div>
      </Box>
      </Box>
      </Window.Content>
    </Window>
  );
};
