import { useBackend } from '../backend';
import { classes } from 'common/react';
import { Component, createRef } from 'inferno';
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

const Fsym = (props, context) => {
  const {
    image,
    ...rest
  } = props;
return <div className={classes([image.sheet,image.sprite])}></div>
};

const Symbol = (props, context) => {
  const {
    image,
    opacity,
    ...rest
  } = props;
  const got_to_be_a_better_way =  /^[^\d]+(\d+)x(\d+)/;
  const match = got_to_be_a_better_way.exec(image.sheet); //    slot_machine32x64
  const width = parseInt(match[1])
  const height = parseInt(match[2])

  const matrix_trasform =
    'scale(' + sprite_size.width/width +
    ',' + sprite_size.height/height +')';

 const sprite_trasform = {
    'transform': matrix_trasform,
    '-ms-transform': matrix_trasform,
    'backgroundColor': 'pink',
   // 'width': sprite_size.width +'px',
    //'height': sprite_size.height+'px',
    'min-height': '64px',
    'max-height': '64px',
    'margin': 'padding',
   //'margin': '4px 0',;
    'overflow': 'hidden', /* to hide the magic */
    //height: 29px; /* whatever the height of your list items are */
   // width: 300px;
    'position': 'absolute',
    'top' : '0px',
    'display': 'none'
  };
  const make_name = "." + image.sheet + "." +  image.sprite;
  return (
    <Flex.Item>
      <center>
      <div
      className={classes([
        image.sheet,
        image.sprite,
      ])}
      style={sprite_trasform} />

      </center>

    </Flex.Item>

);
};

const Slot = (props, context) => {


  return (
    <div className="SlotMachine__slot">
    <div clasNamee="SlotMachine__section">
        <div className="SlotMachine__container" ref={this.slotRef[1]}>
          {SlotTest.defaultProps.fruits.map(fruit => (
            <div>
              <span>{fruit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

};

class SlotTest extends Component {
  constructor(props, context) {
    super(props,context);
    this.state = { fruit1: "🍒", fruit2: "🍒", fruit3: "🍒", rolling: false };

    // get ref of dic onn which elements will roll
    this.slotRef = [createRef(), createRef(), createRef()];
  };

  // to trigger roolling and maintain state
  roll () {
    this.setState({
      rolling: true
    });
    setTimeout(() => {
      this.setState({ rolling: false });
    }, 700);

    // looping through all 3 slots to start rolling
    this.slotRef.forEach((slot, i) => {
      // this will trigger rolling effect
      const selected = this.triggerSlotRotation(slot.current);
      this.setState({ [`fruit${i + 1}`]: selected });
    });

  };

  // this will create a rolling effect and return random selected option
  triggerSlotRotation(ref)  {
    function setTop(top) {
      ref.style.top = top + "px";
    }
    let options = ref.children;
    let randomOption = Math.floor(
      Math.random() * SlotTest.defaultProps.fruits.length
    );
    let choosenOption = options[randomOption];
    setTop(-choosenOption.offsetTop + 2);
    return SlotTest.defaultProps.fruits[randomOption];
  };
  render() {
    return (
      <div className="SlotMachine">
        <div className="SlotMachine__slot">
          <div clasNamee="SlotMachine__section">
            <div className="SlotMachine__container" ref={this.slotRef[0]}>
              {SlotTest.defaultProps.fruits.map((fruit, i) => (
                <div key={i}>
                  <span>{fruit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="SlotMachine__slot">
        <div clasNamee="SlotMachine__section">
            <div className="SlotMachine__container" ref={this.slotRef[1]}>
              {SlotTest.defaultProps.fruits.map(fruit => (
                <div>
                  <span>{fruit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="SlotMachine__slot">
        <div clasNamee="SlotMachine__section">
            <div className="SlotMachine__container" ref={this.slotRef[2]}>
              {SlotTest.defaultProps.fruits.map(fruit => (
                <div>
                  <span>{fruit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div
          className="SlotMachine__roll SlotMachine__rolling"
          onClick={!this.state.rolling && this.roll.bind(this)}
          disabled={this.state.rolling}
        >
          {this.state.rolling ? "Rolling..." : "ROLL"}
        </div>
      </div>
    );
  }
};

SlotTest.defaultProps = {
  fruits: ["🍒", "🍉", "🍊", "🍓", "🍇", "🥝"]
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
    this.ref = createRef()
    this.symbols_ref = []
    this.symbols = [
      { sheet: "slot_machine32x64", sprite: "M1", x: 0, y: 0, rotate: 0 },
      { sheet: "slot_machine32x32", sprite: "M2", x: 0, y: 0, rotate: 0 },
      { sheet: "slot_machine32x32", sprite: "M3", x: 0, y: 0, rotate: 0 },
      { sheet: "slot_machine32x32", sprite: "M4", x: 0, y: 0, rotate: 0 },
      { sheet: "slot_machine32x32", sprite: "M5", x: 0, y: 0, rotate: 0 },
      { sheet: "slot_machine32x32", sprite: "M6", x: 0, y: 0, rotate: 0 },
      { sheet: "slot_machine64x64", sprite: "M7", x: 0, y: 0, rotate: 0 },
      { sheet: "slot_machine64x64", sprite: "M8", x: 0, y: 0, rotate: 0 },
    ];
  }
  popPushNItems(container, n) {
    if(this.symbols_ref.length == 0)
      return // no refs yet
    let children =this.symbols_ref
    children.slice(0, n).insertAfter(children.last());

    if (n === children.length) {
      this.popPushNItems(container, 1);
    }
  }

  // After the slide animation is complete, we want to pop some items off
  // the front of the container and push them onto the end. This is
  // so the animation can slide upward infinitely without adding
  // inifinte div elements inside the container.
  rotateContents(container, n) {
    setTimeout(() => {
      this.popPushNItems(container, n);
        container.css({top: 0});
    }, 300);
  }

  randomSlotttIndex(max) {
    const randIndex = (Math.random() * max | 0);
    return (randIndex > 10) ? randIndex : this.randomSlotttIndex(max);
  }
  animate() {
    if(this.ref.n==null) {
      logger.log("BIG MONEY! FAIL")
        return
    }
    let wordIndex = this.randomSlotttIndex(symbols_ref.length);
    this.ref.animate({top: -wordIndex*150}, 500, 'swing',
    () => {
      this.rotateContents(this.symbols_ref, wordIndex);
    });
  }

  start_it(r) {
    logger.log("BIG MONEY!")
    this.ref.current = r
    setInterval(()=>{this.animate.bind()}, 2000);
    logger.log("BIG MONEY! 2")
  }

  render() {
    return (
      <Flex backgroundColor="white" overflow="hidden" style={{'position': 'absolute'}}
        ref={r => this.start_it(r) }>
        <Flex
          direction="column" grow={1}>

          {this.symbols.map((el, idx) => {
            return (<Flex.Item direction="column">
              <Symbol symbol={el} key={idx} index={idx}
              image={el}
              width={this.props.width} height={this.symbolHeight}
              ref={r => this.symbols_ref[idx] = r }
              />
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
    const reelWidth = this.state.width / 5;
    return (
      <span>
      <Reel width={reelWidth} height={this.state.height} />
      <Reel width={reelWidth} height={this.state.height} />
      <Reel width={reelWidth} height={this.state.height} />
      <Reel width={reelWidth} height={this.state.height} />
      <Reel width={reelWidth} height={this.state.height} />
      </span>

    );
  }
  render() {

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
      width={800}
      height={600}>
      <Window.Content>
        <SlotTest/>
      </Window.Content>
    </Window>
  );
};
