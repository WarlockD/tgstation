import { useBackend } from '../backend';
import { classes } from 'common/react';
import { Component } from 'inferno';
import { Box, Button, ProgressBar, Section, AnimatedNumber, Flex } from '../components';
import { Window } from '../layouts';
import { createLogger } from '../logging';

const logger = createLogger('SlotMachine');

const FPS = 20;
const Q = 0.5;

const sprite_size = {
  width : 32,
  height : 32,
};

/*
.slot_machine32x64{display:inline-block;width:32px;
  height:64px;background:url
  ('asset.8aeb7e34cdc050c977c264d38ba9ecf2.png') no-repeat;}
.slot_machine32x32{display:inline-block;width:32px;
  height:32px;background:url
  ('asset.51dea3e08df0848810126f8a9c19e0d0.png') no-repeat;}
.slot_machine64x64{display:inline-block;width:64px;
  height:64px;background:url
  ('asset.c8fbfc014afb7eb6a15852066a8c1c1e.png') no-repeat;}
.slot_machine32x64.M1{background-position:-0px -0px;}
.slot_machine32x32.M2{background-position:-0px -0px;}
.slot_machine32x32.M3{background-position:-32px -0px;}
.slot_machine32x32.M4{background-position:-64px -0px;}
.slot_machine32x32.M5{background-position:-0px -32px;}
.slot_machine32x32.M6{background-position:-32px -32px;}
.slot_machine64x64.M7{background-position:-0px -0px;}
.slot_machine64x64.M8{background-position:-64px -0px;}
*/

const Symbol = (props, context) => {
  const {
    image,
    opacity,
    width,
    height,
    ...rest
  } = props;

  const spriteSheet = image.sheet;
  const matrix_trasform = 'rotate(' + image.rotate
    + 'deg) translate(' + image.x + 'px,' + image.y + 'px)';
  const sprite_trasform = {
    'transform': matrix_trasform,
    '-ms-transform': matrix_trasform,
    '-webkit-transform': matrix_trasform,
    'opacity': opacity || 1.0,
    'position': 'absolute',
    'backgroundColor': 'pink',
    'overflow': 'hidden',
    'width': width,
    'height': height,
  };
  return (
    <Flex
      className={classes([
        spriteSheet,
        image.sprite,
      ])}
      style={sprite_trasform} />
  );

};


class Reel extends Component {
  constructor(props, context) {
    super(props);
    this.targetRefs = [];
    this.speed = props.speed;
    this.step = props.step;
    this.maxSpeed = props.maxSpeed;
    this.finalPos = props.finalPos;
    this.timer = null;
    this.symbolHeight = this.props.height / 8;
    this.symbols = [
      { sheet: "slot_machine32x64", sprite: "M1", x: 0, y: 0, rotate: 0 },
      { sheet: "slot_machine32x64", sprite: "M2", x: 0, y: 0, rotate: 0 },
      { sheet: "slot_machine32x64", sprite: "M3", x: 0, y: 0, rotate: 0 },
      { sheet: "slot_machine32x64", sprite: "M4", x: 0, y: 0, rotate: 0 },
      { sheet: "slot_machine32x64", sprite: "M5", x: 0, y: 0, rotate: 0 },
      { sheet: "slot_machine32x64", sprite: "M6", x: 0, y: 0, rotate: 0 },
      { sheet: "slot_machine64x64", sprite: "M7", x: 0, y: 0, rotate: 0 },
      { sheet: "slot_machine64x64", sprite: "M8", x: 0, y: 0, rotate: 0 },
    ];
  }


  render() {
    return (
      <Flex backgroundColor="pink" overflow="hidden"
        width={this.props.width} height={this.props.height}>
        <Flex width={this.props.width}
          direction="column" grow={1}
          height={this.symbols.length * sprite_size.height}>
          {this.symbols.map((el, idx) => {
            return (<Flex.Item direction="column">
              <Symbol symbol={el} key={idx} index={idx}
              image={el}
              width={this.props.width} height={this.symbolHeight} />
              </Flex.Item>
              );
          })}
        </Flex>
      </Flex>
    );
  }
}

class ReelSet extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      width: props.width,
      height: props.height,
    };
    this.targetRefs = [];
    this.speed = props.speed || 20;
    this.step = props.step || 2;
    this.maxSpeed = props.maxSpeed || 50;
    this.finalPos = props.finalPos;
    this.timer = null;
  }

  renderReels() {
    const reelWidth = this.state.width / 100;
    return (
      <Reel width={reelWidth} height={this.state.height} />
    );
  }
  render() {
    logger.log("FUCK " + this.state.width + " ME " + this.state.height)
    return (
      <Flex direction="row" backgroundColor="orange" width={this.state.width} height={this.state.height}>
        {this.state.width && this.state.height && this.renderReels()}
      </Flex>
    );
  }
}

export const SlotMachine = (props, context) => {
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
      width={400}
      height={300}>
      <Window.Content>
        <ReelSet width={400} height={300}/>
      </Window.Content>
    </Window>
  );
};
